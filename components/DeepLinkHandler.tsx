import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import deepLinkingService, { DeepLinkData, DeepLinkPath } from '../services/deepLinkingService';
import { analyticsService } from '../services/analyticsService';

/**
 * Deep Link Handler Component
 * 
 * This component handles deep links and navigates to the appropriate screen.
 * It should be rendered at the root of the app to ensure it's always available.
 */
const DeepLinkHandler: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const initialLinkProcessed = useRef(false);

  useEffect(() => {
    // Initialize deep linking service
    deepLinkingService.initialize();

    // Process initial link if not already processed
    const processInitialLink = async () => {
      if (initialLinkProcessed.current) {
        return;
      }

      const initialLink = deepLinkingService.getInitialLink();
      if (initialLink) {
        console.log('Processing initial deep link:', initialLink);
        initialLinkProcessed.current = true;
      }
    };

    processInitialLink();

    // Add deep link listener
    const unsubscribe = deepLinkingService.addListener((data: DeepLinkData) => {
      console.log('Deep link received in handler:', data);
      
      // Track analytics event
      analyticsService.trackEvent('deep_link_handled', {
        path: data.path,
        params: data.params,
        utmParams: data.utmParams
      });
      
      // Handle deep link based on path
      handleDeepLink(data);
    });

    // Clean up listener
    return () => {
      unsubscribe();
    };
  }, [navigation]);

  /**
   * Handle deep link navigation
   * @param data Deep link data
   */
  const handleDeepLink = (data: DeepLinkData) => {
    try {
      switch (data.path) {
        case DeepLinkPath.HOME:
          navigation.navigate('Home');
          break;
          
        case DeepLinkPath.GAME:
          if (data.params.id) {
            navigation.navigate('GameDetails', { gameId: data.params.id });
          } else {
            navigation.navigate('Games');
          }
          break;
          
        case DeepLinkPath.PLAYER:
          if (data.params.id) {
            navigation.navigate('PlayerDetails', { playerId: data.params.id });
          } else {
            navigation.navigate('Players');
          }
          break;
          
        case DeepLinkPath.TEAM:
          if (data.params.id) {
            navigation.navigate('TeamDetails', { teamId: data.params.id });
          } else {
            navigation.navigate('Teams');
          }
          break;
          
        case DeepLinkPath.BET:
          if (data.params.id) {
            navigation.navigate('BetDetails', { betId: data.params.id });
          } else {
            navigation.navigate('Bets');
          }
          break;
          
        case DeepLinkPath.SUBSCRIPTION:
          navigation.navigate('Subscription');
          break;
          
        case DeepLinkPath.REFERRAL:
          navigation.navigate('Referral', { code: data.params.code });
          break;
          
        case DeepLinkPath.NOTIFICATION:
          if (data.params.id) {
            navigation.navigate('NotificationDetails', { notificationId: data.params.id });
          } else {
            navigation.navigate('Notifications');
          }
          break;
          
        case DeepLinkPath.SETTINGS:
          navigation.navigate('Settings');
          break;
          
        case DeepLinkPath.PROMO:
          if (data.params.code) {
            navigation.navigate('Promo', { code: data.params.code });
          } else {
            navigation.navigate('Promos');
          }
          break;
          
        default:
          console.warn(`Unhandled deep link path: ${data.path}`);
          navigation.navigate('Home');
          break;
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      navigation.navigate('Home');
    }
  };

  // This component doesn't render anything
  return null;
};

export default DeepLinkHandler;