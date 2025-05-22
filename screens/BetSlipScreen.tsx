import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TIER_CONFIG } from '../config/sportsbook';
import { useHaptics, useOfflineStorage } from '../hooks/useMobile';
import { BetSlipValidator } from '../utils/betting';
import MobileButton from '../atomic/atoms/mobile/MobileButton';
import MobileCard from '../atomic/atoms/mobile/MobileCard';
import MobileInput from '../atomic/atoms/mobile/MobileInput';
import MobileQuickBet from '../atomic/organisms/mobile/MobileQuickBet';
import { BetSlipAPI } from '../services/betSlipService';

// Sports data for quick entry
const SPORTS_DATA = [
  { id: 'basketball', name: 'Basketball' },
  { id: 'football', name: 'Football' },
  { id: 'baseball', name: 'Baseball' },
  { id: 'hockey', name: 'Hockey' },
  { id: 'soccer', name: 'Soccer' },
  { id: 'mma', name: 'MMA' },
];

// Sportsbooks data
const SPORTSBOOKS = [
  { id: 'draftkings', name: 'DraftKings' },
  { id: 'fanduel', name: 'FanDuel' },
  { id: 'betmgm', name: 'BetMGM' },
  { id: 'caesars', name: 'Caesars' },
  { id: 'generic', name: 'Other' },
];

// Bet types
const BET_TYPES = [
  { id: 'moneyline', name: 'Moneyline' },
  { id: 'spread', name: 'Spread' },
  { id: 'total', name: 'Total' },
  { id: 'prop', name: 'Prop' },
  { id: 'parlay', name: 'Parlay' },
];

interface BetSlipScreenProps {
  route: {
    params: {
      userTier?: string;
      theme?: 'dark' | 'light';
    };
  };
}

const BetSlipScreen: React.FC<BetSlipScreenProps> = ({ route }) => {
  const { userTier = 'insight', theme = 'dark' } = route.params || {};
  const navigation = useNavigation();
  const haptics = useHaptics();
  const { isOnline, pendingBets, syncOfflineBets, saveBetOffline } = useOfflineStorage();
  const [activeTab, setActiveTab] = useState('manual');
  const { width: screenWidth } = Dimensions.get('window');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual entry form state
  const [sportsbook, setSportsbook] = useState<string>('');
  const [sport, setSport] = useState<string>('');
  const [league, setLeague] = useState<string>('');
  const [eventName, setEventName] = useState<string>('');
  const [betType, setBetType] = useState<string>('');
  const [selection, setSelection] = useState<string>('');
  const [odds, setOdds] = useState<string>('');
  const [stake, setStake] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Define tabs based on user tier
  const tabs = [
    { id: 'manual', title: 'Manual', icon: '📝' },
    { id: 'quick', title: 'Quick', icon: '⚡' },
    ...(userTier in TIER_CONFIG &&
    TIER_CONFIG[userTier as keyof typeof TIER_CONFIG].features.screenshotUpload
      ? [{ id: 'camera', title: 'Camera', icon: '📷' }]
      : []),
  ];

  // Handle tab press
  const handleTabPress = useCallback(
    (tabId: string) => {
      haptics.lightImpact();
      setActiveTab(tabId);
      // Clear any previous errors
      setError(null);
    },
    [haptics]
  );

  // Handle camera press
  const handleCameraPress = useCallback(() => {
    haptics.mediumImpact();
    // @ts-ignore - Navigation typing issue will be resolved when navigator is properly set up
    navigation.navigate('CameraCapture', {
      onCapture: (photo: any) => {
        // Handle the captured photo
        console.log('Photo captured:', photo);
      },
      onCancel: () => navigation.goBack(),
      userTier,
      theme,
    });
  }, [navigation, haptics, userTier, theme]);

  // Validate manual entry form
  const validateManualForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!sportsbook) errors.sportsbook = 'Sportsbook is required';
    if (!sport) errors.sport = 'Sport is required';
    if (!league) errors.league = 'League is required';
    if (!eventName) errors.eventName = 'Event name is required';
    if (!betType) errors.betType = 'Bet type is required';
    if (!selection) errors.selection = 'Selection is required';
    if (!odds) errors.odds = 'Odds are required';

    // Validate stake
    if (!stake) {
      errors.stake = 'Stake amount is required';
    } else {
      const stakeAmount = parseFloat(stake);
      if (isNaN(stakeAmount) || stakeAmount <= 0) {
        errors.stake = 'Stake must be a positive number';
      }
    }

    // Validate event name format
    if (eventName && !/^.+\s+(vs?|@|v)\s+.+$/i.test(eventName)) {
      errors.eventName = 'Event should be in format "Team A vs Team B"';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [sportsbook, sport, league, eventName, betType, selection, odds, stake]);

  // Reset form fields
  const resetForm = useCallback(() => {
    setSportsbook('');
    setSport('');
    setLeague('');
    setEventName('');
    setBetType('');
    setSelection('');
    setOdds('');
    setStake('');
    setFormErrors({});
  }, []);

  // Handle bet submission from manual entry
  const handleManualSubmit = useCallback(async () => {
    if (!validateManualForm()) {
      haptics.error();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const betData = {
        sportsbook,
        isParlay: false,
        legs: [
          {
            id: `temp-${Date.now()}`,
            betSlipId: `temp-slip-${Date.now()}`,
            sport,
            league,
            eventName,
            betType,
            selection,
            odds,
            oddsAmerican: parseInt(odds) || 0,
            oddsFormat: 'american' as const,
            stake: parseFloat(stake),
            potentialPayout: parseFloat(stake) * 2, // Estimated payout, will be calculated properly by API
            result: 'pending' as const,
          },
        ],
        totalStake: parseFloat(stake),
      };

      if (isOnline) {
        const result = await BetSlipAPI.createBetSlip(betData);
        if (result.success) {
          haptics.success();
          resetForm();

          if (Platform.OS !== 'web') {
            Alert.alert('Success', 'Bet slip created successfully!', [{ text: 'OK' }]);
          }
        }
      } else {
        await saveBetOffline(betData);
        haptics.success();
        resetForm();

        if (Platform.OS !== 'web') {
          Alert.alert(
            'Offline Mode',
            'Your bet has been saved offline and will be submitted when you reconnect.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err) {
      console.error('Failed to submit bet:', err);
      setError('Failed to submit bet. Please try again.');
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  }, [
    validateManualForm,
    sportsbook,
    sport,
    league,
    eventName,
    betType,
    selection,
    odds,
    stake,
    isOnline,
    haptics,
    saveBetOffline,
    resetForm,
  ]);

  // Handle bet submission from quick entry
  const handleQuickSubmit = useCallback(
    async (betData: any) => {
      setIsLoading(true);
      setError(null);

      try {
        if (isOnline) {
          const result = await BetSlipAPI.createBetSlip(betData);
          if (result.success) {
            haptics.success();
            // Show success message or navigate
            if (Platform.OS !== 'web') {
              Alert.alert('Success', 'Bet slip created successfully!', [{ text: 'OK' }]);
            }
          }
        } else {
          await saveBetOffline(betData);
          haptics.success();
          // Show offline success message
          if (Platform.OS !== 'web') {
            Alert.alert(
              'Offline Mode',
              'Your bet has been saved offline and will be submitted when you reconnect.',
              [{ text: 'OK' }]
            );
          }
        }
      } catch (err) {
        console.error('Failed to submit bet:', err);
        setError('Failed to submit bet. Please try again.');
        haptics.error();
      } finally {
        setIsLoading(false);
      }
    },
    [isOnline, haptics, saveBetOffline]
  );

  // Sync offline bets when coming online
  useEffect(() => {
    if (isOnline && pendingBets.length > 0) {
      syncOfflineBets();
    }
  }, [isOnline, pendingBets, syncOfflineBets]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
      }}
    >
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#111827' : '#F9FAFB'}
      />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: theme === 'dark' ? '#FFFFFF' : '#111827',
            marginBottom: 4,
          }}
        >
          Bet Slip
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          }}
        >
          Track your betting performance
        </Text>

        {!isOnline && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
              backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              alignSelf: 'flex-start',
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#EF4444',
                marginRight: 8,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                color: theme === 'dark' ? '#F3F4F6' : '#4B5563',
              }}
            >
              Offline Mode {pendingBets.length > 0 ? `(${pendingBets.length} pending)` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Tab Navigation */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          {tabs.map((tab, index) => (
            <MobileButton
              key={tab.id}
              title={`${tab.icon} ${tab.title}`}
              variant={activeTab === tab.id ? 'neon' : 'outline'}
              size="md"
              onPress={() => handleTabPress(tab.id)}
              style={{ flex: 1, marginRight: index < tabs.length - 1 ? 8 : 0 }}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'manual' && (
          <ManualEntrySection
            sportsbook={sportsbook}
            setSportsbook={setSportsbook}
            sport={sport}
            setSport={setSport}
            league={league}
            setLeague={setLeague}
            eventName={eventName}
            setEventName={setEventName}
            betType={betType}
            setBetType={setBetType}
            selection={selection}
            setSelection={setSelection}
            odds={odds}
            setOdds={setOdds}
            stake={stake}
            setStake={setStake}
            errors={formErrors}
            userTier={userTier}
            theme={theme}
            screenWidth={screenWidth}
            onSubmit={handleManualSubmit}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'quick' && (
          <MobileQuickBet
            onSubmit={handleQuickSubmit}
            onCancel={() => {}}
            availableSports={SPORTS_DATA}
            userBalance={1000} // This would come from user context in a real app
            theme={theme}
          />
        )}

        {activeTab === 'camera' && (
          <MobileCard theme={theme} style={{ margin: 16 }}>
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text
                style={{
                  fontSize: 48,
                  marginBottom: 16,
                }}
              >
                📷
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme === 'dark' ? '#FFFFFF' : '#111827',
                  marginBottom: 8,
                }}
              >
                Scan Bet Slip
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  textAlign: 'center',
                  marginBottom: 24,
                }}
              >
                Use your camera to automatically extract bet information
              </Text>
              <MobileButton
                title="Open Camera"
                variant="primary"
                size="lg"
                onPress={handleCameraPress}
              />
            </View>
          </MobileCard>
        )}

        {error && (
          <View
            style={{
              margin: 16,
              padding: 16,
              backgroundColor: '#FEE2E2',
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#EF4444',
            }}
          >
            <Text style={{ color: '#B91C1C' }}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Manual Entry Section Component
interface ManualEntrySectionProps {
  sportsbook: string;
  setSportsbook: (value: string) => void;
  sport: string;
  setSport: (value: string) => void;
  league: string;
  setLeague: (value: string) => void;
  eventName: string;
  setEventName: (value: string) => void;
  betType: string;
  setBetType: (value: string) => void;
  selection: string;
  setSelection: (value: string) => void;
  odds: string;
  setOdds: (value: string) => void;
  stake: string;
  setStake: (value: string) => void;
  errors: Record<string, string>;
  userTier: string;
  theme: 'dark' | 'light';
  screenWidth: number;
  onSubmit: () => void;
  isLoading: boolean;
}

const ManualEntrySection: React.FC<ManualEntrySectionProps> = ({
  sportsbook,
  setSportsbook,
  sport,
  setSport,
  league,
  setLeague,
  eventName,
  setEventName,
  betType,
  setBetType,
  selection,
  setSelection,
  odds,
  setOdds,
  stake,
  setStake,
  errors,
  userTier,
  theme,
  screenWidth,
  onSubmit,
  isLoading,
}) => {
  const haptics = useHaptics();

  return (
    <MobileCard theme={theme} style={{ margin: 16 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme === 'dark' ? '#FFFFFF' : '#111827',
          marginBottom: 16,
        }}
      >
        Manual Entry
      </Text>

      {/* Sportsbook Selection */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            marginBottom: 8,
            color: theme === 'dark' ? '#D1D5DB' : '#374151',
          }}
        >
          Sportsbook
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -4,
          }}
        >
          {SPORTSBOOKS.map(item => (
            <MobileButton
              key={item.id}
              title={item.name}
              variant={sportsbook === item.id ? 'primary' : 'outline'}
              size="sm"
              onPress={() => {
                haptics.lightImpact();
                setSportsbook(item.id);
              }}
              style={{ margin: 4 }}
            />
          ))}
        </View>
        {errors.sportsbook && (
          <Text
            style={{
              fontSize: 12,
              color: '#EF4444',
              marginTop: 4,
              marginLeft: 4,
            }}
          >
            {errors.sportsbook}
          </Text>
        )}
      </View>

      {/* Sport Selection */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            marginBottom: 8,
            color: theme === 'dark' ? '#D1D5DB' : '#374151',
          }}
        >
          Sport
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -4,
          }}
        >
          {SPORTS_DATA.map(item => (
            <MobileButton
              key={item.id}
              title={item.name}
              variant={sport === item.id ? 'primary' : 'outline'}
              size="sm"
              onPress={() => {
                haptics.lightImpact();
                setSport(item.id);
              }}
              style={{ margin: 4 }}
            />
          ))}
        </View>
        {errors.sport && (
          <Text
            style={{
              fontSize: 12,
              color: '#EF4444',
              marginTop: 4,
              marginLeft: 4,
            }}
          >
            {errors.sport}
          </Text>
        )}
      </View>

      {/* League Input */}
      <MobileInput
        label="League"
        value={league}
        onChangeText={setLeague}
        placeholder="Enter league (e.g., NBA, NFL)"
        error={errors.league}
        theme={theme}
      />

      {/* Event Name Input */}
      <MobileInput
        label="Event"
        value={eventName}
        onChangeText={setEventName}
        placeholder="Enter event (e.g., Lakers vs Warriors)"
        error={errors.eventName}
        theme={theme}
      />

      {/* Bet Type Selection */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            marginBottom: 8,
            color: theme === 'dark' ? '#D1D5DB' : '#374151',
          }}
        >
          Bet Type
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -4,
          }}
        >
          {BET_TYPES.map(item => (
            <MobileButton
              key={item.id}
              title={item.name}
              variant={betType === item.id ? 'primary' : 'outline'}
              size="sm"
              onPress={() => {
                haptics.lightImpact();
                setBetType(item.id);
              }}
              style={{ margin: 4 }}
            />
          ))}
        </View>
        {errors.betType && (
          <Text
            style={{
              fontSize: 12,
              color: '#EF4444',
              marginTop: 4,
              marginLeft: 4,
            }}
          >
            {errors.betType}
          </Text>
        )}
      </View>

      {/* Selection Input */}
      <MobileInput
        label="Selection"
        value={selection}
        onChangeText={setSelection}
        placeholder="Enter your selection (e.g., Lakers -5.5)"
        error={errors.selection}
        theme={theme}
      />

      {/* Odds Input */}
      <MobileInput
        label="Odds"
        value={odds}
        onChangeText={setOdds}
        placeholder="Enter odds (e.g., -110, +150)"
        type="default"
        error={errors.odds}
        theme={theme}
      />

      {/* Stake Input */}
      <MobileInput
        label="Stake"
        value={stake}
        onChangeText={setStake}
        placeholder="Enter stake amount"
        type="decimal"
        error={errors.stake}
        theme={theme}
      />

      {/* Submit Button */}
      <MobileButton
        title={isLoading ? 'Submitting...' : 'Submit Bet'}
        variant="primary"
        size="lg"
        loading={isLoading}
        onPress={onSubmit}
        style={{ marginTop: 16 }}
      />
    </MobileCard>
  );
};

export default BetSlipScreen;
