import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import MobileCameraCapture from '../atomic/organisms/mobile/MobileCameraCapture';
import BetSlipScreen from '../screens/BetSlipScreen';

// Define the param list for type safety
type BettingStackParamList = {
  BetSlip: { userTier?: string; theme?: 'dark' | 'light' };
  CameraCapture: {
    onCapture: (photo: any) => void;
    onCancel: () => void;
    userTier: string;
    theme?: 'dark' | 'light';
  };
};

const Stack = createStackNavigator<BettingStackParamList>();

interface BettingNavigatorProps {
  userTier?: string;
  theme?: 'dark' | 'light';
}

const BettingNavigator: React.FC<BettingNavigatorProps> = ({
  userTier = 'insight',
  theme = 'dark',
}) => {
  return (
    <Stack.Navigator
      initialRouteName="BetSlip"
      screenOptions={{
        headerShown: false,
        cardStyle: {
          backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
        },
      }}
    >
      <Stack.Screen
        name="BetSlip"
        component={BetSlipScreen as any}
        initialParams={{ userTier, theme }}
      />
      <Stack.Screen
        name="CameraCapture"
        component={MobileCameraCapture as any}
        options={{
          presentation: 'modal',
          animationEnabled: true,
        }}
        initialParams={{
          onCapture: (photo: any) => console.log('Photo captured:', photo),
          onCancel: () => console.log('Camera capture cancelled'),
          userTier,
          theme,
        }}
      />
    </Stack.Navigator>
  );
};

export default BettingNavigator;
