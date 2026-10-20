const axios = require('axios');
const { URL } = require('url');

/**
 * SSRF Safety Validator:
 * Ensures the target URL is a safe public HTTP/HTTPS endpoint and does not point to internal/private IP ranges.
 */
const isSafePublicUrl = (targetUrl) => {
  try {
    const parsed = new URL(targetUrl);

    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, loopback, and local domain names
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.corp') ||
      hostname.endsWith('.lan')
    ) {
      return false;
    }

    // Block IPv4 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      if (octet1 === 10) return false;
      if (octet1 === 127) return false;
      if (octet1 === 169 && octet2 === 254) return false;
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false;
      if (octet1 === 192 && octet2 === 168) return false;
      if (octet1 === 0) return false;
    }

    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Extracts a YouTube playlist ID from various YouTube URL formats.
 * e.g.,
 * https://www.youtube.com/playlist?list=PLBlnK6fEyqRhqJPDXcvYlLfXPh37L89g3
 * https://www.youtube.com/watch?v=xxx&list=PLBlnK6fEyqRhqJPDXcvYlLfXPh37L89g3
 * https://youtu.be/xxx?list=PLBlnK6fEyqRhqJPDXcvYlLfXPh37L89g3
 */
const extractPlaylistId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();

  try {
    const parsed = new URL(clean);
    const listParam = parsed.searchParams.get('list');
    if (listParam && listParam.length >= 2) {
      return listParam;
    }
  } catch (e) {
    // Fallback regex
  }

  const match = clean.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
};

/**
 * Extract Video and Web Resource Metadata with SSRF protection.
 * Supports YouTube Playlists, YouTube Videos, Vimeo, and standard public web links.
 */
const extractUrlMetadata = async (resourceUrl) => {
  if (!resourceUrl || typeof resourceUrl !== 'string') {
    throw new Error('Please provide a valid video or resource URL.');
  }

  const cleanUrl = resourceUrl.trim();

  if (!isSafePublicUrl(cleanUrl)) {
    throw new Error('Unsafe or invalid URL provided. Internal and private network URLs are blocked for security.');
  }

  // 1. YouTube Playlist Detection
  const playlistId = extractPlaylistId(cleanUrl);
  if (playlistId) {
    let title = '';
    let description = '';
    let channelTitle = '';
    let thumbnailUrl = '';
    let videos = [];

    // Try fetching YouTube Atom RSS feed (Official public endpoint, no API key required)
    try {
      const feedRes = await axios.get(
        `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`,
        {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        }
      );

      if (feedRes.data && typeof feedRes.data === 'string') {
        const xml = feedRes.data;
        const feedTitleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title>([^<]+)<\/title>/);
        if (feedTitleMatch) title = feedTitleMatch[1].trim();

        const authorMatch = xml.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/);
        if (authorMatch) channelTitle = authorMatch[1].trim();

        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let entryMatch;
        while ((entryMatch = entryRegex.exec(xml)) !== null) {
          const entryXml = entryMatch[1];
          const vIdMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const vTitleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
          const vThumbMatch = entryXml.match(/<media:thumbnail[^>]+url="([^"]+)"/);

          if (vIdMatch && vIdMatch[1]) {
            const vId = vIdMatch[1];
            const vTitle = vTitleMatch ? vTitleMatch[1] : `Lecture ${videos.length + 1}`;
            const vThumb = vThumbMatch ? vThumbMatch[1] : `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
            videos.push({
              videoId: vId,
              title: vTitle,
              thumbnailUrl: vThumb,
              watchUrl: `https://www.youtube.com/watch?v=${vId}&list=${playlistId}`
            });
          }
        }

        if (videos.length > 0) {
          thumbnailUrl = videos[0].thumbnailUrl;
        }
      }
    } catch (feedErr) {
      // Feed query failed or playlist has 0 public items, fallback to oEmbed
    }

    // Fallback: oEmbed for playlist title & channel if RSS didn't supply them
    if (!title || !thumbnailUrl) {
      try {
        const oembedRes = await axios.get(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${playlistId}&format=json`,
          { timeout: 4000, headers: { 'User-Agent': 'MITRA-Portal/2.0' } }
        );
        if (oembedRes.data) {
          if (!title && oembedRes.data.title) title = oembedRes.data.title;
          if (!channelTitle && oembedRes.data.author_name) channelTitle = oembedRes.data.author_name;
          if (!thumbnailUrl && oembedRes.data.thumbnail_url) thumbnailUrl = oembedRes.data.thumbnail_url;
        }
      } catch (oembedErr) {
        // Continue to final fallback
      }
    }

    if (!title) {
      title = `YouTube Playlist (${playlistId})`;
    }
    if (!thumbnailUrl) {
      thumbnailUrl = videos.length > 0 && videos[0].videoId
        ? `https://i.ytimg.com/vi/${videos[0].videoId}/hqdefault.jpg`
        : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80';
    }
    description = `Complete YouTube Playlist • ${channelTitle || 'Curated Domain Lectures'}`;

    return {
      title,
      description,
      thumbnailUrl,
      resourceType: 'playlist',
      provider: 'youtube',
      playlistId,
      playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistId}`,
      channelTitle: channelTitle || 'YouTube Channel',
      videoCount: videos.length,
      videos
    };
  }

  // 2. Individual YouTube Video Detection
  let ytVideoId = null;
  try {
    const parsed = new URL(cleanUrl);
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      if (parsed.hostname.includes('youtu.be')) {
        ytVideoId = parsed.pathname.slice(1).split(/[?#&/]/)[0];
      } else if (parsed.pathname.startsWith('/live/')) {
        ytVideoId = parsed.pathname.replace('/live/', '').split(/[?#&/]/)[0];
      } else if (parsed.pathname.startsWith('/shorts/')) {
        ytVideoId = parsed.pathname.replace('/shorts/', '').split(/[?#&/]/)[0];
      } else if (parsed.pathname.startsWith('/embed/')) {
        ytVideoId = parsed.pathname.replace('/embed/', '').split(/[?#&/]/)[0];
      } else if (parsed.pathname.startsWith('/v/')) {
        ytVideoId = parsed.pathname.replace('/v/', '').split(/[?#&/]/)[0];
      } else if (parsed.searchParams.get('v')) {
        ytVideoId = parsed.searchParams.get('v');
      }
    }
  } catch (e) {
    // Fallback regex
  }

  if (!ytVideoId) {
    const ytRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/|.+\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const ytMatch = cleanUrl.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      ytVideoId = ytMatch[1];
    }
  }

  if (ytVideoId && ytVideoId.length === 11) {
    const videoId = ytVideoId;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    let title = `YouTube Lecture (${videoId})`;
    let description = 'YouTube Video Training Resource';
    let authorName = 'YouTube Instructor';

    try {
      const oembedRes = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { timeout: 4000, headers: { 'User-Agent': 'MITRA-Portal/2.0' } }
      );
      if (oembedRes.data) {
        if (oembedRes.data.title) title = oembedRes.data.title;
        if (oembedRes.data.author_name) authorName = oembedRes.data.author_name;
      }
    } catch (oembedErr) {
      // Fallback
    }

    return {
      title,
      description: `Instructor / Channel: ${authorName}`,
      thumbnailUrl,
      resourceType: 'video',
      provider: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`
    };
  }

  // 3. Vimeo Detection
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/;
  const vimeoMatch = cleanUrl.match(vimeoRegex);

  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3];
    try {
      const vimeoRes = await axios.get(
        `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`,
        { timeout: 4000, headers: { 'User-Agent': 'MITRA-Portal/2.0' } }
      );
      return {
        title: vimeoRes.data?.title || `Vimeo Video (${videoId})`,
        description: vimeoRes.data?.description || `Vimeo Video Training Resource by ${vimeoRes.data?.author_name || 'Instructor'}`,
        thumbnailUrl: vimeoRes.data?.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
        resourceType: 'video',
        provider: 'vimeo',
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}`
      };
    } catch (err) {
      return {
        title: `Vimeo Lecture (${videoId})`,
        description: 'Vimeo Video Resource',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
        resourceType: 'video',
        provider: 'vimeo',
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}`
      };
    }
  }

  // 4. General Public Web Link / PDF
  let resourceType = 'link';
  let title = 'External Study Material';

  if (cleanUrl.toLowerCase().endsWith('.pdf') || cleanUrl.toLowerCase().includes('.pdf?')) {
    resourceType = 'pdf';
    title = 'Reference Document / PDF Notes';
  } else if (cleanUrl.toLowerCase().includes('github.com')) {
    resourceType = 'code';
    title = 'Code Repository / Exercise';
  }

  return {
    title,
    description: `Reference Link: ${cleanUrl}`,
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    resourceType,
    provider: 'external',
    embedUrl: cleanUrl
  };
};

module.exports = { isSafePublicUrl, extractPlaylistId, extractUrlMetadata };
