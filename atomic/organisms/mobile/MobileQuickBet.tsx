import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { useHaptics, useOfflineStorage } from '../../../hooks/useMobile';
import MobileButton from '../../atoms/mobile/MobileButton';
import MobileInput from '../../atoms/mobile/MobileInput';
import MobileCard from '../../atoms/mobile/MobileCard';

interface MobileQuickBetProps {
  onSubmit: (betData: any) => void;
  onCancel: () => void;
  availableSports: Array<{ id: string; name: string }>;
  userBalance: number;
  theme?: 'dark' | 'light';
}

export const MobileQuickBet: React.FC<MobileQuickBetProps> = ({
  onSubmit,
  onCancel,
  availableSports,
  userBalance,
  theme = 'dark',
}) => {
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [odds, setOdds] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const haptics = useHaptics();
  const { isOnline, saveBetOffline } = useOfflineStorage();

  // Validate form fields
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedSport) {
      newErrors.sport = 'Please select a sport';
    }

    if (!betAmount) {
      newErrors.betAmount = 'Please enter a bet amount';
    } else if (isNaN(parseFloat(betAmount))) {
      newErrors.betAmount = 'Bet amount must be a number';
    } else if (parseFloat(betAmount) <= 0) {
      newErrors.betAmount = 'Bet amount must be greater than 0';
    } else if (parseFloat(betAmount) > userBalance) {
      newErrors.betAmount = 'Bet amount exceeds your balance';
    }

    if (!teamName) {
      newErrors.teamName = 'Please enter a team name';
    }

    if (!odds) {
      newErrors.odds = 'Please enter odds';
    } else if (isNaN(parseFloat(odds))) {
      newErrors.odds = 'Odds must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedSport, betAmount, teamName, odds, userBalance]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      haptics.error();
      return;
    }

    setIsSubmitting(true);
    haptics.mediumImpact();

    try {
      const betData = {
        sportId: selectedSport,
        amount: parseFloat(betAmount),
        teamName,
        odds: parseFloat(odds),
        timestamp: new Date().toISOString(),
      };

      if (!isOnline) {
        // Save bet offline if no internet connection
        await saveBetOffline(betData);

        if (Platform.OS !== 'web') {
          Alert.alert(
            'Offline Mode',
            'Your bet has been saved offline and will be submitted when you reconnect.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Submit bet directly
        await onSubmit(betData);
      }

      haptics.success();

      // Reset form
      setSelectedSport('');
      setBetAmount('');
      setTeamName('');
      setOdds('');
    } catch (error) {
      console.error('Failed to submit bet:', error);
      haptics.error();

      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to submit bet. Please try again.', [{ text: 'OK' }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateForm,
    selectedSport,
    betAmount,
    teamName,
    odds,
    isOnline,
    saveBetOffline,
    onSubmit,
    haptics,
  ]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    haptics.lightImpact();
    onCancel();
  }, [onCancel, haptics]);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
      }}
      contentContainerStyle={{
        padding: 16,
      }}
    >
      <MobileCard theme={theme} style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: theme === 'dark' ? '#FFFFFF' : '#111827',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          Quick Bet
        </Text>

        {!isOnline && (
          <View
            style={{
              backgroundColor: theme === 'dark' ? '#374151' : '#FEF3C7',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: theme === 'dark' ? '#FCD34D' : '#92400E',
                fontSize: 14,
                flex: 1,
              }}
            >
              You're offline. Bets will be saved locally and submitted when you reconnect.
            </Text>
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              marginBottom: 8,
              color: theme === 'dark' ? '#D1D5DB' : '#374151',
            }}
          >
            Select Sport
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: -4,
            }}
          >
            {availableSports.map(sport => (
              <MobileButton
                key={sport.id}
                title={sport.name}
                variant={selectedSport === sport.id ? 'primary' : 'outline'}
                size="sm"
                onPress={() => {
                  haptics.lightImpact();
                  setSelectedSport(sport.id);
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

        <MobileInput
          label="Bet Amount"
          value={betAmount}
          onChangeText={setBetAmount}
          placeholder="Enter amount"
          type="decimal"
          error={errors.betAmount}
          theme={theme}
        />

        <MobileInput
          label="Team Name"
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Enter team name"
          error={errors.teamName}
          theme={theme}
        />

        <MobileInput
          label="Odds"
          value={odds}
          onChangeText={setOdds}
          placeholder="Enter odds (e.g. 1.95)"
          type="decimal"
          error={errors.odds}
          theme={theme}
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 24,
          }}
        >
          <MobileButton
            title="Cancel"
            variant="outline"
            size="md"
            onPress={handleCancel}
            style={{ flex: 1, marginRight: 8 }}
          />

          <MobileButton
            title={isSubmitting ? 'Submitting...' : 'Place Bet'}
            variant="primary"
            size="md"
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        {userBalance > 0 && (
          <Text
            style={{
              fontSize: 12,
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            Available Balance: ${userBalance.toFixed(2)}
          </Text>
        )}
      </MobileCard>
    </ScrollView>
  );
};

export default MobileQuickBet;
