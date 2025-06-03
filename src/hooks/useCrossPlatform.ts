/**
 * Cross-Platform Hooks for Admin Dashboard
 * React hooks that provide cross-platform functionality
 */

import { useState, useEffect } from 'react';

// Local type definitions to avoid circular imports
export interface PlatformCapabilities {
  platform: 'web' | 'mobile' | 'desktop';
  hasNotifications: boolean;
  hasClipboard: boolean;
  hasShare: boolean;
  hasDeepLinking: boolean;
  canOpenExternalLinks: boolean;
  orientation: 'portrait' | 'landscape' | 'any';
  screenSize: 'small' | 'medium' | 'large';
}

export interface ShareContent {
  title: string;
  text: string;
  url?: string;
  data?: any;
}

/**
 * Hook for platform detection and capabilities
 */
export function usePlatformCapabilities(): PlatformCapabilities {
  const [capabilities, setCapabilities] = useState<PlatformCapabilities>(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
    const screenSize =
      typeof window !== 'undefined'
        ? window.innerWidth < 768
          ? 'small'
          : window.innerWidth < 1024
            ? 'medium'
            : 'large'
        : 'large';

    return {
      platform: isMobile ? 'mobile' : 'web',
      hasNotifications: typeof window !== 'undefined' && 'Notification' in window,
      hasClipboard: typeof navigator !== 'undefined' && !!navigator.clipboard,
      hasShare: typeof navigator !== 'undefined' && !!navigator.share,
      hasDeepLinking: typeof window !== 'undefined' && !!window.location,
      canOpenExternalLinks: typeof window !== 'undefined',
      orientation: isMobile ? 'portrait' : 'any',
      screenSize: screenSize as 'small' | 'medium' | 'large',
    };
  });

  useEffect(() => {
    const updateCapabilities = () => {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
      const screenSize =
        typeof window !== 'undefined'
          ? window.innerWidth < 768
            ? 'small'
            : window.innerWidth < 1024
              ? 'medium'
              : 'large'
          : 'large';

      setCapabilities({
        platform: isMobile ? 'mobile' : 'web',
        hasNotifications: typeof window !== 'undefined' && 'Notification' in window,
        hasClipboard: typeof navigator !== 'undefined' && !!navigator.clipboard,
        hasShare: typeof navigator !== 'undefined' && !!navigator.share,
        hasDeepLinking: typeof window !== 'undefined' && !!window.location,
        canOpenExternalLinks: typeof window !== 'undefined',
        orientation: isMobile ? 'portrait' : 'any',
        screenSize: screenSize as 'small' | 'medium' | 'large',
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateCapabilities);
      window.addEventListener('orientationchange', updateCapabilities);

      return () => {
        window.removeEventListener('resize', updateCapabilities);
        window.removeEventListener('orientationchange', updateCapabilities);
      };
    }
  }, []);

  return capabilities;
}

/**
 * Simple hook for responsive design breakpoints
 */
export function useCrossPlatform() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    windowSize,
  };
}

export default {
  usePlatformCapabilities,
  useCrossPlatform,
};
