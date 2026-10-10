import { useState, useEffect, useCallback } from 'react';

/**
 * Checks if the browser is currently in fullscreen mode.
 */
export const isFullscreenActive = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

/**
 * Requests fullscreen mode on the document root element.
 * Gracefully handles permissions or rejection without throwing unhandled exceptions.
 */
export const enterFullscreen = async (element = null) => {
  if (typeof document === 'undefined') return false;
  const isDomElement = element && typeof element === 'object' && ('requestFullscreen' in element || (typeof Element !== 'undefined' && element instanceof Element));
  const target = isDomElement ? element : document.documentElement;
  try {
    if (isFullscreenActive()) return true;

    if (target.requestFullscreen) {
      await target.requestFullscreen();
    } else if (target.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen();
    } else if (target.mozRequestFullScreen) {
      await target.mozRequestFullScreen();
    } else if (target.msRequestFullscreen) {
      await target.msRequestFullscreen();
    }
    return true;
  } catch (err) {
    console.warn('Browser prevented entering fullscreen:', err?.message || err);
    return false;
  }
};

/**
 * Exits fullscreen mode if currently active.
 */
export const exitFullscreen = async () => {
  if (typeof document === 'undefined') return false;
  try {
    if (!isFullscreenActive()) return true;

    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }
    return true;
  } catch (err) {
    console.warn('Browser prevented exiting fullscreen:', err?.message || err);
    return false;
  }
};

/**
 * Toggles fullscreen mode on or off.
 */
export const toggleFullscreen = async (element = null) => {
  const isDomElement = element && typeof element === 'object' && ('requestFullscreen' in element || (typeof Element !== 'undefined' && element instanceof Element));
  const target = isDomElement ? element : null;
  if (isFullscreenActive()) {
    return await exitFullscreen();
  } else {
    return await enterFullscreen(target);
  }
};

/**
 * Custom React hook for tracking and toggling fullscreen status in UI components.
 */
export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(() => isFullscreenActive());

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(isFullscreenActive());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Initial check
    setIsFullscreen(isFullscreenActive());

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleEnter = useCallback(async (el) => {
    const isDomElement = el && typeof el === 'object' && ('requestFullscreen' in el || (typeof Element !== 'undefined' && el instanceof Element));
    const res = await enterFullscreen(isDomElement ? el : null);
    setIsFullscreen(isFullscreenActive());
    return res;
  }, []);

  const handleExit = useCallback(async () => {
    const res = await exitFullscreen();
    setIsFullscreen(isFullscreenActive());
    return res;
  }, []);

  const handleToggle = useCallback(async (el) => {
    const isDomElement = el && typeof el === 'object' && ('requestFullscreen' in el || (typeof Element !== 'undefined' && el instanceof Element));
    const res = await toggleFullscreen(isDomElement ? el : null);
    setIsFullscreen(isFullscreenActive());
    return res;
  }, []);

  return {
    isFullscreen,
    enterFullscreen: handleEnter,
    exitFullscreen: handleExit,
    toggleFullscreen: handleToggle
  };
};
