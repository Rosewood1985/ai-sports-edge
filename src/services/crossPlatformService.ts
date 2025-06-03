/**
 * Cross-Platform Integration Service
 * Handles admin dashboard integration across web and mobile platforms
 */

// Platform detection and capabilities
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

// Cross-platform navigation interface
export interface CrossPlatformNavigation {
  navigateToAdmin: (section?: string) => Promise<void>;
  navigateToReport: (reportId: string) => Promise<void>;
  navigateToUser: (userId: string) => Promise<void>;
  navigateToAnalytics: (view?: string) => Promise<void>;
  openExternalLink: (url: string) => Promise<void>;
  shareContent: (content: ShareContent) => Promise<boolean>;
}

export interface ShareContent {
  title: string;
  text: string;
  url?: string;
  data?: any;
}

// Authentication sync across platforms
export interface CrossPlatformAuth {
  syncToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
  getToken: () => Promise<string | null>;
  validateSession: () => Promise<boolean>;
  refreshToken: () => Promise<string | null>;
}

// Data synchronization interface
export interface DataSyncOptions {
  immediate?: boolean;
  background?: boolean;
  retryCount?: number;
  conflictResolution?: 'server' | 'client' | 'merge';
}

class CrossPlatformService {
  private static instance: CrossPlatformService;
  private capabilities: PlatformCapabilities;
  private navigation: CrossPlatformNavigation;
  private auth: CrossPlatformAuth;

  constructor() {
    this.capabilities = this.detectPlatformCapabilities();
    this.navigation = this.initializeNavigation();
    this.auth = this.initializeAuth();
  }

  static getInstance(): CrossPlatformService {
    if (!CrossPlatformService.instance) {
      CrossPlatformService.instance = new CrossPlatformService();
    }
    return CrossPlatformService.instance;
  }

  /**
   * Detect current platform capabilities
   */
  private detectPlatformCapabilities(): PlatformCapabilities {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
    const isTablet = /iPad|Android(?=.*Tablet)|Windows NT.*Touch/i.test(userAgent);

    // Screen size detection
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
      orientation: isTablet ? 'any' : isMobile ? 'portrait' : 'any',
      screenSize: screenSize as 'small' | 'medium' | 'large',
    };
  }

  /**
   * Initialize cross-platform navigation
   */
  private initializeNavigation(): CrossPlatformNavigation {
    return {
      navigateToAdmin: async (section?: string) => {
        if (this.capabilities.platform === 'mobile') {
          // React Native navigation
          const url = `/admin${section ? `/${section}` : ''}`;
          if (typeof window !== 'undefined' && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'navigate',
                url,
              })
            );
          }
        } else {
          // Web navigation
          const url = `/admin${section ? `/${section}` : ''}`;
          if (typeof window !== 'undefined') {
            window.location.href = url;
          }
        }
      },

      navigateToReport: async (reportId: string) => {
        const url = `/admin/reports/${reportId}`;
        await this.navigation.navigateToAdmin(`reports/${reportId}`);
      },

      navigateToUser: async (userId: string) => {
        const url = `/admin/users/${userId}`;
        await this.navigation.navigateToAdmin(`users/${userId}`);
      },

      navigateToAnalytics: async (view?: string) => {
        const url = `/admin/analytics${view ? `/${view}` : ''}`;
        await this.navigation.navigateToAdmin(`analytics${view ? `/${view}` : ''}`);
      },

      openExternalLink: async (url: string) => {
        if (this.capabilities.canOpenExternalLinks) {
          if (this.capabilities.platform === 'mobile') {
            // React Native Linking
            if (typeof window !== 'undefined' && window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: 'openExternal',
                  url,
                })
              );
            }
          } else {
            // Web
            window.open(url, '_blank');
          }
        }
      },

      shareContent: async (content: ShareContent): Promise<boolean> => {
        if (this.capabilities.hasShare) {
          try {
            await navigator.share({
              title: content.title,
              text: content.text,
              url: content.url,
            });
            return true;
          } catch (error) {
            console.error('Error sharing content:', error);
            return false;
          }
        } else if (this.capabilities.hasClipboard && content.url) {
          try {
            await navigator.clipboard.writeText(content.url);
            return true;
          } catch (error) {
            console.error('Error copying to clipboard:', error);
            return false;
          }
        }
        return false;
      },
    };
  }

  /**
   * Initialize cross-platform authentication
   */
  private initializeAuth(): CrossPlatformAuth {
    return {
      syncToken: async (token: string) => {
        // Store in multiple locations for cross-platform access
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('adminToken', token);
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('adminToken', token);
        }

        // Sync with React Native SecureStore if available
        if (
          this.capabilities.platform === 'mobile' &&
          typeof window !== 'undefined' &&
          window.ReactNativeWebView
        ) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'storeToken',
              token,
            })
          );
        }
      },

      clearToken: async () => {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('adminToken');
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('adminToken');
        }

        // Clear from React Native SecureStore
        if (
          this.capabilities.platform === 'mobile' &&
          typeof window !== 'undefined' &&
          window.ReactNativeWebView
        ) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'clearToken',
            })
          );
        }
      },

      getToken: async (): Promise<string | null> => {
        // Try localStorage first
        if (typeof localStorage !== 'undefined') {
          const token = localStorage.getItem('adminToken');
          if (token) return token;
        }

        // Try sessionStorage
        if (typeof sessionStorage !== 'undefined') {
          const token = sessionStorage.getItem('adminToken');
          if (token) return token;
        }

        // For mobile, request from React Native
        if (this.capabilities.platform === 'mobile') {
          return new Promise(resolve => {
            if (typeof window !== 'undefined' && window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: 'getToken',
                })
              );

              // Listen for response
              const handleMessage = (event: MessageEvent) => {
                try {
                  const data = JSON.parse(event.data);
                  if (data.type === 'tokenResponse') {
                    window.removeEventListener('message', handleMessage);
                    resolve(data.token);
                  }
                } catch (error) {
                  console.error('Error parsing token response:', error);
                  resolve(null);
                }
              };

              window.addEventListener('message', handleMessage);

              // Timeout after 5 seconds
              setTimeout(() => {
                window.removeEventListener('message', handleMessage);
                resolve(null);
              }, 5000);
            } else {
              resolve(null);
            }
          });
        }

        return null;
      },

      validateSession: async (): Promise<boolean> => {
        const token = await this.auth.getToken();
        if (!token) return false;

        try {
          const response = await fetch('/api/admin/validate-session', {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          return response.ok;
        } catch (error) {
          console.error('Error validating session:', error);
          return false;
        }
      },

      refreshToken: async (): Promise<string | null> => {
        const currentToken = await this.auth.getToken();
        if (!currentToken) return null;

        try {
          const response = await fetch('/api/admin/refresh-token', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${currentToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const newToken = data.token;
            await this.auth.syncToken(newToken);
            return newToken;
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
        }

        return null;
      },
    };
  }

  /**
   * Sync data across platforms
   */
  async syncData(endpoint: string, data?: any, options: DataSyncOptions = {}): Promise<any> {
    const { immediate = true, background = false, retryCount = 3 } = options;

    const token = await this.auth.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const syncOperation = async (): Promise<any> => {
      const response = await fetch(endpoint, {
        method: data ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Platform': this.capabilities.platform,
          'X-Screen-Size': this.capabilities.screenSize,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    };

    // Retry logic
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        return await syncOperation();
      } catch (error) {
        if (attempt === retryCount) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  /**
   * Get platform capabilities
   */
  getCapabilities(): PlatformCapabilities {
    return this.capabilities;
  }

  /**
   * Get navigation interface
   */
  getNavigation(): CrossPlatformNavigation {
    return this.navigation;
  }

  /**
   * Get authentication interface
   */
  getAuth(): CrossPlatformAuth {
    return this.auth;
  }

  /**
   * Handle platform-specific optimizations
   */
  optimizeForPlatform<T>(webConfig: T, mobileConfig: T): T {
    return this.capabilities.platform === 'mobile' ? mobileConfig : webConfig;
  }

  /**
   * Show platform-appropriate notifications
   */
  async showNotification(
    title: string,
    message: string,
    actions?: { label: string; action: () => void }[]
  ): Promise<void> {
    if (this.capabilities.hasNotifications) {
      if (this.capabilities.platform === 'mobile') {
        // React Native notification
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'notification',
              title,
              message,
              actions: actions?.map(a => ({ label: a.label })),
            })
          );
        }
      } else {
        // Web notification
        if (Notification.permission === 'granted') {
          const notification = new Notification(title, {
            body: message,
            icon: '/favicon.ico',
          });

          notification.onclick = () => {
            if (actions && actions.length > 0) {
              actions[0].action();
            }
          };
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await this.showNotification(title, message, actions);
          }
        }
      }
    }
  }
}

export const crossPlatformService = CrossPlatformService.getInstance();
export default crossPlatformService;
