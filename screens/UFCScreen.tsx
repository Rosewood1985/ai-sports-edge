import React, { useState, useEffect, useCallback } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Container, Grid } from '../atomic/molecules/layout/ResponsiveLayout';
import { DeviceType, getDeviceType, responsiveSpacing } from '../utils/responsiveUtils';
import { useResponsiveStyles } from '../hooks/useResponsiveStyles';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { UFCEvent, UFCFighter, UFCFight } from '../types/ufc';
import { ufcService } from '../services/ufcService';
// import { analyticsService } from '../services/analyticsService';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
// Cast auth to any to avoid type errors
const firebaseAuth = auth as any;
import { rewardsService } from '../services/rewardsService';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';

// Key for storing favorite fighters
const FAVORITE_FIGHTERS_KEY = 'favorite_fighters';

// Define navigation prop type
type UFCScreenNavigationProp = StackNavigationProp<any, 'UFC'>;

interface UFCScreenProps {
  navigation: UFCScreenNavigationProp;
}

const UFCScreen: React.FC<UFCScreenProps> = ({ navigation }) => {
  const [events, setEvents] = useState<UFCEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<UFCEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteFighters, setFavoriteFighters] = useState<string[]>([]);
  const { colors, isDark } = useTheme();

  // Track screen view
  useEffect(() => {
    // trackScreenView('UFCScreen');
    console.log('UFCScreen viewed');
  }, []);

  // Load favorite fighters
  useEffect(() => {
    const loadFavoriteFighters = async () => {
      try {
        const userId = firebaseAuth.currentUser?.uid;
        if (!userId) return;

        const key = `${FAVORITE_FIGHTERS_KEY}_${userId}`;
        const storedFavorites = await AsyncStorage.getItem(key);
        if (storedFavorites) {
          setFavoriteFighters(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorite fighters:', error);
      }
    };

    loadFavoriteFighters();
  }, []);

  // Save favorite fighters
  const saveFavoriteFighters = async (favorites: string[]) => {
    try {
      const userId = firebaseAuth.currentUser?.uid;
      if (!userId) return;

      const key = `${FAVORITE_FIGHTERS_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorite fighters:', error);
    }
  };

  // Toggle favorite fighter
  const toggleFavoriteFighter = async (fighterId: string) => {
    try {
      const userId = firebaseAuth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Sign In Required', 'Please sign in to favorite fighters');
        return;
      }

      let newFavorites: string[];
      if (favoriteFighters.includes(fighterId)) {
        newFavorites = favoriteFighters.filter(id => id !== fighterId);
      } else {
        newFavorites = [...favoriteFighters, fighterId];

        // Record UFC bet for rewards if this is the first time favoriting a fighter
        if (favoriteFighters.length === 0) {
          try {
            await rewardsService.recordUFCBet(userId);
          } catch (error) {
            console.error('Error recording UFC bet:', error);
          }
        }
      }

      setFavoriteFighters(newFavorites);
      await saveFavoriteFighters(newFavorites);
    } catch (error) {
      console.error('Error toggling favorite fighter:', error);
    }
  };

  // Load UFC events
  const loadEvents = useCallback(async () => {
    try {
      setError(null);
      const upcomingEvents = await ufcService.fetchUpcomingEvents();
      setEvents(upcomingEvents);

      // Select the first event by default
      if (upcomingEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(upcomingEvents[0]);
      }
    } catch (error) {
      console.error('Error loading UFC events:', error);
      setError('Failed to load UFC events. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedEvent]);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    ufcService.clearCache();
    loadEvents();
  };

  // Render event item
  const renderEventItem = ({ item, width = 220 }: { item: UFCEvent; width?: number }) => (
    <AccessibleTouchableOpacity
      style={[
        styles.eventItem,
        {
          backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
          borderColor: selectedEvent?.id === item.id ? colors.primary : 'transparent',
          width,
        },
      ]}
      onPress={() => setSelectedEvent(item)}
      accessibilityLabel={`UFC event: ${item.name}`}
      accessibilityRole="button"
      accessibilityHint="Select this UFC event to view details"
      accessibilityState={{ selected: selectedEvent?.id === item.id }}
    >
      <AccessibleThemedText
        style={[styles.eventName, { color: colors.text }]}
        type="h3"
        accessibilityLabel={`Event name: ${item.name}`}
      >
        {item.name}
      </AccessibleThemedText>
      <AccessibleThemedText
        style={[styles.eventDate, { color: colors.text }]}
        accessibilityLabel={`Event date: ${new Date(item.date).toLocaleDateString()} at ${
          item.time
        }`}
      >
        {new Date(item.date).toLocaleDateString()} • {item.time}
      </AccessibleThemedText>
      <AccessibleThemedText
        style={[styles.eventVenue, { color: isDark ? '#BBBBBB' : '#666666' }]}
        accessibilityLabel={`Event location: ${item.venue}, ${item.location}`}
      >
        {item.venue}, {item.location}
      </AccessibleThemedText>
    </AccessibleTouchableOpacity>
  );

  // Navigate to fight detail screen
  const navigateToFightDetail = (fight: UFCFight) => {
    navigation.navigate('FightDetail', { fightId: fight.id });
  };

  // Render fight card
  const renderFightCard = (fights: UFCFight[], title: string) => {
    if (!fights || fights.length === 0) return null;

    return (
      <AccessibleThemedView
        style={styles.fightCardContainer}
        accessibilityLabel={`${title} section`}
      >
        <AccessibleThemedText
          style={[styles.fightCardTitle, { color: colors.text }]}
          type="h2"
          accessibilityLabel={title}
        >
          {title}
        </AccessibleThemedText>
        {fights.map((fight, index) => (
          <AccessibleTouchableOpacity
            key={fight.id || index}
            style={[
              styles.fightItem,
              {
                backgroundColor: isDark ? '#222222' : '#FFFFFF',
                borderColor: isDark ? '#333333' : '#EEEEEE',
              },
            ]}
            onPress={() => navigateToFightDetail(fight)}
            accessibilityLabel={`Fight: ${fight.fighter1.name} versus ${fight.fighter2.name}`}
            accessibilityRole="button"
            accessibilityHint="View fight details"
          >
            <AccessibleThemedView
              style={[
                styles.fighterContainer,
                { backgroundColor: isDark ? '#1A1A1A' : '#F8F8F8', borderRadius: 8 },
              ]}
              accessibilityLabel={`Fighter: ${fight.fighter1.name}`}
            >
              <AccessibleTouchableOpacity
                style={[
                  styles.favoriteButton,
                  {
                    backgroundColor: favoriteFighters.includes(fight.fighter1.id)
                      ? 'rgba(255, 215, 0, 0.2)'
                      : 'transparent',
                    borderRadius: 20,
                  },
                ]}
                onPress={() => toggleFavoriteFighter(fight.fighter1.id)}
                accessibilityLabel={
                  favoriteFighters.includes(fight.fighter1.id)
                    ? `Remove ${fight.fighter1.name} from favorites`
                    : `Add ${fight.fighter1.name} to favorites`
                }
                accessibilityRole="button"
                accessibilityState={{ selected: favoriteFighters.includes(fight.fighter1.id) }}
              >
                <Ionicons
                  name={favoriteFighters.includes(fight.fighter1.id) ? 'star' : 'star-outline'}
                  size={22}
                  color={favoriteFighters.includes(fight.fighter1.id) ? '#FFD700' : colors.primary}
                  accessibilityLabel={
                    favoriteFighters.includes(fight.fighter1.id) ? 'Favorite' : 'Not favorite'
                  }
                />
              </AccessibleTouchableOpacity>
              <AccessibleThemedView
                style={styles.fighterInfo}
                accessibilityLabel="Fighter information"
              >
                <AccessibleThemedText
                  style={[
                    styles.fighterName,
                    {
                      color: colors.text,
                      fontSize: 17,
                      letterSpacing: 0.3,
                    },
                  ]}
                  accessibilityLabel={`Name: ${fight.fighter1.name}`}
                >
                  {fight.fighter1.name}
                </AccessibleThemedText>
                {fight.fighter1.nickname && (
                  <AccessibleThemedText
                    style={[
                      styles.fighterNickname,
                      {
                        color: isDark ? '#D0D0D0' : '#505050',
                        fontSize: 13,
                      },
                    ]}
                    accessibilityLabel={`Nickname: ${fight.fighter1.nickname}`}
                  >
                    "{fight.fighter1.nickname}"
                  </AccessibleThemedText>
                )}
                <AccessibleThemedView
                  style={styles.recordContainer}
                  accessibilityLabel="Fighter record"
                >
                  <AccessibleThemedText
                    style={[
                      styles.fighterRecord,
                      {
                        color: isDark ? '#FFFFFF' : '#000000',
                        fontWeight: '600',
                        backgroundColor: isDark
                          ? 'rgba(52, 152, 219, 0.2)'
                          : 'rgba(52, 152, 219, 0.1)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                      },
                    ]}
                    accessibilityLabel={`Record: ${fight.fighter1.record}`}
                  >
                    {fight.fighter1.record}
                  </AccessibleThemedText>
                </AccessibleThemedView>
              </AccessibleThemedView>
              <AccessibleThemedView
                style={[
                  styles.fighterImageContainer,
                  {
                    borderWidth: 2,
                    borderColor: isDark ? '#333333' : '#DDDDDD',
                  },
                ]}
                accessibilityLabel="Fighter image"
              >
                {fight.fighter1.imageUrl ? (
                  <Image
                    source={{ uri: fight.fighter1.imageUrl }}
                    style={styles.fighterImage}
                    accessibilityLabel={`Photo of ${fight.fighter1.name}`}
                  />
                ) : (
                  <AccessibleThemedView
                    style={[
                      styles.defaultFighterImage,
                      {
                        backgroundColor: isDark ? '#2C2C2C' : '#E8E8E8',
                        borderWidth: 1,
                        borderColor: isDark ? '#444444' : '#CCCCCC',
                      },
                    ]}
                    accessibilityLabel={`Default image for ${fight.fighter1.name}`}
                  >
                    <Ionicons
                      name="person"
                      size={24}
                      color={isDark ? '#888888' : '#666666'}
                      accessibilityLabel="Person icon"
                    />
                    <AccessibleThemedText
                      style={[
                        styles.defaultFighterInitial,
                        {
                          color: isDark ? '#FFFFFF' : '#333333',
                          fontWeight: '700',
                        },
                      ]}
                      accessibilityLabel={`Initial: ${fight.fighter1.name.charAt(0)}`}
                    >
                      {fight.fighter1.name.charAt(0)}
                    </AccessibleThemedText>
                  </AccessibleThemedView>
                )}
              </AccessibleThemedView>
            </AccessibleThemedView>

            <AccessibleThemedView
              style={[
                styles.vsContainer,
                {
                  backgroundColor: isDark ? 'rgba(52, 152, 219, 0.1)' : 'rgba(52, 152, 219, 0.05)',
                  borderRadius: 8,
                  padding: 12,
                  marginVertical: 12,
                },
              ]}
              accessibilityLabel="Versus section"
            >
              <AccessibleThemedText
                style={[
                  styles.vsText,
                  {
                    color: colors.primary,
                    fontSize: 20,
                    fontWeight: '800',
                    letterSpacing: 1,
                    textShadowColor: 'rgba(52, 152, 219, 0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  },
                ]}
                accessibilityLabel="Versus"
              >
                VS
              </AccessibleThemedText>
              <AccessibleThemedView style={styles.fightDetails} accessibilityLabel="Fight details">
                <AccessibleThemedView
                  style={[
                    styles.weightClassContainer,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      marginTop: 8,
                    },
                  ]}
                  accessibilityLabel="Weight class"
                >
                  <AccessibleThemedText
                    style={[
                      styles.weightClass,
                      {
                        color: isDark ? '#E0E0E0' : '#333333',
                        fontWeight: '600',
                        fontSize: 14,
                      },
                    ]}
                    accessibilityLabel={`Weight class: ${fight.weightClass}`}
                  >
                    {fight.weightClass}
                  </AccessibleThemedText>
                </AccessibleThemedView>
                {fight.isTitleFight && (
                  <AccessibleThemedView
                    style={[
                      styles.titleFightBadge,
                      {
                        backgroundColor: isDark ? '#D4AF37' : '#FFD700',
                        borderWidth: 1,
                        borderColor: isDark ? '#B8860B' : '#DAA520',
                        marginTop: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 4,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 1,
                        elevation: 2,
                      },
                    ]}
                    accessibilityLabel="Title fight badge"
                  >
                    <AccessibleThemedText
                      style={[
                        styles.titleFightText,
                        {
                          color: '#000000',
                          fontSize: 12,
                          fontWeight: '800',
                          letterSpacing: 0.5,
                        },
                      ]}
                      accessibilityLabel="Title fight"
                    >
                      TITLE FIGHT
                    </AccessibleThemedText>
                  </AccessibleThemedView>
                )}
              </AccessibleThemedView>
            </AccessibleThemedView>

            <AccessibleThemedView
              style={[
                styles.fighterContainer,
                { backgroundColor: isDark ? '#1A1A1A' : '#F8F8F8', borderRadius: 8 },
              ]}
              accessibilityLabel={`Fighter: ${fight.fighter2.name}`}
            >
              <AccessibleTouchableOpacity
                style={[
                  styles.favoriteButton,
                  {
                    backgroundColor: favoriteFighters.includes(fight.fighter2.id)
                      ? 'rgba(255, 215, 0, 0.2)'
                      : 'transparent',
                    borderRadius: 20,
                  },
                ]}
                onPress={() => toggleFavoriteFighter(fight.fighter2.id)}
                accessibilityLabel={
                  favoriteFighters.includes(fight.fighter2.id)
                    ? `Remove ${fight.fighter2.name} from favorites`
                    : `Add ${fight.fighter2.name} to favorites`
                }
                accessibilityRole="button"
                accessibilityState={{ selected: favoriteFighters.includes(fight.fighter2.id) }}
              >
                <Ionicons
                  name={favoriteFighters.includes(fight.fighter2.id) ? 'star' : 'star-outline'}
                  size={22}
                  color={favoriteFighters.includes(fight.fighter2.id) ? '#FFD700' : colors.primary}
                  accessibilityLabel={
                    favoriteFighters.includes(fight.fighter2.id) ? 'Favorite' : 'Not favorite'
                  }
                />
              </AccessibleTouchableOpacity>
              <AccessibleThemedView
                style={styles.fighterInfo}
                accessibilityLabel="Fighter information"
              >
                <AccessibleThemedText
                  style={[
                    styles.fighterName,
                    {
                      color: colors.text,
                      fontSize: 17,
                      letterSpacing: 0.3,
                    },
                  ]}
                  accessibilityLabel={`Name: ${fight.fighter2.name}`}
                >
                  {fight.fighter2.name}
                </AccessibleThemedText>
                {fight.fighter2.nickname && (
                  <AccessibleThemedText
                    style={[
                      styles.fighterNickname,
                      {
                        color: isDark ? '#D0D0D0' : '#505050',
                        fontSize: 13,
                      },
                    ]}
                    accessibilityLabel={`Nickname: ${fight.fighter2.nickname}`}
                  >
                    "{fight.fighter2.nickname}"
                  </AccessibleThemedText>
                )}
                <AccessibleThemedView
                  style={styles.recordContainer}
                  accessibilityLabel="Fighter record"
                >
                  <AccessibleThemedText
                    style={[
                      styles.fighterRecord,
                      {
                        color: isDark ? '#FFFFFF' : '#000000',
                        fontWeight: '600',
                        backgroundColor: isDark
                          ? 'rgba(52, 152, 219, 0.2)'
                          : 'rgba(52, 152, 219, 0.1)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                      },
                    ]}
                    accessibilityLabel={`Record: ${fight.fighter2.record}`}
                  >
                    {fight.fighter2.record}
                  </AccessibleThemedText>
                </AccessibleThemedView>
              </AccessibleThemedView>
              <AccessibleThemedView
                style={[
                  styles.fighterImageContainer,
                  {
                    borderWidth: 2,
                    borderColor: isDark ? '#333333' : '#DDDDDD',
                  },
                ]}
                accessibilityLabel="Fighter image"
              >
                {fight.fighter2.imageUrl ? (
                  <Image
                    source={{ uri: fight.fighter2.imageUrl }}
                    style={styles.fighterImage}
                    accessibilityLabel={`Photo of ${fight.fighter2.name}`}
                  />
                ) : (
                  <AccessibleThemedView
                    style={[
                      styles.defaultFighterImage,
                      {
                        backgroundColor: isDark ? '#2C2C2C' : '#E8E8E8',
                        borderWidth: 1,
                        borderColor: isDark ? '#444444' : '#CCCCCC',
                      },
                    ]}
                    accessibilityLabel={`Default image for ${fight.fighter2.name}`}
                  >
                    <Ionicons
                      name="person"
                      size={24}
                      color={isDark ? '#888888' : '#666666'}
                      accessibilityLabel="Person icon"
                    />
                    <AccessibleThemedText
                      style={[
                        styles.defaultFighterInitial,
                        {
                          color: isDark ? '#FFFFFF' : '#333333',
                          fontWeight: '700',
                        },
                      ]}
                      accessibilityLabel={`Initial: ${fight.fighter2.name.charAt(0)}`}
                    >
                      {fight.fighter2.name.charAt(0)}
                    </AccessibleThemedText>
                  </AccessibleThemedView>
                )}
              </AccessibleThemedView>
            </AccessibleThemedView>
          </AccessibleTouchableOpacity>
        ))}
      </AccessibleThemedView>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <AccessibleThemedView
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLabel="Loading UFC events"
      >
        <LoadingIndicator message="Loading UFC events..." />
      </AccessibleThemedView>
    );
  }

  // Render error state
  if (error) {
    return (
      <AccessibleThemedView
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLabel="Error loading UFC events"
      >
        <AccessibleThemedView style={styles.errorContainer} accessibilityLabel="Error message">
          <ErrorMessage message={error} />
          <AccessibleTouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
            accessibilityLabel="Retry loading UFC events"
            accessibilityRole="button"
            accessibilityHint="Attempts to reload UFC events data"
          >
            <AccessibleThemedText style={styles.retryButtonText}>Retry</AccessibleThemedText>
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>
      </AccessibleThemedView>
    );
  }

  // Render empty state
  if (events.length === 0) {
    return (
      <AccessibleThemedView
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLabel="No UFC events available"
      >
        <AccessibleThemedView
          style={styles.emptyStateContainer}
          accessibilityLabel="Empty state message"
        >
          <Ionicons
            name="calendar-outline"
            size={64}
            color={colors.primary}
            accessibilityLabel="Calendar icon"
          />
          <AccessibleThemedText
            style={[styles.emptyStateTitle, { color: colors.text }]}
            type="h2"
            accessibilityLabel="No UFC Events"
          >
            No UFC Events
          </AccessibleThemedText>
          <AccessibleThemedText
            style={[styles.emptyStateMessage, { color: isDark ? '#BBBBBB' : '#666666' }]}
            accessibilityLabel="There are no upcoming UFC events at this time"
          >
            There are no upcoming UFC events at this time.
          </AccessibleThemedText>
          <AccessibleTouchableOpacity
            style={[styles.refreshActionButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
            accessibilityLabel="Refresh UFC events"
            accessibilityRole="button"
            accessibilityHint="Attempts to reload UFC events data"
          >
            <AccessibleThemedText style={styles.refreshActionButtonText}>
              Refresh
            </AccessibleThemedText>
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>
      </AccessibleThemedView>
    );
  }

  // Get device type for responsive layout
  const isTablet = getDeviceType() === DeviceType.TABLET;

  // Create responsive styles
  const responsiveStyles = useResponsiveStyles(({ isTablet }) => ({
    eventsList: {
      paddingRight: isTablet ? 24 : 16,
    },
    eventItem: {
      width: isTablet ? 280 : 220,
    },
    fightCardsContainer: {
      flexDirection: isTablet ? ('row' as const) : ('column' as const),
    },
    mainCardContainer: {
      flex: isTablet ? 1 : undefined,
      marginRight: isTablet ? 16 : 0,
    },
    prelimCardContainer: {
      flex: isTablet ? 1 : undefined,
      marginTop: isTablet ? 0 : 16,
    },
  }));

  return (
    <Container style={{ backgroundColor: colors.background }}>
      {/* First child with accessibilityLabel since Container doesn't support it */}
      <AccessibleThemedView accessibilityLabel="UFC Events Screen" style={{ flex: 1 }}>
        <AccessibleThemedView
          style={[
            styles.backgroundGradient,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 200,
              backgroundColor: isDark ? 'rgba(52, 152, 219, 0.1)' : 'rgba(52, 152, 219, 0.05)',
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
            },
          ]}
          accessibilityLabel="Background decoration"
        />

        <AccessibleThemedView style={styles.header} accessibilityLabel="Screen header">
          <AccessibleThemedText
            style={[
              styles.title,
              {
                color: isDark ? '#FFFFFF' : '#333333',
              },
            ]}
            type="h1"
            accessibilityLabel="UFC Events"
          >
            UFC Events
          </AccessibleThemedText>
          <AccessibleTouchableOpacity
            style={[
              styles.refreshButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(52, 152, 219, 0.1)',
              },
            ]}
            onPress={handleRefresh}
            disabled={refreshing}
            accessibilityLabel="Refresh UFC events"
            accessibilityRole="button"
            accessibilityHint="Reload UFC events data"
            accessibilityState={{ disabled: refreshing }}
          >
            {refreshing ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                accessibilityLabel="Loading indicator"
              />
            ) : (
              <Ionicons
                name="refresh"
                size={24}
                color={colors.primary}
                accessibilityLabel="Refresh icon"
              />
            )}
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>

        {/* Events horizontal list - adaptive width based on device */}
        <FlatList
          horizontal
          data={events}
          renderItem={({ item }) =>
            renderEventItem({
              item,
              width: responsiveStyles.eventItem.width,
            })
          }
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.eventsList, responsiveStyles.eventsList]}
          showsHorizontalScrollIndicator={false}
          accessible={true}
          accessibilityLabel="UFC events list"
          accessibilityHint="Scroll horizontally to view all events"
        />

        {selectedEvent && (
          <ScrollView
            style={styles.eventDetailsContainer}
            accessible={true}
            accessibilityLabel="Event details"
          >
            <AccessibleThemedText
              style={[styles.eventDetailsTitle, { color: colors.text }]}
              type="h2"
              accessibilityLabel={`Event: ${selectedEvent.name}`}
            >
              {selectedEvent.name}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={[styles.eventDetailsDate, { color: colors.text }]}
              accessibilityLabel={`Date and time: ${new Date(
                selectedEvent.date
              ).toLocaleDateString()} at ${selectedEvent.time}`}
            >
              {new Date(selectedEvent.date).toLocaleDateString()} • {selectedEvent.time}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={[styles.eventDetailsVenue, { color: isDark ? '#BBBBBB' : '#666666' }]}
              accessibilityLabel={`Venue: ${selectedEvent.venue}, ${selectedEvent.location}`}
            >
              {selectedEvent.venue}, {selectedEvent.location}
            </AccessibleThemedText>

            {/* Responsive fight cards layout - row on tablet, column on phone */}
            <AccessibleThemedView
              style={[styles.fightCardsContainer, responsiveStyles.fightCardsContainer]}
              accessibilityLabel="Fight cards section"
            >
              <AccessibleThemedView
                style={responsiveStyles.mainCardContainer}
                accessibilityLabel="Main card section"
              >
                {renderFightCard(selectedEvent.mainCard, 'Main Card')}
              </AccessibleThemedView>

              {selectedEvent.prelimCard && selectedEvent.prelimCard.length > 0 && (
                <AccessibleThemedView
                  style={responsiveStyles.prelimCardContainer}
                  accessibilityLabel="Preliminary card section"
                >
                  {renderFightCard(selectedEvent.prelimCard, 'Preliminary Card')}
                </AccessibleThemedView>
              )}
            </AccessibleThemedView>
          </ScrollView>
        )}
      </AccessibleThemedView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  eventsList: {
    paddingRight: 16,
  },
  eventItem: {
    padding: 16,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  eventDate: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '500',
  },
  eventVenue: {
    fontSize: 13,
    opacity: 0.8,
  },
  eventDetailsContainer: {
    flex: 1,
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  eventDetailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  eventDetailsDate: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 6,
  },
  eventDetailsVenue: {
    fontSize: 15,
    marginBottom: 20,
    opacity: 0.8,
  },
  fightCardsContainer: {
    flex: 1,
  },
  fightCardContainer: {
    marginBottom: 16,
  },
  fightCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fightItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fighterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  fighterInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  fighterName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fighterNickname: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  fighterRecord: {
    fontSize: 14,
  },
  fighterImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  fighterImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultFighterImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultFighterInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    position: 'absolute',
  },
  vsContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fightDetails: {
    alignItems: 'center',
  },
  weightClassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightClass: {
    fontSize: 14,
    marginTop: 4,
  },
  titleFightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  titleFightText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  refreshActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UFCScreen;
