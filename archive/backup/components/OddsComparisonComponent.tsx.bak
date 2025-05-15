import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import { View, Text, TouchableOpacity, Animated, Linking, StyleSheet, ActivityIndicator, Alert, Platform, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { Game, Bookmaker } from '../types/odds';
import { bettingAffiliateService } from '../services/bettingAffiliateService';
import { auth } from '../config/firebase';
import { oddsCacheService } from '../services/oddsCacheService';
import API_KEYS, { API_BASE_URLS, isApiKeyConfigured } from '../config/apiKeys';
import { microtransactionService, MICROTRANSACTION_TYPES } from '../services/microtransactionService';
import { errorRecoveryService, ErrorType, RecoveryStrategy } from '../services/errorRecoveryService';
import { oddsHistoryService } from '../services/oddsHistoryService';
import { analyticsService, AnalyticsEventType, ConversionFunnelStep } from '../services/analyticsService';
import { abTestingService } from '../services/abTestingService';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { AVAILABLE_SPORTS } from './SportSelector';
import { LazySportSelector, LazyOddsMovementAlerts, LazyParlayIntegration } from './LazyComponents';
import PersonalizationSettings from './PersonalizationSettings';
import { memoizeWithTTL, registerCleanup, unregisterCleanup, clearExpiredCache } from '../utils/memoryManagement';
import ResponsiveBookmakerLogo from './ResponsiveBookmakerLogo';
import ResponsiveTeamLogo from './ResponsiveTeamLogo';
import ResponsiveGameInfo from './ResponsiveGameInfo';
import ResponsiveBookmakerCard from './ResponsiveBookmakerCard';
import { createOptimizedGlowStyle } from './OptimizedOddsAnimations';

interface OddsComparisonComponentProps {
    isPremium?: boolean;
}

// Define sorting options
type SortOption = 'best' | 'draftkings' | 'fanduel';

// Define filter options
interface FilterOptions {
    showDraftKings: boolean;
    showFanDuel: boolean;
    minOdds: number | null;
    maxOdds: number | null;
}

interface OddsComparisonComponentRef {
    handleRefresh: () => Promise<void>;
}

/**
 * OddsComparisonComponent displays a comparison of odds between DraftKings and FanDuel
 * with visual highlighting of the better odds
 */
const OddsComparisonComponent = forwardRef<OddsComparisonComponentRef, OddsComparisonComponentProps>(({ isPremium = false }, ref) => {
    // Generate a unique component ID for cleanup registration
    const componentId = useRef(`odds_comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`).current;
    const [draftKingsOdds, setDraftKingsOdds] = useState<number | null>(null);
    const [fanDuelOdds, setFanDuelOdds] = useState<number | null>(null);
    const [glowAnimationDK, setGlowAnimationDK] = useState(new Animated.Value(0));
    const [glowAnimationFD, setGlowAnimationFD] = useState(new Animated.Value(0));
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [noData, setNoData] = useState<boolean>(false);
    const [hasPurchasedOdds, setHasPurchasedOdds] = useState<boolean>(false);
    const [affiliateCode, setAffiliateCode] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<'api' | 'cache' | 'stale' | 'fallback' | 'error'>('api');
    const [retryCount, setRetryCount] = useState<number>(0);
    // Get personalization preferences
    const { preferences } = usePersonalization();
    
    // Use default sport from preferences if available
    const [selectedSport, setSelectedSport] = useState<string>(
        preferences.defaultSport || 'basketball_nba'
    );
    const [showAlertsModal, setShowAlertsModal] = useState<boolean>(false);
    const [showPersonalizationModal, setShowPersonalizationModal] = useState<boolean>(false);
    const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    
    // A/B testing state
    const [experimentVariant, setExperimentVariant] = useState<any>(null);
    const [experimentId] = useState<string>('odds_comparison_layout_experiment');
    
    // Sorting and filtering states
    const [sortOption, setSortOption] = useState<SortOption>('best');
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        showDraftKings: true,
        showFanDuel: true,
        minOdds: null,
        maxOdds: null
    });
    const [showFilters, setShowFilters] = useState<boolean>(false);
    
    const { colors, isDark } = useTheme();
    const { t } = useI18n();

    // Fetch odds data with caching and error recovery
    const fetchOdds = useCallback(async () => {
        setLoading(true);
        setError(null);
        setNoData(false);
        setRetryCount(0);
        
        // Track analytics event for odds refresh
        await analyticsService.trackEvent(AnalyticsEventType.ODDS_REFRESHED, {
            sport: selectedSport,
            source: 'manual',
            experiment_id: experimentId,
            variant_id: experimentVariant?.id || 'none'
        });
        
        // Check if Odds API key is configured
        if (!isApiKeyConfigured('ODDS_API_KEY')) {
            console.error('ODDS_API_KEY is not configured');
            setError('Configuration error. Please contact support.');
            setLoading(false);
            return;
        }
        
        const apiKey = API_KEYS.ODDS_API_KEY as string;
        const cacheKey = `odds_${selectedSport}`;
        
        // Check cache first
        try {
            const cachedData = await oddsCacheService.getCachedData<Game[]>(cacheKey);
            
            if (cachedData) {
                // Use cached data
                setDataSource(cachedData.source);
                await processOddsData(cachedData.data);
                setLastUpdated(new Date(cachedData.timestamp));
                
                // Track analytics event for using cached data
                await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
                    event_name: 'odds_loaded_from_cache',
                    sport: selectedSport,
                    cache_age_ms: Date.now() - cachedData.timestamp,
                    cache_source: cachedData.source,
                    experiment_id: experimentId,
                    variant_id: experimentVariant?.id || 'none'
                });
                
                // If cache is stale, fetch fresh data in the background
                if (cachedData.source === 'stale') {
                    fetchFreshData(apiKey, cacheKey);
                }
                
                setLoading(false);
                return;
            }
        } catch (cacheError) {
            console.error('Cache error:', cacheError);
            // Continue to fetch fresh data if cache fails
        }
        
        // Fetch fresh data if no cache or cache expired
        await fetchFreshData(apiKey, cacheKey);
    }, []);
    
    // Helper function to fetch fresh data with error recovery
    const fetchFreshData = async (apiKey: string, cacheKey: string) => {
        const endpoint = `${API_BASE_URLS.ODDS_API}/sports/${selectedSport}/odds`;
        
        // Define the API call function
        const fetchFromApi = async () => {
            const response = await axios.get(endpoint, {
                params: {
                    apiKey,
                    regions: 'us',
                    markets: 'h2h',
                    oddsFormat: 'american'
                }
            });
            return response.data;
        };
        
        // Define fallback function to get data from cache or generate mock data
        const getFallbackData = async () => {
            // Try to get data from cache even if expired
            const cachedData = await oddsCacheService.getCachedData<Game[]>(cacheKey);
            if (cachedData) {
                return cachedData.data;
            }
            
            // If no cache, return mock data
            return generateMockData();
        };
        
        try {
            // Use error recovery service to handle API errors
            const result = await errorRecoveryService.handleApiError<Game[]>(
                { message: 'Initial fetch attempt' }, // Dummy error to start the process
                endpoint,
                fetchFromApi,
                getFallbackData
            );
            
            // Set data source
            setDataSource(result.source);
            
            // Process the data
            if (result.data) {
                // Cache the data if it's from the API
                if (result.source === 'api') {
                    await oddsCacheService.setCachedData(cacheKey, result.data);
                    
                    // Track successful API fetch
                    analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
                        event_name: 'odds_fetch_success',
                        sport: selectedSport,
                        source: 'api'
                    });
                } else {
                    // Track fallback data usage
                    analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
                        event_name: 'odds_fetch_fallback',
                        sport: selectedSport,
                        source: result.source
                    });
                }
                
                await processOddsData(result.data);
                setLastUpdated(new Date());
            } else if (result.error) {
                // Track error
                analyticsService.trackEvent(AnalyticsEventType.ERROR_OCCURRED, {
                    error_type: 'odds_fetch_error',
                    error_message: result.error.message,
                    sport: selectedSport,
                    retry_count: retryCount
                });
                
                // Provide more specific error message based on error type
                if (result.error.message.includes('rate limit')) {
                    setError('Rate limit exceeded. Please try again in a few minutes.');
                } else if (result.error.message.includes('network')) {
                    setError('Network error. Please check your connection and try again.');
                } else {
                    setError(`${result.error.message}. Please try again later.`);
                }
                setNoData(true);
            }
        } catch (error) {
            console.error('Error fetching odds:', error);
            
            // Track unexpected error
            analyticsService.trackEvent(AnalyticsEventType.ERROR_OCCURRED, {
                error_type: 'odds_fetch_unexpected_error',
                error_message: error instanceof Error ? error.message : 'Unknown error',
                sport: selectedSport,
                retry_count: retryCount
            });
            
            // Provide more user-friendly error message
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    setError('Request timed out. Please try again.');
                } else if (error.message.includes('network')) {
                    setError('Network error. Please check your connection and try again.');
                } else {
                    setError('Failed to fetch odds data. Please try again later.');
                }
            } else {
                setError('Failed to fetch odds data. Please try again later.');
            }
            setNoData(true);
        } finally {
            setLoading(false);
        }
    };
    
    // Helper function to process odds data - memoized for performance
    const processOddsData = memoizeWithTTL(async (data: Game[]) => {
        if (!data || data.length === 0) {
            setNoData(true);
            return;
        }
        
        // Find games with both DraftKings and FanDuel odds
        const gamesWithBothBookmakers = data.filter((game: Game) =>
            game.bookmakers.some((book: Bookmaker) => book.key === 'draftkings') &&
            game.bookmakers.some((book: Bookmaker) => book.key === 'fanduel')
        );
        
        if (gamesWithBothBookmakers.length === 0) {
            setNoData(true);
            return;
        }
        
        // Use the first game that has both bookmakers
        const selectedGame = gamesWithBothBookmakers[0];
        setSelectedGame(selectedGame);
        
        // Extract DraftKings odds
        let dkOdds: number | null = null;
        const dkBookmaker = selectedGame.bookmakers.find((book: Bookmaker) => book.key === 'draftkings');
        if (dkBookmaker && dkBookmaker.markets[0] && dkBookmaker.markets[0].outcomes[0]) {
            dkOdds = dkBookmaker.markets[0].outcomes[0].price;
            setDraftKingsOdds(dkOdds);
        }
        
        // Extract FanDuel odds
        let fdOdds: number | null = null;
        const fdBookmaker = selectedGame.bookmakers.find((book: Bookmaker) => book.key === 'fanduel');
        if (fdBookmaker && fdBookmaker.markets[0] && fdBookmaker.markets[0].outcomes[0]) {
            fdOdds = fdBookmaker.markets[0].outcomes[0].price;
            setFanDuelOdds(fdOdds);
        }
        
        // Track odds history
        await oddsHistoryService.trackOdds(
            selectedGame.sport_key,
            selectedGame.id,
            selectedGame.home_team,
            selectedGame.away_team,
            dkOdds,
            fdOdds
        );
        
        // Track analytics for odds viewed
        await analyticsService.trackEvent(AnalyticsEventType.ODDS_VIEWED, {
            sport: selectedSport,
            game_id: selectedGame.id,
            home_team: selectedGame.home_team,
            away_team: selectedGame.away_team,
            draftkings_odds: dkOdds,
            fanduel_odds: fdOdds,
            better_odds: dkOdds !== null && fdOdds !== null ?
                (dkOdds < fdOdds ? 'draftkings' : 'fanduel') :
                'unknown',
            experiment_id: experimentId,
            variant_id: experimentVariant?.id || 'none'
        });
        
        // Check for unread alerts
        const unreadAlerts = await oddsHistoryService.getUnreadMovementAlerts();
        setUnreadAlertsCount(unreadAlerts.length);
    },
    // Key function for memoization - based on the first game ID if available
    (data: Game[]) => {
        if (!data || data.length === 0) return 'empty';
        return `${selectedSport}_${data[0]?.id || 'unknown'}`;
    },
    // Use a longer TTL for iOS to reduce processing overhead
    Platform.OS === 'ios' ? 5 * 60 * 1000 : 2 * 60 * 1000);
    
    // Generate mock data for fallback
    const generateMockData = (): Game[] => {
        // Get sport info based on selected sport
        const sportInfo = AVAILABLE_SPORTS.find(sport => sport.key === selectedSport) || AVAILABLE_SPORTS[0];
        
        // Generate appropriate teams based on sport
        let homeTeam = 'Home Team';
        let awayTeam = 'Away Team';
        
        switch (selectedSport) {
            case 'basketball_nba':
                homeTeam = 'Los Angeles Lakers';
                awayTeam = 'Boston Celtics';
                break;
            case 'basketball_ncaab':
                homeTeam = 'Duke Blue Devils';
                awayTeam = 'North Carolina Tar Heels';
                break;
            case 'football_nfl':
                homeTeam = 'Kansas City Chiefs';
                awayTeam = 'San Francisco 49ers';
                break;
            case 'hockey_nhl':
                homeTeam = 'Toronto Maple Leafs';
                awayTeam = 'Boston Bruins';
                break;
            case 'baseball_mlb':
                homeTeam = 'New York Yankees';
                awayTeam = 'Boston Red Sox';
                break;
            case 'soccer_epl':
                homeTeam = 'Manchester United';
                awayTeam = 'Liverpool';
                break;
            case 'soccer_mls':
                homeTeam = 'LA Galaxy';
                awayTeam = 'Seattle Sounders';
                break;
            case 'mma_ufc':
                homeTeam = 'Fighter 1';
                awayTeam = 'Fighter 2';
                break;
        }
        
        return [{
            id: 'mock-game-1',
            sport_key: sportInfo.key,
            sport_title: sportInfo.name,
            commence_time: new Date().toISOString(),
            home_team: homeTeam,
            away_team: awayTeam,
            bookmakers: [
                {
                    key: 'draftkings',
                    title: 'DraftKings',
                    // Remove last_update as it's not in the Bookmaker type
                    markets: [{
                        key: 'h2h',
                        outcomes: [{
                            name: 'Los Angeles Lakers',
                            price: -110
                        }]
                    }]
                },
                {
                    key: 'fanduel',
                    title: 'FanDuel',
                    // Remove last_update as it's not in the Bookmaker type
                    markets: [{
                        key: 'h2h',
                        outcomes: [{
                            name: 'Los Angeles Lakers',
                            price: -105
                        }]
                    }]
                }
            ]
        }];
    };

    // Expose the refresh method to parent components
    useImperativeHandle(ref, () => ({
        handleRefresh: fetchOdds
    }));

    // Load affiliate code and user ID on component mount
    useEffect(() => {
        const loadAffiliateCode = async () => {
            try {
                const code = await bettingAffiliateService.loadAffiliateCode();
                setAffiliateCode(code || 'AISPORTSEDGE');
                
                // Get current user ID
                const currentUser = auth.currentUser;
                if (currentUser) {
                    setUserId(currentUser.uid);
                }
                
                // Check if user has purchased odds (in a real app, this would check a database)
                // For now, we'll assume they haven't purchased unless they're premium
                setHasPurchasedOdds(isPremium);
            } catch (error) {
                console.error('Error loading affiliate code:', error);
            }
        };
        
        loadAffiliateCode();
    }, [isPremium]);
    
    // Fetch odds on component mount
    useEffect(() => {
        fetchOdds();
    }, [fetchOdds]);
    
    // Check for unread alerts on component mount
    useEffect(() => {
        const checkUnreadAlerts = async () => {
            try {
                const unreadAlerts = await oddsHistoryService.getUnreadMovementAlerts();
                setUnreadAlertsCount(unreadAlerts.length);
            } catch (error) {
                console.error('Error checking unread alerts:', error);
            }
        };
        
        checkUnreadAlerts();
    }, []);
    
    // Initialize A/B testing experiment
    useEffect(() => {
        const initializeExperiment = async () => {
            try {
                // Check if experiment exists, if not create it
                const experiment = await abTestingService.getExperiment(experimentId);
                
                if (!experiment) {
                    // Create experiment with two variants
                    await abTestingService.createExperiment({
                        name: 'Odds Comparison Layout',
                        description: 'Testing different layouts for the odds comparison component',
                        variants: [
                            {
                                id: 'control',
                                name: 'Control',
                                description: 'Original layout',
                                weight: 50,
                                properties: {
                                    layout: 'default',
                                    showBetterOddsHighlight: true,
                                    animationDuration: 1000
                                }
                            },
                            {
                                id: 'variant_a',
                                name: 'Variant A',
                                description: 'Enhanced layout with stronger visual hierarchy',
                                weight: 50,
                                properties: {
                                    layout: 'enhanced',
                                    showBetterOddsHighlight: true,
                                    animationDuration: 1500,
                                    useStrongerContrast: true
                                }
                            }
                        ],
                        isActive: true,
                        targetAudience: {
                            isPremium: undefined, // Target all users
                            platforms: ['ios', 'android', 'web'] // Target all platforms
                        }
                    });
                }
                
                // Get variant for user
                const variant = await abTestingService.getVariantForUser(experimentId);
                setExperimentVariant(variant);
                
                // Track screen view with experiment data
                await analyticsService.trackScreenView('OddsComparison', {
                    experiment_id: experimentId,
                    variant_id: variant?.id || 'none',
                    sport: selectedSport
                });
                
            } catch (error) {
                console.error('Error initializing A/B testing experiment:', error);
            }
        };
        
        initializeExperiment();
    }, [experimentId, selectedSport]);
    
    // Component cleanup
    useEffect(() => {
        // Register main component cleanup
        registerCleanup(componentId, () => {
            // Clear any cached data specific to this component instance
            clearExpiredCache();
            
            // Reset animations
            glowAnimationDK.setValue(0);
            glowAnimationFD.setValue(0);
            
            console.log('OddsComparisonComponent cleanup executed');
        });
        
        // Return cleanup function for component unmount
        return () => {
            unregisterCleanup(componentId);
            unregisterCleanup(`${componentId}_animation`);
            
            // Force cleanup of any resources
            clearExpiredCache();
        };
    }, [componentId, glowAnimationDK, glowAnimationFD]);

    // Start glow animation when odds change
    useEffect(() => {
        if (draftKingsOdds === null || fanDuelOdds === null) return;

        // Determine which odds are better (lower number is better for negative odds)
        const betterOdds = draftKingsOdds < fanDuelOdds ? 'DK' : 'FD';

        // Reset animations
        glowAnimationDK.setValue(0);
        glowAnimationFD.setValue(0);

        // Animation references for cleanup
        let dkAnimation: any = null;
        let fdAnimation: any = null;

        // Create optimized glow animation
        const startOptimizedGlow = (animation: Animated.Value, isBetter: boolean) => {
            // Use optimized animation parameters based on device capabilities
            const duration = isBetter ? 1000 : 800;
            const intensity = isBetter ? 1 : 0.7;
            
            const loopAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(animation, {
                        toValue: intensity,
                        duration: duration,
                        useNativeDriver: true
                    }),
                    Animated.timing(animation, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: true
                    })
                ])
            );
            
            loopAnimation.start();
            return loopAnimation;
        };

        if (betterOdds === 'DK') {
            dkAnimation = startOptimizedGlow(glowAnimationDK, true);
            // Add subtle animation to non-best odds
            fdAnimation = startOptimizedGlow(glowAnimationFD, false);
        } else {
            fdAnimation = startOptimizedGlow(glowAnimationFD, true);
            // Add subtle animation to non-best odds
            dkAnimation = startOptimizedGlow(glowAnimationDK, false);
        }

        // Register cleanup function
        const animationCleanupId = `${componentId}_animation`;
        registerCleanup(animationCleanupId, () => {
            if (dkAnimation) dkAnimation.stop();
            if (fdAnimation) fdAnimation.stop();
        });

        // Return cleanup function
        return () => {
            if (dkAnimation) dkAnimation.stop();
            if (fdAnimation) fdAnimation.stop();
            unregisterCleanup(animationCleanupId);
        };
    }, [draftKingsOdds, fanDuelOdds, glowAnimationDK, glowAnimationFD, componentId]);

    // Define the glowing style for the better odds using optimized animations
    const glowingStyle = (animation: Animated.Value) => {
        // Use the optimized glow style from our animation utilities
        return createOptimizedGlowStyle(animation, '#FFD700');
    };

    // Render loading state
    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
                {t('oddsComparison.loading')}
            </Text>
        </View>
    );

    // Render error state
    const renderErrorState = () => (
        <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF6347" />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
                Error Loading Odds
            </Text>
            <Text style={[styles.errorMessage, { color: colors.text }]}>
                {error}
            </Text>
            <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={fetchOdds}
            >
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );

    // Render no data state
    const renderNoDataState = () => (
        <View style={styles.noDataContainer}>
            <Ionicons name="information-circle" size={48} color="#FFA500" />
            <Text style={[styles.noDataTitle, { color: colors.text }]}>
                {t('oddsComparison.errors.noData')}
            </Text>
            <Text style={[styles.noDataMessage, { color: colors.text }]}>
                {t('oddsComparison.errors.noData')}
            </Text>
            <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={fetchOdds}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('oddsComparison.accessibility.refreshButton')}
                accessibilityHint={t('oddsComparison.accessibility.refreshButtonHint')}
            >
                <Text style={styles.retryButtonText}>{t('oddsComparison.refresh')}</Text>
            </TouchableOpacity>
        </View>
    );

    // Handle purchase of odds
    const handlePurchaseOdds = async () => {
        try {
            // Get current user ID
            const currentUserId = userId || auth.currentUser?.uid;
            
            if (!currentUserId) {
                Alert.alert(
                    "Sign In Required",
                    "Please sign in to purchase odds access.",
                    [
                        { text: "OK" }
                    ]
                );
                return;
            }
            
            // Get pricing from microtransaction service
            const price = microtransactionService.getPricing(MICROTRANSACTION_TYPES.ODDS_ACCESS);
            const formattedPrice = `$${(price / 100).toFixed(2)}`;
            
            // Create opportunity data
            const opportunityData = {
                type: MICROTRANSACTION_TYPES.ODDS_ACCESS,
                price,
                title: 'Odds Access',
                description: 'Unlock betting odds for this game',
                buttonText: 'Get Odds',
                priority: 1,
                cookieEnabled: true,
            };
            
            // Show purchase confirmation
            Alert.alert(
                "Purchase Odds",
                `Would you like to purchase access to these odds for ${formattedPrice}?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                        onPress: () => {
                            // Track cancellation
                            microtransactionService.trackInteraction('cancel', opportunityData, {
                                id: currentUserId,
                                isPremium: isPremium
                            });
                        }
                    },
                    {
                        text: "Purchase",
                        onPress: async () => {
                            // Track purchase start
                            await microtransactionService.trackInteraction('purchase_start', opportunityData, {
                                id: currentUserId,
                                isPremium: isPremium
                            });
                            
                            // In a production app, this would integrate with Stripe or another payment processor
                            // For now, we'll simulate a successful purchase
                            
                            // Simulate loading state
                            setLoading(true);
                            
                            // Simulate API call delay
                            setTimeout(async () => {
                                // Set purchase state
                                setHasPurchasedOdds(true);
                                setLoading(false);
                                
                                // Track successful purchase
                                await microtransactionService.trackInteraction('purchase', opportunityData, {
                                    id: currentUserId,
                                    isPremium: isPremium
                                });
                                
                                // Track conversion with affiliate service
                                if (currentUserId) {
                                    bettingAffiliateService.trackConversion('odds_purchase', price / 100, currentUserId);
                                }
                                
                                // Track analytics event
                                await analyticsService.trackEvent(AnalyticsEventType.CONVERSION_COMPLETED, {
                                    product_id: MICROTRANSACTION_TYPES.ODDS_ACCESS,
                                    price: price / 100,
                                    currency: 'USD',
                                    success: true
                                });
                                
                                // Show success message
                                Alert.alert(
                                    "Purchase Successful",
                                    "You now have access to the odds for this game.",
                                    [{ text: "OK" }]
                                );
                            }, 1500);
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error in handlePurchaseOdds:', error);
            Alert.alert(
                "Purchase Failed",
                "There was an error processing your purchase. Please try again.",
                [{ text: "OK" }]
            );
        }
    };
    // Handle click on sportsbook button
    const handleSportsbookClick = async (sportsbook: 'draftkings' | 'fanduel') => {
        // If this is the user's first click on a sportsbook, offer to set as default
        if (!preferences.defaultSportsbook && sportsbook) {
            // Show confirmation dialog
            Alert.alert(
                'Set Default Sportsbook?',
                `Would you like to set ${sportsbook === 'draftkings' ? 'DraftKings' : 'FanDuel'} as your default sportsbook?`,
                [
                    {
                        text: 'No Thanks',
                        style: 'cancel'
                    },
                    {
                        text: 'Yes, Set as Default',
                        onPress: async () => {
                            // Set default sportsbook
                            await usePersonalization().setDefaultSportsbook(sportsbook);
                            
                            // Track analytics event
                            await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
                                event_name: 'default_sportsbook_set_from_click',
                                sportsbook
                            });
                        }
                    }
                ]
            );
        }
        try {
            // Track button click with affiliate service
            bettingAffiliateService.trackButtonClick(
                'odds_comparison',
                affiliateCode,
                undefined,
                userId || undefined
            );
            
            // Track analytics event
            await analyticsService.trackEvent(AnalyticsEventType.SPORTSBOOK_CLICKED, {
                sportsbook,
                sport: selectedSport,
                experiment_id: experimentId,
                variant_id: experimentVariant?.id || 'none',
                has_purchased_odds: hasPurchasedOdds
            });
            
            // Track A/B testing interaction
            if (experimentVariant) {
                await abTestingService.trackInteraction(experimentId, {
                    interaction_type: 'sportsbook_click',
                    sportsbook,
                    has_purchased_odds: hasPurchasedOdds
                });
            }
            
            // Generate the appropriate URL
            let baseUrl = sportsbook === 'draftkings'
                ? 'https://www.draftkings.com/sportsbook'
                : 'https://sportsbook.fanduel.com';
                
            // If user has purchased odds, open the sportsbook directly
            if (hasPurchasedOdds) {
                // Show loading indicator
                setLoading(true);
                
                try {
                    // Generate affiliate link
                    const affiliateUrl = await bettingAffiliateService.generateAffiliateLink(
                        baseUrl,
                        affiliateCode,
                        undefined,
                        userId || undefined
                    );
                    
                    // Track conversion with affiliate service
                    if (userId) {
                        bettingAffiliateService.trackConversion('odds_to_bet', 0, userId);
                    }
                    
                    // Track A/B testing conversion
                    if (experimentVariant) {
                        await abTestingService.trackConversion(experimentId, 1, {
                            conversion_type: 'sportsbook_click',
                            sportsbook,
                            sport: selectedSport
                        });
                    }
                    
                    // Start conversion funnel
                    await analyticsService.startFunnel(
                        `bet_placement_${Date.now()}`,
                        ConversionFunnelStep.SPORTSBOOK_CLICK,
                        {
                            sportsbook,
                            sport: selectedSport,
                            experiment_id: experimentId,
                            variant_id: experimentVariant?.id || 'none'
                        }
                    );
                    
                    // Hide loading indicator
                    setLoading(false);
                    
                    // Check if URL can be opened
                    const canOpen = await Linking.canOpenURL(affiliateUrl);
                    
                    if (canOpen) {
                        await Linking.openURL(affiliateUrl);
                    } else {
                        throw new Error(`Cannot open URL: ${affiliateUrl}`);
                    }
                } catch (linkError) {
                    console.error('Error generating or opening affiliate link:', linkError);
                    setLoading(false);
                    
                    // Fallback to direct URL if affiliate link fails
                    try {
                        await Linking.openURL(baseUrl);
                    } catch (fallbackError) {
                        console.error('Error opening fallback URL:', fallbackError);
                        Alert.alert(
                            "Cannot Open Sportsbook",
                            "Unable to open the sportsbook website. Please check your internet connection and try again.",
                            [{ text: "OK" }]
                        );
                    }
                }
            } else {
                // If not purchased, prompt to purchase
                handlePurchaseOdds();
            }
        } catch (error) {
            console.error('Error in handleSportsbookClick:', error);
            setLoading(false);
            Alert.alert(
                'Error',
                'Could not open sportsbook. Please try again.',
                [{ text: "OK" }]
            );
        }
    };

    return (
        <View style={styles.container}>
            {/* Odds Movement Alerts Modal */}
            <Modal
                visible={showAlertsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAlertsModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
                        <LazyOddsMovementAlerts onClose={() => setShowAlertsModal(false)} />
                    </View>
                </View>
            </Modal>
            
            {/* Personalization Settings Modal */}
            <Modal
                visible={showPersonalizationModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPersonalizationModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
                        <PersonalizationSettings onClose={() => setShowPersonalizationModal(false)} />
                    </View>
                </View>
            </Modal>
            
            {loading && renderLoadingState()}
            {!loading && error && renderErrorState()}
            {!loading && !error && noData && renderNoDataState()}
            {!loading && !error && !noData && (
                <>
                    <View style={styles.headerContainer}>
                        <View style={styles.headerTopRow}>
                            <LazySportSelector
                                selectedSport={selectedSport}
                                onSelectSport={(sportKey: string) => {
                                    setSelectedSport(sportKey);
                                    fetchOdds();
                                }}
                            />
                            
                            <View style={styles.headerButtons}>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => setShowPersonalizationModal(true)}
                                    accessible={true}
                                    accessibilityRole="button"
                                    accessibilityLabel="Personalization settings"
                                    accessibilityHint="Opens personalization options to set default sports and sportsbooks"
                                >
                                    <Ionicons name="settings-outline" size={24} color={colors.primary} />
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => setShowAlertsModal(true)}
                                    accessible={true}
                                    accessibilityRole="button"
                                    accessibilityLabel="Odds movement alerts"
                                    accessibilityHint="Shows recent odds movement alerts"
                                >
                                    <Ionicons name="notifications" size={24} color={colors.primary} />
                                    {unreadAlertsCount > 0 && (
                                        <View style={styles.alertBadge}>
                                            <Text style={styles.alertBadgeText}>
                                                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <View style={styles.lastUpdatedContainer}>
                            <View style={styles.dataSourceContainer}>
                                <Text style={[styles.lastUpdatedText, { color: colors.text }]}>
                                    Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                                </Text>
                                {dataSource !== 'api' && (
                                    <View style={[
                                        styles.dataSourceBadge,
                                        {
                                            backgroundColor:
                                                dataSource === 'cache' ? '#4CAF50' :
                                                dataSource === 'stale' ? '#FFC107' :
                                                dataSource === 'fallback' ? '#FF9800' :
                                                '#F44336'
                                        }
                                    ]}>
                                        <Text style={styles.dataSourceText}>
                                            {dataSource === 'cache' ? 'CACHED' :
                                             dataSource === 'stale' ? 'STALE' :
                                             dataSource === 'fallback' ? 'FALLBACK' :
                                             'ERROR'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.refreshButton}
                                onPress={fetchOdds}
                                disabled={loading}
                            >
                                <Ionicons name="refresh" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.controlsContainer}>
                            <View style={styles.sortContainer}>
                                <Text style={[styles.sortLabel, { color: colors.text }]}>Sort by:</Text>
                                <View style={styles.sortOptions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.sortOption,
                                            sortOption === 'best' && [styles.sortOptionActive, { backgroundColor: colors.primary }]
                                        ]}
                                        onPress={() => setSortOption('best')}
                                        accessible={true}
                                        accessibilityRole="radio"
                                        accessibilityState={{ checked: sortOption === 'best' }}
                                        accessibilityLabel="Sort by best odds"
                                        accessibilityHint="Sorts the odds to show the best value first"
                                        accessibilityActions={[{ name: 'activate' }]}
                                        onAccessibilityAction={({ nativeEvent }) => {
                                            if (nativeEvent.actionName === 'activate') {
                                                setSortOption('best');
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.sortOptionText,
                                            sortOption === 'best' && styles.sortOptionTextActive
                                        ]}>Best Odds</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[
                                            styles.sortOption,
                                            sortOption === 'draftkings' && [styles.sortOptionActive, { backgroundColor: '#1E90FF' }]
                                        ]}
                                        onPress={() => setSortOption('draftkings')}
                                        accessible={true}
                                        accessibilityRole="radio"
                                        accessibilityState={{ checked: sortOption === 'draftkings' }}
                                        accessibilityLabel="Sort by DraftKings odds"
                                        accessibilityHint="Prioritizes DraftKings odds in the display"
                                        accessibilityActions={[{ name: 'activate' }]}
                                        onAccessibilityAction={({ nativeEvent }) => {
                                            if (nativeEvent.actionName === 'activate') {
                                                setSortOption('draftkings');
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.sortOptionText,
                                            sortOption === 'draftkings' && styles.sortOptionTextActive
                                        ]}>DraftKings</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[
                                            styles.sortOption,
                                            sortOption === 'fanduel' && [styles.sortOptionActive, { backgroundColor: '#FF6347' }]
                                        ]}
                                        onPress={() => setSortOption('fanduel')}
                                        accessible={true}
                                        accessibilityRole="radio"
                                        accessibilityState={{ checked: sortOption === 'fanduel' }}
                                        accessibilityLabel="Sort by FanDuel odds"
                                        accessibilityHint="Prioritizes FanDuel odds in the display"
                                        accessibilityActions={[{ name: 'activate' }]}
                                        onAccessibilityAction={({ nativeEvent }) => {
                                            if (nativeEvent.actionName === 'activate') {
                                                setSortOption('fanduel');
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.sortOptionText,
                                            sortOption === 'fanduel' && styles.sortOptionTextActive
                                        ]}>FanDuel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                                onPress={() => setShowFilters(!showFilters)}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityState={{ expanded: showFilters }}
                                accessibilityLabel="Filter options"
                                accessibilityHint={showFilters ? "Hide filter options" : "Show filter options"}
                                accessibilityActions={[{ name: 'activate' }]}
                                onAccessibilityAction={({ nativeEvent }) => {
                                    if (nativeEvent.actionName === 'activate') {
                                        setShowFilters(!showFilters);
                                    }
                                }}
                            >
                                <Ionicons
                                    name={showFilters ? "options" : "options-outline"}
                                    size={20}
                                    color={showFilters ? "#fff" : colors.text}
                                />
                                <Text style={[
                                    styles.filterButtonText,
                                    showFilters && styles.filterButtonTextActive
                                ]}>Filter</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {showFilters && (
                            <View style={styles.filtersContainer}>
                                <View style={styles.filterRow}>
                                    <Text style={[styles.filterLabel, { color: colors.text }]}>Sportsbooks:</Text>
                                    <View style={styles.checkboxContainer}>
                                        <TouchableOpacity
                                            style={styles.checkbox}
                                            onPress={() => setFilterOptions({
                                                ...filterOptions,
                                                showDraftKings: !filterOptions.showDraftKings
                                            })}
                                            accessible={true}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: filterOptions.showDraftKings }}
                                            accessibilityLabel="Show DraftKings odds"
                                            accessibilityHint={filterOptions.showDraftKings ? "Hide DraftKings odds" : "Show DraftKings odds"}
                                            accessibilityActions={[{ name: 'activate' }]}
                                            onAccessibilityAction={({ nativeEvent }) => {
                                                if (nativeEvent.actionName === 'activate') {
                                                    setFilterOptions({
                                                        ...filterOptions,
                                                        showDraftKings: !filterOptions.showDraftKings
                                                    });
                                                }
                                            }}
                                        >
                                            <View style={[
                                                styles.checkboxBox,
                                                filterOptions.showDraftKings && { backgroundColor: '#1E90FF' }
                                            ]}>
                                                {filterOptions.showDraftKings && (
                                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                                )}
                                            </View>
                                            <Text style={[styles.checkboxLabel, { color: colors.text }]}>DraftKings</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity
                                            style={styles.checkbox}
                                            onPress={() => setFilterOptions({
                                                ...filterOptions,
                                                showFanDuel: !filterOptions.showFanDuel
                                            })}
                                            accessible={true}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: filterOptions.showFanDuel }}
                                            accessibilityLabel="Show FanDuel odds"
                                            accessibilityHint={filterOptions.showFanDuel ? "Hide FanDuel odds" : "Show FanDuel odds"}
                                            accessibilityActions={[{ name: 'activate' }]}
                                            onAccessibilityAction={({ nativeEvent }) => {
                                                if (nativeEvent.actionName === 'activate') {
                                                    setFilterOptions({
                                                        ...filterOptions,
                                                        showFanDuel: !filterOptions.showFanDuel
                                                    });
                                                }
                                            }}
                                        >
                                            <View style={[
                                                styles.checkboxBox,
                                                filterOptions.showFanDuel && { backgroundColor: '#FF6347' }
                                            ]}>
                                                {filterOptions.showFanDuel && (
                                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                                )}
                                            </View>
                                            <Text style={[styles.checkboxLabel, { color: colors.text }]}>FanDuel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.oddsComparisonContainer}>
                        {/* Render sportsbooks based on filter options and sort order */}
                        {(() => {
                            // Create array of sportsbooks to display
                            const sportsbooks = [];
                            
                            if (filterOptions.showDraftKings) {
                                sportsbooks.push({
                                    key: 'draftkings',
                                    name: 'DraftKings',
                                    odds: draftKingsOdds,
                                    color: '#1E90FF',
                                    animation: glowAnimationDK
                                });
                            }
                            
                            if (filterOptions.showFanDuel) {
                                sportsbooks.push({
                                    key: 'fanduel',
                                    name: 'FanDuel',
                                    odds: fanDuelOdds,
                                    color: '#FF6347',
                                    animation: glowAnimationFD
                                });
                            }
                            
                            // Sort sportsbooks based on sort option
                            if (sortOption === 'best' && draftKingsOdds !== null && fanDuelOdds !== null) {
                                sportsbooks.sort((a, b) => {
                                    if (a.odds === null) return 1;
                                    if (b.odds === null) return -1;
                                    return a.odds - b.odds;
                                });
                            } else if (sortOption === 'draftkings') {
                                sportsbooks.sort((a, b) => a.key === 'draftkings' ? -1 : 1);
                            } else if (sortOption === 'fanduel') {
                                sportsbooks.sort((a, b) => a.key === 'fanduel' ? -1 : 1);
                            }
                            
                            // Render sportsbooks
                            return sportsbooks.map(sportsbook => (
                                <ResponsiveBookmakerCard
                                    key={sportsbook.key}
                                    bookmaker={sportsbook.key}
                                    displayName={sportsbook.name}
                                    odds={sportsbook.odds}
                                    color={sportsbook.color}
                                    animation={sportsbook.animation}
                                    onPress={() => handleSportsbookClick(sportsbook.key as 'draftkings' | 'fanduel')}
                                    isPremium={hasPurchasedOdds}
                                    showParlay={hasPurchasedOdds && selectedGame !== null}
                                    parlayComponent={
                                        hasPurchasedOdds && selectedGame && (
                                            <LazyParlayIntegration
                                                sportKey={selectedSport}
                                                gameId={selectedGame.id}
                                                homeTeam={selectedGame.home_team}
                                                awayTeam={selectedGame.away_team}
                                                bookmaker={sportsbook.key}
                                                odds={sportsbook.odds || 0}
                                                selection={selectedGame.home_team}
                                            />
                                        )
                                    }
                                />
                            ));
                        })()}
                    </View>
                    
                    {hasPurchasedOdds && (
                        <Text style={[styles.betterOddsText, { color: colors.text }]}>
                            {(() => {
                                // Only show comparison if both sportsbooks are visible
                                if (filterOptions.showDraftKings && filterOptions.showFanDuel &&
                                    draftKingsOdds !== null && fanDuelOdds !== null) {
                                    return draftKingsOdds < fanDuelOdds ?
                                        '👆 DraftKings currently has better odds' :
                                        '👆 FanDuel currently has better odds';
                                } else if (filterOptions.showDraftKings && !filterOptions.showFanDuel) {
                                    return 'Showing DraftKings odds only';
                                } else if (!filterOptions.showDraftKings && filterOptions.showFanDuel) {
                                    return 'Showing FanDuel odds only';
                                } else if (!filterOptions.showDraftKings && !filterOptions.showFanDuel) {
                                    return 'No sportsbooks selected';
                                } else {
                                    return 'Comparing odds...';
                                }
                            })()}
                        </Text>
                    )}
                    
                    <Text style={[styles.disclaimerText, { color: colors.text }]}>
                        {hasPurchasedOdds ?
                            'Odds update in real-time. Bet responsibly.' :
                            'Purchase access to see real-time odds comparison.'
                        }
                    </Text>
                </>
            )}
        </View>
    );
});

// Get screen width for responsive sizing
const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375; // iPhone SE or similar small device

// Get theme context
import { useTheme as useThemeHook } from '../contexts/ThemeContext';
const { isDark } = useThemeHook();

const styles = StyleSheet.create({
    container: {
        padding: Platform.OS === 'ios' ? 16 : 12,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    // Header and controls
    headerContainer: {
        marginBottom: 16,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        flexWrap: 'wrap',
    },
    sortContainer: {
        flex: 1,
        marginRight: 8,
    },
    sortLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    sortOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    sortOption: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        marginRight: 4,
        marginBottom: 4,
        backgroundColor: isDark ? '#333333' : '#f0f0f0',
    },
    sortOptionActive: {
        backgroundColor: '#007BFF',
    },
    sortOptionText: {
        fontSize: 12,
        color: isDark ? '#e0e0e0' : '#333',
    },
    sortOptionTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: isDark ? '#333333' : '#f0f0f0',
    },
    filterButtonActive: {
        backgroundColor: '#007BFF',
    },
    filterButtonText: {
        fontSize: 12,
        color: isDark ? '#e0e0e0' : '#333',
        marginLeft: 4,
    },
    filterButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    filtersContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
        borderRadius: 8,
    },
    filterRow: {
        marginBottom: 8,
    },
    filterLabel: {
        fontSize: 12,
        marginBottom: 4,
        color: isDark ? '#e0e0e0' : '#333',
    },
    checkboxContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 4,
    },
    checkboxBox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: isDark ? '#555' : '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
        backgroundColor: isDark ? '#333' : '#fff',
    },
    checkboxLabel: {
        fontSize: 12,
        color: isDark ? '#e0e0e0' : '#333',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingText: {
        marginTop: 8,
        fontSize: Platform.OS === 'ios' ? 16 : 14,
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    errorTitle: {
        fontSize: Platform.OS === 'ios' ? 18 : 16,
        fontWeight: 'bold',
        marginTop: 8,
    },
    errorMessage: {
        fontSize: Platform.OS === 'ios' ? 14 : 13,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 12,
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    noDataTitle: {
        fontSize: Platform.OS === 'ios' ? 18 : 16,
        fontWeight: 'bold',
        marginTop: 8,
    },
    noDataMessage: {
        fontSize: Platform.OS === 'ios' ? 14 : 13,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 12,
    },
    retryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: Platform.OS === 'ios' ? 14 : 13,
    },
    lastUpdatedContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dataSourceContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    dataSourceBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    dataSourceText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    lastUpdatedText: {
        fontSize: 11,
        fontStyle: 'italic',
    },
    refreshButton: {
        padding: 4,
    },
    oddsComparisonContainer: {
        flexDirection: isSmallScreen ? 'column' : 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 16,
    },
    bookmakerButton: {
        padding: isSmallScreen ? 16 : 20,
        borderRadius: 10,
        margin: isSmallScreen ? 4 : 5,
        width: isSmallScreen ? '90%' : 140,
        alignItems: 'center',
        marginBottom: isSmallScreen ? 10 : 0,
    },
    bookmakerName: {
        color: 'white',
        fontSize: isSmallScreen ? 16 : 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    oddsValue: {
        color: 'white',
        fontSize: isSmallScreen ? 20 : 22,
        fontWeight: 'bold',
    },
    betterOddsText: {
        textAlign: 'center',
        fontSize: Platform.OS === 'ios' ? 16 : 14,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    disclaimerText: {
        textAlign: 'center',
        fontSize: 11,
        fontStyle: 'italic',
        opacity: 0.7,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        height: '80%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    // Header styles
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
        marginLeft: 8,
        position: 'relative',
    },
    alertBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF6347',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    }
});

export default OddsComparisonComponent;