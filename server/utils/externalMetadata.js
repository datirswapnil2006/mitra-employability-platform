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
 * Extract Video and Web Resource Metadata with SSRF protection.
 * Supports YouTube, Vimeo, and standard public web links.
 */
const extractUrlMetadata = async (resourceUrl) => {
  if (!resourceUrl || typeof resourceUrl !== 'string') {
    throw new Error('Please provide a valid video or resource URL.');
  }

  const cleanUrl = resourceUrl.trim();

  if (!isSafePublicUrl(cleanUrl)) {
    throw new Error('Unsafe or invalid URL provided. Internal and private network URLs are blocked for security.');
  }

  // 1. YouTube Detection
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = cleanUrl.match(ytRegex);

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
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
      // Fallback: we still have the valid videoId and high quality thumbnail URL
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

  // 2. Vimeo Detection
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

  // 3. General Public Web Link / PDF
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

module.exports = { isSafePublicUrl, extractUrlMetadata };
