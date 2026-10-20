/**
 * MITRA Employability Platform - Video and Playlist Utilities
 * Securely transforms and validates YouTube (videos and playlists) & Vimeo URLs for safe embedding.
 */

/**
 * Validates whether a URL is a valid, supported video resource (YouTube or Vimeo).
 */
export const validateVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return { valid: false, error: 'Video URL is required' };
  const clean = url.trim();

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();

    if (
      host.includes('youtube.com') ||
      host.includes('youtu.be') ||
      host.includes('vimeo.com')
    ) {
      return { valid: true, error: null };
    }

    return {
      valid: false,
      error: 'Please enter a valid YouTube video/playlist URL or Vimeo URL.'
    };
  } catch {
    return {
      valid: false,
      error: 'Please enter a valid URL (e.g. https://www.youtube.com/watch?v=... or https://www.youtube.com/playlist?list=...)'
    };
  }
};

/**
 * Checks if a given URL is a YouTube playlist.
 */
export const isPlaylistUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('list=') || url.includes('/playlist');
};

/**
 * Extracts YouTube playlist ID from URL.
 */
export const extractPlaylistId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
};


/**
 * Transforms any YouTube (watch, embed, short, live, playlist) or Vimeo link into a secure iframe embed URL.
 * Securely handles playlists with `videoseries?list=` and video+playlist with `${videoId}?list=`.
 */
export const getEmbedVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();

    // YouTube handling
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const listId = parsed.searchParams.get('list');
      let videoId = null;

      if (host.includes('youtu.be')) {
        videoId = parsed.pathname.slice(1).split(/[?#&/]/)[0];
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.replace('/embed/', '').split(/[?#&/]/)[0];
      } else if (
        parsed.pathname.startsWith('/live/') ||
        parsed.pathname.startsWith('/shorts/') ||
        parsed.pathname.startsWith('/v/')
      ) {
        const parts = parsed.pathname.split('/').filter(Boolean);
        videoId = parts[1] || null;
      } else {
        videoId = parsed.searchParams.get('v');
      }

      // 1. Both Video and Playlist
      if (videoId && listId) {
        return `https://www.youtube.com/embed/${videoId}?list=${listId}&rel=0&modestbranding=1`;
      }
      // 2. Pure Playlist (no specific video)
      if (listId && !videoId) {
        return `https://www.youtube.com/embed/videoseries?list=${listId}&rel=0&modestbranding=1`;
      }
      // 3. Single YouTube Video
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    }

    // Vimeo handling
    if (host.includes('vimeo.com')) {
      const match = clean.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
      if (match && match[3]) {
        return `https://player.vimeo.com/video/${match[3]}?title=0&byline=0&portrait=0`;
      }
    }
  } catch (err) {
    // Regex fallbacks if URL parsing throws
    const listMatch = clean.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const videoMatch = clean.match(/(?:watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    if (videoMatch && listMatch) {
      return `https://www.youtube.com/embed/${videoMatch[1]}?list=${listMatch[1]}&rel=0&modestbranding=1`;
    }
    if (listMatch) {
      return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}&rel=0&modestbranding=1`;
    }
    if (videoMatch) {
      return `https://www.youtube.com/embed/${videoMatch[1]}?rel=0&modestbranding=1`;
    }
  }

  return clean;
};

/**
 * Gets a clean direct external link for YouTube/Vimeo in case students/admins wish to open externally.
 */
export const getExternalWatchUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.trim();
};
