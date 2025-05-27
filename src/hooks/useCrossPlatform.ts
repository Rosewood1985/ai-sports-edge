/**
 * Cross-Platform Hooks for Admin Dashboard
 * React hooks that provide cross-platform functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { crossPlatformService, PlatformCapabilities, ShareContent } from '../services/crossPlatformService';

/**
 * Hook for platform detection and capabilities
 */
export function usePlatformCapabilities(): PlatformCapabilities {
  const [capabilities, setCapabilities] = useState<PlatformCapabilities>(
    crossPlatformService.getCapabilities()
  );

  useEffect(() => {
    // Update capabilities on window resize or orientation change
    const updateCapabilities = () => {
      setCapabilities(crossPlatformService.getCapabilities());
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
 * Hook for cross-platform navigation
 */
export function useCrossPlatformNavigation() {
  const navigation = crossPlatformService.getNavigation();

  const navigateToSection = useCallback(async (section: string) => {
    await navigation.navigateToAdmin(section);
  }, [navigation]);

  const navigateToReport = useCallback(async (reportId: string) => {
    await navigation.navigateToReport(reportId);
  }, [navigation]);

  const navigateToUser = useCallback(async (userId: string) => {
    await navigation.navigateToUser(userId);
  }, [navigation]);

  const navigateToAnalytics = useCallback(async (view?: string) => {
    await navigation.navigateToAnalytics(view);
  }, [navigation]);

  const openExternalLink = useCallback(async (url: string) => {
    await navigation.openExternalLink(url);
  }, [navigation]);

  const shareContent = useCallback(async (content: ShareContent): Promise<boolean> => {
    return navigation.shareContent(content);
  }, [navigation]);

  return {
    navigateToSection,
    navigateToReport,
    navigateToUser,
    navigateToAnalytics,
    openExternalLink,
    shareContent,
  };
}

/**
 * Hook for cross-platform authentication
 */
export function useCrossPlatformAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);

  const auth = crossPlatformService.getAuth();

  const validateSession = useCallback(async () => {
    setIsValidating(true);
    try {
      const currentToken = await auth.getToken();
      if (currentToken) {
        const isValid = await auth.validateSession();
        setIsAuthenticated(isValid);
        setToken(isValid ? currentToken : null);
        
        if (!isValid) {
          await auth.clearToken();
        }
      } else {
        setIsAuthenticated(false);
        setToken(null);
      }
    } catch (error) {
      console.error('Error validating session:', error);
      setIsAuthenticated(false);
      setToken(null);
    } finally {
      setIsValidating(false);
    }
  }, [auth]);

  const login = useCallback(async (newToken: string) => {
    await auth.syncToken(newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  }, [auth]);

  const logout = useCallback(async () => {
    await auth.clearToken();
    setToken(null);
    setIsAuthenticated(false);
  }, [auth]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const newToken = await auth.refreshToken();
      if (newToken) {
        setToken(newToken);
        setIsAuthenticated(true);
        return true;
      } else {
        await logout();
        return false;
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      await logout();
      return false;
    }
  }, [auth, logout]);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  return {
    isAuthenticated,
    isValidating,
    token,
    login,
    logout,
    refreshSession,
    validateSession,
  };
}

/**
 * Hook for cross-platform data synchronization
 */
export function useCrossPlatformSync<T>(endpoint: string, initialData?: T) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const sync = useCallback(async (payload?: any, immediate = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await crossPlatformService.syncData(endpoint, payload, { immediate });
      setData(result);
      setLastSyncTime(new Date());
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Sync error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  const backgroundSync = useCallback(async (payload?: any) => {
    try {
      const result = await crossPlatformService.syncData(endpoint, payload, { 
        immediate: false, 
        background: true 
      });
      setData(result);
      setLastSyncTime(new Date());
      return result;
    } catch (err) {
      console.error('Background sync error:', err);
    }
  }, [endpoint]);

  return {
    data,
    isLoading,
    error,
    lastSyncTime,
    sync,
    backgroundSync,
  };
}

/**
 * Hook for platform-optimized configurations
 */
export function usePlatformOptimization<T>(webConfig: T, mobileConfig: T): T {
  const capabilities = usePlatformCapabilities();
  
  return crossPlatformService.optimizeForPlatform(webConfig, mobileConfig);
}

/**
 * Hook for cross-platform notifications
 */
export function useCrossPlatformNotifications() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  const showNotification = useCallback(async (
    title: string, 
    message: string, 
    actions?: Array<{label: string, action: () => void}>
  ) => {
    await crossPlatformService.showNotification(title, message, actions);
  }, []);

  return {
    notificationPermission,
    requestPermission,
    showNotification,
  };
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

/**
 * Hook for responsive admin dashboard layout
 */
export function useResponsiveAdminLayout() {
  const capabilities = usePlatformCapabilities();
  
  const layoutConfig = usePlatformOptimization(
    // Web configuration
    {
      sidebarWidth: 280,
      showFullSidebar: true,
      useTabNavigation: false,
      columnsPerRow: capabilities.screenSize === 'large' ? 3 : 2,
      showAdvancedControls: true,
      useCompactMetrics: false,
    },
    // Mobile configuration
    {
      sidebarWidth: 0,
      showFullSidebar: false,
      useTabNavigation: true,
      columnsPerRow: 1,
      showAdvancedControls: false,
      useCompactMetrics: true,
    }
  );

  const [sidebarOpen, setSidebarOpen] = useState(layoutConfig.showFullSidebar);

  useEffect(() => {
    setSidebarOpen(layoutConfig.showFullSidebar);
  }, [layoutConfig.showFullSidebar]);

  return {
    ...layoutConfig,
    sidebarOpen,
    setSidebarOpen,
    isMobile: capabilities.platform === 'mobile',
    screenSize: capabilities.screenSize,
  };
}

/**
 * Hook for cross-platform data sharing
 */
export function useDataSharing() {
  const navigation = useCrossPlatformNavigation();
  const capabilities = usePlatformCapabilities();

  const shareReport = useCallback(async (reportId: string, reportTitle: string): Promise<boolean> => {
    const shareContent: ShareContent = {
      title: `Admin Report: ${reportTitle}`,
      text: `Check out this admin report from AI Sports Edge`,
      url: `${window.location.origin}/admin/reports/${reportId}`,
    };

    return navigation.shareContent(shareContent);
  }, [navigation]);

  const shareAnalytics = useCallback(async (view: string, title: string): Promise<boolean> => {
    const shareContent: ShareContent = {
      title: `Analytics: ${title}`,
      text: `View these analytics from AI Sports Edge admin dashboard`,
      url: `${window.location.origin}/admin/analytics/${view}`,
    };

    return navigation.shareContent(shareContent);
  }, [navigation]);

  const shareUserProfile = useCallback(async (userId: string, userName: string): Promise<boolean> => {
    const shareContent: ShareContent = {
      title: `User Profile: ${userName}`,
      text: `View user profile in AI Sports Edge admin dashboard`,
      url: `${window.location.origin}/admin/users/${userId}`,
    };

    return navigation.shareContent(shareContent);
  }, [navigation]);

  return {
    shareReport,
    shareAnalytics,
    shareUserProfile,
    canShare: capabilities.hasShare || capabilities.hasClipboard,
  };
}

export default {
  usePlatformCapabilities,
  useCrossPlatformNavigation,
  useCrossPlatformAuth,
  useCrossPlatformSync,
  usePlatformOptimization,
  useCrossPlatformNotifications,
  useResponsiveAdminLayout,
  useDataSharing,
};