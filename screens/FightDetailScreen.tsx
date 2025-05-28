import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../../atomic/organisms/i18n/LanguageContext';
import { ufcService } from '../services/ufcService';
import { UFCFight, RoundBettingOption, FightStatus } from '../types/ufc';
import { Container } from '../atomic/molecules/layout/ResponsiveLayout';
import {  ThemedText  } from '../atomic/atoms/ThemedText';
import RoundBettingCard from '../components/RoundBettingCard';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorMessage from '../components/ErrorMessage';
// import PremiumFeature from '../components/PremiumFeature';
import { auth } from '../config/firebase';
import subscriptionService from '../services/subscriptionService';
import { trackScreenView } from '../services/analyticsService';

type RootStackParamList = {
  FightDetail: { fightId: string };
  // Other routes
  [key: string]: object | undefined;
};

type FightDetailScreenProps = StackScreenProps<RootStackParamList, 'FightDetail'>;

const FightDetailScreen: React.FC<FightDetailScreenProps> = ({ route, navigation }) => {
  const { fightId } = route.params;
  const [fight, setFight] = useState<UFCFight | null>(null);
  const [roundBettingOptions, setRoundBettingOptions] = useState<RoundBettingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<RoundBettingOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRoundBettingAccess, setHasRoundBettingAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  // Track screen view
  useEffect(() => {
    trackScreenView('FightDetailScreen');
  }, []);

  // Check if user has access to round betting
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAccess(true);
      const user = auth.currentUser;
      if (!user) {
        setHasRoundBettingAccess(false);
        setCheckingAccess(false);
        return;
      }

      try {
        // Check if user has premium access or has purchased round betting for this fight
        const hasAccess =
          (await subscriptionService.hasPremiumAccess(user.uid)) ||
          (await subscriptionService.hasRoundBettingAccess(user.uid, fightId));

        setHasRoundBettingAccess(hasAccess);
      } catch (error) {
        console.error('Error checking round betting access:', error);
        setHasRoundBettingAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [fightId]);

  // Load fight details
  useEffect(() => {
    const loadFightData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch fight details
        const fightDetails = await ufcService.fetchFightDetails(fightId);

        if (!fightDetails) {
          throw new Error(`Fight with ID ${fightId} not found`);
        }

        setFight(fightDetails);

        // Load round betting options if user has access
        if (hasRoundBettingAccess) {
          const options = await ufcService.fetchRoundBettingOptions(fightId);
          setRoundBettingOptions(options);
        }
      } catch (error) {
        console.error('Error loading fight data:', error);
        setError('Failed to load fight data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (!checkingAccess) {
      loadFightData();
    }
  }, [fightId, hasRoundBettingAccess, checkingAccess]);

  // Handle option selection
  const handleSelectOption = (option: RoundBettingOption) => {
    setSelectedOption(option);
  };

  // Handle place bet button
  const handlePlaceBet = () => {
    if (!selectedOption) {
      Alert.alert(t('ufc.alerts.error'), t('ufc.alerts.select_option'));
      return;
    }

    // In a real app, this would call a service to place the bet
    Alert.alert(
      t('ufc.alerts.bet_placed'),
      `You bet on ${
        fight?.fighter1.id === selectedOption.fighterId
          ? fight?.fighter1.name
          : fight?.fighter2.name
      } to win by ${selectedOption.outcome} in round ${selectedOption.round}.`,
      [{ text: t('ufc.alerts.ok') }]
    );
  };

  // Handle purchase access
  const handlePurchaseAccess = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(t('ufc.alerts.error'), t('ufc.alerts.login_required'));
      return;
    }

    try {
      // Purchase round betting access for this fight
      const success = await subscriptionService.purchaseRoundBettingAccess(user.uid, fightId);

      if (success) {
        setHasRoundBettingAccess(true);
        Alert.alert(t('ufc.alerts.purchase_success'), t('ufc.alerts.purchase_success_message'));
      } else {
        Alert.alert(t('ufc.alerts.error'), t('ufc.alerts.purchase_failed'));
      }
    } catch (error) {
      console.error('Error purchasing round betting access:', error);
      Alert.alert(t('ufc.alerts.error'), t('ufc.alerts.unexpected_error'));
    }
  };

  // Render loading state
  if (loading || checkingAccess) {
    return (
      <Container style={{ backgroundColor: colors.background }}>
        <LoadingIndicator message={t('ufc.loading_fight_details')} />
      </Container>
    );
  }

  // Render error state
  if (error || !fight) {
    return (
      <Container style={{ backgroundColor: colors.background }}>
        <ErrorMessage message={error || t('ufc.fight_not_found')} />
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <ThemedText style={styles.retryButtonText}>{t('ufc.go_back')}</ThemedText>
        </TouchableOpacity>
      </Container>
    );
  }

  // Filter options for each fighter
  const fighter1Options = roundBettingOptions.filter(opt => opt.fighterId === fight.fighter1.id);
  const fighter2Options = roundBettingOptions.filter(opt => opt.fighterId === fight.fighter2.id);

  // Format fight status
  const formatStatus = (status?: FightStatus) => {
    if (!status) return t('ufc.status.scheduled');

    switch (status) {
      case FightStatus.SCHEDULED:
        return t('ufc.status.scheduled');
      case FightStatus.IN_PROGRESS:
        return t('ufc.status.in_progress');
      case FightStatus.COMPLETED:
        return t('ufc.status.completed');
      case FightStatus.CANCELLED:
        return t('ufc.status.cancelled');
      case FightStatus.POSTPONED:
        return t('ufc.status.postponed');
      default:
        return status;
    }
  };

  return (
    <Container style={{ backgroundColor: colors.background }}>
      <ScrollView style={styles.scrollView}>
        {/* Header with back button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t('ufc.fight_details')}</ThemedText>
          <View style={styles.headerRight} />
        </View>

        {/* Fight status */}
        <View
          style={[
            styles.statusContainer,
            {
              backgroundColor:
                fight.status === FightStatus.IN_PROGRESS
                  ? isDark
                    ? 'rgba(46, 204, 113, 0.2)'
                    : 'rgba(46, 204, 113, 0.1)'
                  : fight.status === FightStatus.COMPLETED
                  ? isDark
                    ? 'rgba(52, 152, 219, 0.2)'
                    : 'rgba(52, 152, 219, 0.1)'
                  : isDark
                  ? 'rgba(241, 196, 15, 0.2)'
                  : 'rgba(241, 196, 15, 0.1)',
            },
          ]}
        >
          <ThemedText style={styles.statusText}>{formatStatus(fight.status)}</ThemedText>
        </View>

        {/* Fight info */}
        <View style={styles.fightInfoContainer}>
          <ThemedText style={styles.fightTitle}>
            {fight.fighter1.name} vs {fight.fighter2.name}
          </ThemedText>

          <View style={styles.fightDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>{t('ufc.weight_class')}</ThemedText>
              <ThemedText style={styles.detailValue}>{fight.weightClass}</ThemedText>
            </View>

            {fight.isTitleFight && (
              <View
                style={[styles.titleBadge, { backgroundColor: isDark ? '#D4AF37' : '#FFD700' }]}
              >
                <ThemedText style={[styles.titleText, { color: '#000000' }]}>
                  {t('ufc.title_fight')}
                </ThemedText>
              </View>
            )}

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>{t('ufc.rounds')}</ThemedText>
              <ThemedText style={styles.detailValue}>{fight.rounds}</ThemedText>
            </View>

            {fight.startTime && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>{t('ufc.start_time')}</ThemedText>
                <ThemedText style={styles.detailValue}>{fight.startTime}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Fighters comparison */}
        <View style={styles.fightersContainer}>
          <View style={styles.fighterColumn}>
            <ThemedText style={styles.fighterName}>{fight.fighter1.name}</ThemedText>
            {fight.fighter1.nickname && (
              <ThemedText style={styles.fighterNickname}>"{fight.fighter1.nickname}"</ThemedText>
            )}
            <ThemedText style={styles.fighterRecord}>{fight.fighter1.record}</ThemedText>
            {fight.winner === fight.fighter1.id && (
              <View
                style={[
                  styles.winnerBadge,
                  {
                    backgroundColor: isDark ? 'rgba(46, 204, 113, 0.2)' : 'rgba(46, 204, 113, 0.1)',
                  },
                ]}
              >
                <ThemedText style={[styles.winnerText, { color: '#2ecc71' }]}>
                  {t('ufc.winner')}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.vsContainer}>
            <ThemedText style={[styles.vsText, { color: colors.primary }]}>
              {t('ufc.vs')}
            </ThemedText>
          </View>

          <View style={styles.fighterColumn}>
            <ThemedText style={styles.fighterName}>{fight.fighter2.name}</ThemedText>
            {fight.fighter2.nickname && (
              <ThemedText style={styles.fighterNickname}>"{fight.fighter2.nickname}"</ThemedText>
            )}
            <ThemedText style={styles.fighterRecord}>{fight.fighter2.record}</ThemedText>
            {fight.winner === fight.fighter2.id && (
              <View
                style={[
                  styles.winnerBadge,
                  {
                    backgroundColor: isDark ? 'rgba(46, 204, 113, 0.2)' : 'rgba(46, 204, 113, 0.1)',
                  },
                ]}
              >
                <ThemedText style={[styles.winnerText, { color: '#2ecc71' }]}>
                  {t('ufc.winner')}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Result details if fight is completed */}
        {fight.status === FightStatus.COMPLETED && fight.winner && fight.winMethod && (
          <View
            style={[styles.resultContainer, { backgroundColor: isDark ? '#222222' : '#F8F8F8' }]}
          >
            <ThemedText style={styles.resultTitle}>{t('ufc.fight_result')}</ThemedText>
            <ThemedText style={styles.resultText}>
              {fight.winner === fight.fighter1.id ? fight.fighter1.name : fight.fighter2.name} won
              by {fight.winMethod}
              {fight.winRound ? ` in round ${fight.winRound}` : ''}
            </ThemedText>
          </View>
        )}

        {/* Round Betting Section */}
        <View style={styles.roundBettingSection}>
          <ThemedText style={styles.sectionTitle}>{t('ufc.round_betting')}</ThemedText>

          {!hasRoundBettingAccess ? (
            // Premium feature prompt
            <View
              style={[
                styles.premiumFeatureContainer,
                { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' },
              ]}
            >
              <Ionicons name="analytics-outline" size={32} color={colors.primary} />
              <ThemedText style={styles.premiumFeatureTitle}>{t('ufc.round_betting')}</ThemedText>
              <ThemedText style={styles.premiumFeatureDescription}>
                {t('ufc.round_betting_description')}
              </ThemedText>
              <TouchableOpacity
                style={[styles.premiumFeatureButton, { backgroundColor: colors.primary }]}
                onPress={handlePurchaseAccess}
              >
                <ThemedText style={styles.premiumFeatureButtonText}>
                  {t('ufc.unlock_for_price')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            // Round betting cards
            <>
              {roundBettingOptions.length === 0 ? (
                <View style={styles.noOptionsContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText style={styles.noOptionsText}>
                    {t('ufc.loading_betting_options')}
                  </ThemedText>
                </View>
              ) : (
                <>
                  <RoundBettingCard
                    fighter={fight.fighter1}
                    options={fighter1Options}
                    onSelectOption={handleSelectOption}
                    selectedOption={selectedOption || undefined}
                  />

                  <RoundBettingCard
                    fighter={fight.fighter2}
                    options={fighter2Options}
                    onSelectOption={handleSelectOption}
                    selectedOption={selectedOption || undefined}
                  />

                  {selectedOption && (
                    <TouchableOpacity
                      style={[styles.placeBetButton, { backgroundColor: colors.primary }]}
                      onPress={handlePlaceBet}
                    >
                      <ThemedText style={styles.placeBetButtonText}>
                        {t('ufc.place_bet')}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40, // Same width as back button for alignment
  },
  statusContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  fightInfoContainer: {
    padding: 16,
  },
  fightTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fightDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
  },
  titleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  fightersContainer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 16,
  },
  fighterColumn: {
    flex: 1,
    alignItems: 'center',
  },
  vsContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  fighterName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  fighterNickname: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 4,
    opacity: 0.7,
  },
  fighterRecord: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  winnerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  winnerText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  resultContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
  },
  roundBettingSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noOptionsContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noOptionsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  placeBetButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  placeBetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Premium feature styles
  premiumFeatureContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  premiumFeatureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumFeatureDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  premiumFeatureButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  premiumFeatureButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FightDetailScreen;
