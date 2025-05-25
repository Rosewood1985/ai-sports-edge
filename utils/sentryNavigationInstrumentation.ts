/**
 * Sentry Navigation Instrumentation for React Navigation v6
 * Tracks screen transitions and navigation performance
 */

import { sentryService } from '../services/sentryService';

export interface NavigationState {
  key: string;
  index: number;
  routeNames: string[];
  routes: Array<{
    key: string;
    name: string;
    params?: object;
  }>;
}

export interface NavigationAction {
  type: string;
  payload?: any;
  source?: string;
  target?: string;
}

class SentryNavigationInstrumentation {
  private previousScreen: string | null = null;
  private currentScreen: string | null = null;
  private screenStartTime: number | null = null;
  private navigationTransaction: any = null;

  /**
   * Initialize navigation tracking
   */
  initialize(): void {
    console.log('Sentry Navigation Instrumentation initialized for React Navigation v6');
  }

  /**
   * Track screen change events
   */
  onStateChange(state: NavigationState | undefined): void {
    if (!state || !sentryService.isActive()) return;

    const currentRouteName = this.getCurrentRouteName(state);
    
    if (currentRouteName && currentRouteName !== this.currentScreen) {
      this.trackScreenTransition(currentRouteName);
    }
  }

  /**
   * Track navigation actions
   */
  onAction(action: NavigationAction, state: NavigationState): void {
    if (!sentryService.isActive()) return;

    const currentScreen = this.getCurrentRouteName(state);
    
    sentryService.addBreadcrumb(
      `Navigation action: ${action.type}`,
      'navigation',
      'info',
      {
        action: action.type,
        currentScreen,
        payload: action.payload,
        source: action.source,
        target: action.target,
      }
    );

    // Track specific navigation events
    if (action.type === 'NAVIGATE') {
      sentryService.trackFeatureUsage(
        'navigation',
        'navigate',
        undefined,
        {
          from: this.currentScreen,
          to: action.payload?.name,
          params: action.payload?.params,
        }
      );
    }
  }

  /**
   * Track route focus events
   */
  onRouteFocus(routeName: string, params?: object): void {
    if (!sentryService.isActive()) return;

    sentryService.addBreadcrumb(
      `Screen focused: ${routeName}`,
      'navigation',
      'info',
      {
        screen: routeName,
        params,
      }
    );

    sentryService.setContext('current_screen', {
      name: routeName,
      params,
      focusedAt: new Date().toISOString(),
    });
  }

  /**
   * Track route blur events
   */
  onRouteBlur(routeName: string): void {
    if (!sentryService.isActive()) return;

    const timeSpent = this.screenStartTime ? Date.now() - this.screenStartTime : null;

    sentryService.addBreadcrumb(
      `Screen blurred: ${routeName}`,
      'navigation',
      'info',
      {
        screen: routeName,
        timeSpent,
      }
    );

    // Track screen time performance
    if (timeSpent && timeSpent > 0) {
      sentryService.trackFeatureUsage(
        'screen_time',
        'blur',
        undefined,
        {
          screen: routeName,
          duration: timeSpent,
        }
      );
    }
  }

  /**
   * Track deep link navigation
   */
  onDeepLink(url: string, routeName?: string): void {
    if (!sentryService.isActive()) return;

    sentryService.addBreadcrumb(
      `Deep link opened: ${url}`,
      'deep_link',
      'info',
      {
        url,
        targetRoute: routeName,
      }
    );

    sentryService.trackFeatureUsage(
      'deep_link',
      'open',
      undefined,
      {
        url,
        targetRoute: routeName,
      }
    );
  }

  /**
   * Track tab navigation
   */
  onTabPress(tabName: string, wasAlreadyFocused: boolean): void {
    if (!sentryService.isActive()) return;

    sentryService.addBreadcrumb(
      `Tab pressed: ${tabName}`,
      'tab_navigation',
      'info',
      {
        tab: tabName,
        wasAlreadyFocused,
      }
    );

    sentryService.trackFeatureUsage(
      'tab_navigation',
      wasAlreadyFocused ? 'refocus' : 'navigate',
      undefined,
      {
        tab: tabName,
      }
    );
  }

  /**
   * Track racing-specific navigation
   */
  onRacingNavigation(sport: 'nascar' | 'horse_racing', action: string, data?: object): void {
    if (!sentryService.isActive()) return;

    sentryService.addBreadcrumb(
      `Racing navigation: ${sport} - ${action}`,
      'racing_navigation',
      'info',
      {
        sport,
        action,
        ...data,
      }
    );

    sentryService.trackRacingOperation(`navigation_${action}`, sport, data);
  }

  /**
   * Track betting flow navigation
   */
  onBettingNavigation(action: string, betType?: string, data?: object): void {
    if (!sentryService.isActive()) return;

    sentryService.addBreadcrumb(
      `Betting navigation: ${action}`,
      'betting_navigation',
      'info',
      {
        action,
        betType,
        ...data,
      }
    );

    sentryService.trackFeatureUsage(
      'betting',
      action,
      undefined,
      {
        betType,
        ...data,
      }
    );
  }

  /**
   * Get current route name from navigation state
   */
  private getCurrentRouteName(state: NavigationState): string | null {
    if (!state || !state.routes || state.routes.length === 0) {
      return null;
    }

    const route = state.routes[state.index];
    return route?.name || null;
  }

  /**
   * Track screen transition performance
   */
  private trackScreenTransition(newScreen: string): void {
    const now = Date.now();
    
    // End previous screen tracking
    if (this.currentScreen && this.screenStartTime) {
      const timeSpent = now - this.screenStartTime;
      
      sentryService.trackFeatureUsage(
        'screen_time',
        'spent',
        undefined,
        {
          screen: this.currentScreen,
          duration: timeSpent,
        }
      );
    }

    // End previous navigation transaction
    if (this.navigationTransaction) {
      this.navigationTransaction.finish();
    }

    // Start new navigation transaction
    this.navigationTransaction = sentryService.startTransaction(
      `Navigation to ${newScreen}`,
      'navigation',
      `Screen transition from ${this.currentScreen || 'unknown'} to ${newScreen}`
    );

    // Update tracking state
    this.previousScreen = this.currentScreen;
    this.currentScreen = newScreen;
    this.screenStartTime = now;

    // Set user context
    sentryService.setContext('navigation', {
      currentScreen: newScreen,
      previousScreen: this.previousScreen,
      transitionTime: new Date().toISOString(),
    });

    // Add breadcrumb for screen change
    sentryService.addBreadcrumb(
      `Screen changed to ${newScreen}`,
      'navigation',
      'info',
      {
        previousScreen: this.previousScreen,
        currentScreen: newScreen,
      }
    );
  }

  /**
   * Get current screen name
   */
  getCurrentScreen(): string | null {
    return this.currentScreen;
  }

  /**
   * Get previous screen name
   */
  getPreviousScreen(): string | null {
    return this.previousScreen;
  }

  /**
   * Get screen start time
   */
  getScreenStartTime(): number | null {
    return this.screenStartTime;
  }
}

// Export singleton instance
export const sentryNavigationInstrumentation = new SentryNavigationInstrumentation();

export default sentryNavigationInstrumentation;