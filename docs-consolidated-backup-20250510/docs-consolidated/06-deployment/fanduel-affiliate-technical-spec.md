# FanDuel Affiliate Integration Technical Specification

## Component Specifications

### 1. BettingAffiliateContext

```typescript
// BettingAffiliateContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bettingAffiliateService } from '../services/bettingAffiliateService';

// Define context types
export interface BettingAffiliateContextType {
  affiliateCode: string;
  isEnabled: boolean;
  buttonSettings: ButtonSettings;
  showBetButton: (contentType: string, teamId?: string) => boolean;
  trackButtonClick: (location: string, teamId?: string) => void;
  updateAffiliateCode: (code: string) => Promise<void>;
}

export interface ButtonSettings {
  size: 'small' | 'medium' | 'large';
  animation: 'none' | 'pulse' | 'flicker' | 'surge';
  position: 'inline' | 'floating' | 'fixed';
  style: 'default' | 'team-colored';
}

// Create context with default values
const BettingAffiliateContext = createContext<BettingAffiliateContextType>({
  affiliateCode: '',
  isEnabled: true,
  buttonSettings: {
    size: 'medium',
    animation: 'pulse',
    position: 'inline',
    style: 'default'
  },
  showBetButton: () => false,
  trackButtonClick: () => {},
  updateAffiliateCode: async () => {}
});

// Provider component
export const BettingAffiliateProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // State
  const [affiliateCode, setAffiliateCode] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [buttonSettings, setButtonSettings] = useState<ButtonSettings>({
    size: 'medium',
    animation: 'pulse',
    position: 'inline',
    style: 'default'
  });

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedCode = await AsyncStorage.getItem('betting_affiliate_code');
        if (savedCode) {
          setAffiliateCode(savedCode);
        }
        
        const savedEnabled = await AsyncStorage.getItem('betting_affiliate_enabled');
        if (savedEnabled !== null) {
          setIsEnabled(savedEnabled === 'true');
        }
        
        const savedSettings = await AsyncStorage.getItem('betting_affiliate_button_settings');
        if (savedSettings) {
          setButtonSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading betting affiliate settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Determine if bet button should be shown
  const showBetButton = (contentType: string, teamId?: string): boolean => {
    if (!isEnabled) return false;
    
    // Logic to determine if button should be shown based on content type and team
    return bettingAffiliateService.shouldShowBetButton(contentType, teamId);
  };

  // Track button clicks
  const trackButtonClick = (location: string, teamId?: string): void => {
    bettingAffiliateService.trackButtonClick(location, affiliateCode, teamId);
  };

  // Update affiliate code
  const updateAffiliateCode = async (code: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('betting_affiliate_code', code);
      setAffiliateCode(code);
    } catch (error) {
      console.error('Error saving affiliate code:', error);
    }
  };

  // Context value
  const contextValue: BettingAffiliateContextType = {
    affiliateCode,
    isEnabled,
    buttonSettings,
    showBetButton,
    trackButtonClick,
    updateAffiliateCode
  };

  return (
    <BettingAffiliateContext.Provider value={contextValue}>
      {children}
    </BettingAffiliateContext.Provider>
  );
};

// Custom hook to use the context
export const useBettingAffiliate = () => useContext(BettingAffiliateContext);

export default BettingAffiliateContext;
```

### 2. BettingAffiliateService

```typescript
// bettingAffiliateService.ts
import { analyticsService } from './analyticsService';
import { personalizationService } from './personalizationService';

class BettingAffiliateService {
  // Generate affiliate link with proper parameters
  generateAffiliateLink(baseUrl: string, affiliateCode: string, teamId?: string): string {
    let url = `${baseUrl}?affiliate=${encodeURIComponent(affiliateCode)}`;
    
    if (teamId) {
      url += `&team=${encodeURIComponent(teamId)}`;
    }
    
    // Add tracking parameters
    url += `&utm_source=aisportsedge&utm_medium=affiliate&utm_campaign=betbutton`;
    
    return url;
  }
  
  // Track button click for analytics
  trackButtonClick(location: string, affiliateCode: string, teamId?: string): void {
    analyticsService.trackEvent('bet_button_click', {
      location,
      affiliateCode,
      teamId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Determine if bet button should be shown
  shouldShowBetButton(contentType: string, teamId?: string): boolean {
    // Get user preferences
    const preferences = personalizationService.getPreferences();
    
    // Always show on odds pages
    if (contentType === 'odds') return true;
    
    // Show for favorite teams
    if (teamId && preferences.favoriteTeams.includes(teamId)) return true;
    
    // Show based on content type
    switch (contentType) {
      case 'game':
      case 'prediction':
      case 'stats':
        return true;
      case 'faq':
        return false; // Don't show on FAQ pages
      default:
        return false;
    }
  }
  
  // Get button settings based on user preferences and subscription
  getButtonSettings(userProfile: any): any {
    const isPremium = userProfile?.subscriptionTier === 'pro' || userProfile?.subscriptionTier === 'elite';
    
    return {
      size: 'medium',
      animation: isPremium ? 'surge' : 'pulse',
      position: 'inline',
      style: isPremium ? 'team-colored' : 'default'
    };
  }
}

export const bettingAffiliateService = new BettingAffiliateService();
```

### 3. BetNowButton Component (Web)

```jsx
// BetNowButton.js (Web)
import React, { useState, useEffect, useRef } from 'react';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { teamColorsService } from '../services/teamColorsService';
import './BetNowButton.css';

const BetNowButton = ({
  size = 'medium',
  position = 'inline',
  contentType = 'general',
  teamId,
  className,
  style,
}) => {
  // Get context values
  const { affiliateCode, buttonSettings, trackButtonClick } = useBettingAffiliate();
  const { preferences, userProfile } = usePersonalization();
  
  // State for animation
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFlickering, setIsFlickering] = useState(false);
  const buttonRef = useRef(null);
  
  // Determine if button should use team colors
  const useTeamColors = buttonSettings.style === 'team-colored' && 
                        teamId && 
                        preferences.favoriteTeams.includes(teamId);
  
  // Get team colors if applicable
  const teamColors = useTeamColors ? teamColorsService.getTeamColors(teamId) : null;
  
  // Set up animation intervals
  useEffect(() => {
    if (buttonSettings.animation === 'none') return;
    
    // Pulse animation
    let pulseInterval;
    if (buttonSettings.animation === 'pulse' || buttonSettings.animation === 'surge') {
      pulseInterval = setInterval(() => {
        setIsAnimating(prev => !prev);
      }, 2000);
    }
    
    // Flicker animation (random)
    let flickerInterval;
    if (buttonSettings.animation === 'flicker') {
      flickerInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          setIsFlickering(true);
          setTimeout(() => setIsFlickering(false), 150);
        }
      }, 3000);
    }
    
    // Surge animation (occasional)
    let surgeInterval;
    if (buttonSettings.animation === 'surge') {
      surgeInterval = setInterval(() => {
        if (Math.random() > 0.8) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 500);
        }
      }, 10000);
    }
    
    return () => {
      if (pulseInterval) clearInterval(pulseInterval);
      if (flickerInterval) clearInterval(flickerInterval);
      if (surgeInterval) clearInterval(surgeInterval);
    };
  }, [buttonSettings.animation]);
  
  // Handle button click
  const handleClick = () => {
    // Track the click
    trackButtonClick(position, teamId);
    
    // Generate affiliate URL
    const baseUrl = 'https://fanduel.com/';
    const affiliateUrl = `${baseUrl}?affiliate=${affiliateCode}${teamId ? `&team=${teamId}` : ''}`;
    
    // Open in new tab
    window.open(affiliateUrl, '_blank');
  };
  
  // Determine button styles
  const getButtonStyles = () => {
    // Base styles
    const styles = {
      fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
      padding: size === 'small' ? '8px 16px' : size === 'large' ? '12px 24px' : '10px 20px',
    };
    
    // Add team colors if applicable
    if (useTeamColors && teamColors) {
      styles.backgroundColor = teamColors.primaryColor;
      styles.color = teamColors.secondaryColor;
      styles.boxShadow = `0 0 10px ${teamColors.neonPrimaryColor}`;
      
      if (isAnimating) {
        styles.boxShadow = `0 0 20px ${teamColors.neonPrimaryColor}`;
      }
    } else {
      styles.backgroundColor = '#FF0055';
      styles.color = '#FFFFFF';
      styles.boxShadow = '0 0 10px #FF3300';
      
      if (isAnimating) {
        styles.boxShadow = '0 0 20px #FF3300';
      }
    }
    
    // Add flickering effect
    if (isFlickering) {
      styles.opacity = 0.7;
    }
    
    return styles;
  };
  
  // Determine position class
  const positionClass = `bet-now-button--${position}`;
  
  return (
    <button
      ref={buttonRef}
      className={`bet-now-button ${positionClass} ${className || ''} ${isAnimating ? 'animating' : ''} ${isFlickering ? 'flickering' : ''}`}
      style={{...getButtonStyles(), ...style}}
      onClick={handleClick}
    >
      BET NOW
    </button>
  );
};

export default BetNowButton;
```

### 4. BetNowButton Component (Mobile)

```tsx
// BetNowButton.tsx (Mobile)
import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Linking,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { teamColorsService } from '../services/teamColorsService';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

interface BetNowButtonProps {
  size?: 'small' | 'medium' | 'large';
  position?: 'inline' | 'floating' | 'fixed';
  contentType?: string;
  teamId?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const BetNowButton: React.FC<BetNowButtonProps> = ({
  size = 'medium',
  position = 'inline',
  contentType = 'general',
  teamId,
  style,
  textStyle,
}) => {
  // Get context values
  const { affiliateCode, buttonSettings, trackButtonClick } = useBettingAffiliate();
  const { preferences, userProfile } = usePersonalization();
  
  // Animation values
  const glowAnimation = new Animated.Value(1);
  const opacityAnimation = new Animated.Value(1);
  
  // Determine if button should use team colors
  const useTeamColors = buttonSettings.style === 'team-colored' && 
                        teamId && 
                        preferences.favoriteTeams.includes(teamId);
  
  // Get team colors if applicable
  const teamColors = useTeamColors ? teamColorsService.getTeamColors(teamId) : null;
  
  // Set up animations
  useEffect(() => {
    if (buttonSettings.animation === 'none') return;
    
    // Pulse animation
    let pulseAnimation;
    if (buttonSettings.animation === 'pulse' || buttonSettings.animation === 'surge') {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      pulseAnimation.start();
    }
    
    // Flicker animation
    let flickerTimer;
    if (buttonSettings.animation === 'flicker') {
      flickerTimer = setInterval(() => {
        if (Math.random() > 0.7) {
          Animated.sequence([
            Animated.timing(opacityAnimation, {
              toValue: 0.7,
              duration: 100,
              useNativeDriver: false,
            }),
            Animated.timing(opacityAnimation, {
              toValue: 1,
              duration: 100,
              useNativeDriver: false,
            }),
          ]).start();
        }
      }, 3000);
    }
    
    return () => {
      if (pulseAnimation) pulseAnimation.stop();
      if (flickerTimer) clearInterval(flickerTimer);
    };
  }, [buttonSettings.animation, glowAnimation, opacityAnimation]);
  
  // Handle button press
  const handlePress = () => {
    // Track the click
    trackButtonClick(position, teamId);
    
    // Generate affiliate URL
    const baseUrl = 'https://fanduel.com/';
    const affiliateUrl = `${baseUrl}?affiliate=${affiliateCode}${teamId ? `&team=${teamId}` : ''}`;
    
    // Open URL
    Linking.openURL(affiliateUrl);
  };
  
  // Get gradient colors
  const getGradientColors = (): string[] => {
    if (useTeamColors && teamColors) {
      return [teamColors.primaryColor, teamColors.neonPrimaryColor];
    }
    
    return ['#FF0055', '#FF3300']; // Default attention-grabbing colors
  };
  
  // Get button padding based on size
  const getButtonPadding = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
        };
      case 'large':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
        };
      case 'medium':
      default:
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
        };
    }
  };
  
  // Get text size based on button size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return typography.fontSize.sm;
      case 'large':
        return typography.fontSize.lg;
      case 'medium':
      default:
        return typography.fontSize.md;
    }
  };
  
  // Animated shadow style
  const animatedShadowStyle = {
    shadowOpacity: 0.8,
    shadowRadius: glowAnimation,
    shadowColor: useTeamColors && teamColors ? teamColors.neonPrimaryColor : '#FF3300',
    shadowOffset: { width: 0, height: 0 },
    elevation: glowAnimation,
  };
  
  return (
    <Animated.View style={[
      styles.buttonWrapper,
      getButtonPadding(),
      animatedShadowStyle,
      { opacity: opacityAnimation },
      position === 'floating' && styles.floating,
      position === 'fixed' && styles.fixed,
      style,
    ]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, getButtonPadding()]}
        >
          <Text style={[
            styles.text,
            { fontSize: getTextSize() },
            { color: useTeamColors && teamColors ? teamColors.secondaryColor : '#FFFFFF' },
            textStyle,
          ]}>
            BET NOW
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    margin: spacing.sm,
  },
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  floating: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    zIndex: 100,
  },
  fixed: {
    width: '100%',
  },
});

export default BetNowButton;
```

### 5. Team Colors Service

```typescript
// teamColorsService.ts
import { teamColorsData } from '../config/teamColors';

class TeamColorsService {
  // Get team colors by ID
  getTeamColors(teamId: string): any {
    // Extract league and team from ID (format: "league-team")
    const [league, team] = teamId.split('-');
    
    if (!league || !team) return null;
    
    // Get team colors from database
    const leagueData = teamColorsData[league];
    if (!leagueData) return null;
    
    return leagueData[team] || null;
  }
  
  // Get all teams for a league
  getLeagueTeams(league: string): any[] {
    const leagueData = teamColorsData[league];
    if (!leagueData) return [];
    
    return Object.entries(leagueData).map(([id, team]) => ({
      id: `${league}-${id}`,
      ...team,
    }));
  }
  
  // Get all teams
  getAllTeams(): any[] {
    const teams = [];
    
    Object.entries(teamColorsData).forEach(([league, leagueData]) => {
      Object.entries(leagueData).forEach(([id, team]) => {
        teams.push({
          id: `${league}-${id}`,
          league,
          ...team,
        });
      });
    });
    
    return teams;
  }
  
  // Generate neon variant of a color
  generateNeonVariant(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Brighten the color for neon effect
    const brightenFactor = 0.3;
    const nr = Math.min(255, r + (255 - r) * brightenFactor);
    const ng = Math.min(255, g + (255 - g) * brightenFactor);
    const nb = Math.min(255, b + (255 - b) * brightenFactor);
    
    // Convert back to hex
    return `#${Math.round(nr).toString(16).padStart(2, '0')}${Math.round(ng).toString(16).padStart(2, '0')}${Math.round(nb).toString(16).padStart(2, '0')}`;
  }
}

export const teamColorsService = new TeamColorsService();
```

## Implementation Details

### Web Implementation

1. **Header Integration**

```jsx
// Header.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/header.css';
import PersonalizationPanel from './PersonalizationPanel';
import BetNowButton from './BetNowButton';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const location = useLocation();
  const { showBetButton } = useBettingAffiliate();
  
  // ... existing code ...
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo" onClick={closeMenu}>
            <img src="https://expo.dev/static/images/favicon-76x76.png" alt="AI Sports Edge Logo" />
            <span>AI Sports Edge</span>
          </Link>
          
          <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
          </button>
          
          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/" className={isActive('/')} onClick={closeMenu}>Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/features" className={isActive('/features')} onClick={closeMenu}>Features</Link>
              </li>
              <li className="nav-item">
                <Link to="/pricing" className={isActive('/pricing')} onClick={closeMenu}>Pricing</Link>
              </li>
              <li className="nav-item">
                <Link to="/about" className={isActive('/about')} onClick={closeMenu}>About</Link>
              </li>
              <li className="nav-item">
                <button
                  className="personalize-button"
                  onClick={togglePersonalization}
                  aria-label="Personalize"
                >
                  <i className="fas fa-sliders-h"></i>
                  <span>Personalize</span>
                </button>
              </li>
              <li className="nav-item">
                <Link to="/download" className="download-button" onClick={closeMenu}>Download</Link>
              </li>
              {/* Add Bet Now button to header */}
              {showBetButton('header') && (
                <li className="nav-item">
                  <BetNowButton 
                    size="small" 
                    position="inline" 
                    contentType="header" 
                  />
                </li>
              )}
            </ul>
          </nav>
          
          {personalizationOpen && (
            <PersonalizationPanel onClose={closePersonalization} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
```

2. **Footer Integration**

```jsx
// Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/footer.css';
import BetNowButton from './BetNowButton';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { showBetButton } = useBettingAffiliate();
  
  return (
    <footer className="footer">
      <div className="container">
        {/* Add Bet Now button to footer */}
        {showBetButton('footer') && (
          <div className="footer-bet-button">
            <BetNowButton 
              size="medium" 
              position="fixed" 
              contentType="footer" 
            />
          </div>
        )}
        
        <div className="footer-content">
          {/* Existing footer content */}
          {/* ... */}
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} AI Sports Edge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

### Mobile Implementation

1. **App.tsx Integration**

```tsx
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider } from './contexts/ThemeContext';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { BettingAffiliateProvider } from './contexts/BettingAffiliateContext';
// ... other imports ...

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <PersonalizationProvider>
        <BettingAffiliateProvider>
          <NavigationContainer>
            {/* Navigation structure */}
            {/* ... */}
          </NavigationContainer>
        </BettingAffiliateProvider>
      </PersonalizationProvider>
    </ThemeProvider>
  );
}
```

2. **Tab Bar Integration**

```tsx
// MainTabNavigator.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import OddsScreen from '../screens/OddsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BetNowButton from '../components/BetNowButton';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';
import { colors } from '../styles/theme';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { showBetButton } = useBettingAffiliate();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Odds') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'BetNow') {
            iconName = 'flash';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.neon.blue,
        tabBarInactiveTintColor: colors.text.secondary,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Odds" component={OddsScreen} />
      
      {/* Add Bet Now tab if enabled */}
      {showBetButton('tabbar') && (
        <Tab.Screen 
          name="BetNow" 
          component={EmptyScreen} 
          options={{
            tabBarButton: (props) => (
              <View style={styles.betButtonContainer}>
                <BetNowButton 
                  size="small" 
                  position="fixed" 
                  contentType="tabbar" 
                />
              </View>
            ),
          }}
        />
      )}
      
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Empty screen for the Bet Now tab
const EmptyScreen = () => <View />;

const styles = StyleSheet.create({
  betButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
});

export default MainTabNavigator;
```

### Enhanced PersonalizationPanel

```jsx
// PersonalizationPanel.js (Web)
import React, { useState, useEffect } from 'react';
import '../styles/personalization-panel.css';
import { teamColorsService } from '../services/teamColorsService';

const PersonalizationPanel = ({ onClose }) => {
  // ... existing code ...
  
  // Add favorite teams state
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [primaryTeam, setPrimaryTeam] = useState('');
  const [availableTeams, setAvailableTeams] = useState({});
  
  // Load teams on mount
  useEffect(() => {
    // Group teams by league
    const teams = teamColorsService.getAllTeams();
    const groupedTeams = teams.reduce((acc, team) => {
      if (!acc[team.league]) {
        acc[team.league] = {};
      }
      
      const teamId = team.id.split('-')[1];
      acc[team.league][teamId] = team;
      
      return acc;
    }, {});
    
    setAvailableTeams(groupedTeams);
    
    // Load favorite teams from localStorage
    const savedFavoriteTeams = localStorage.getItem('favoriteTeams');
    if (savedFavoriteTeams) {
      try {
        setFavoriteTeams(JSON.parse(savedFavoriteTeams));
      } catch (error) {
        console.error('Error parsing saved favorite teams:', error);
      }
    }
    
    // Load primary team from localStorage
    const savedPrimaryTeam = localStorage.getItem('primaryTeam');
    if (savedPrimaryTeam) {
      setPrimaryTeam(savedPrimaryTeam);
    }
  }, []);
  
  // Save favorite teams to localStorage when they change
  useEffect(() => {
    localStorage.setItem('favoriteTeams', JSON.stringify(favoriteTeams));
  }, [favoriteTeams]);
  
  // Save primary team to localStorage when it changes
  useEffect(() => {
    if (primaryTeam) {
      localStorage.setItem('primaryTeam', primaryTeam);
    }
  }, [primaryTeam]);
  
  // Handle team selection
  const handleTeamSelection = (teamId) => {
    const newFavoriteTeams = [...favoriteTeams];
    
    if (newFavoriteTeams.includes(teamId)) {
      // Remove team if already selected
      const index = newFavoriteTeams.indexOf(teamId);
      newFavoriteTeams.splice(index, 1);
      
      // If primary team is removed, clear primary team
      if (primaryTeam === teamId) {
        setPrimaryTeam('');
      }
    } else {
      // Add team if not selected
      newFavoriteTeams.push(teamId);
      
      // If no primary team is set, set this as primary
      if (!primaryTeam) {
        setPrimaryTeam(teamId);
      }
    }
    
    setFavoriteTeams(newFavoriteTeams);
  };
  
  // Handle primary team selection
  const handlePrimaryTeamSelection = (teamId) => {
    // Ensure team is in favorite teams
    if (!favoriteTeams.includes(teamId)) {
      setFavoriteTeams([...favoriteTeams, teamId]);
    }
    
    setPrimaryTeam(teamId);
  };
  
  // Render team selector
  const renderTeamSelector = () => {
    return (
      <div className="personalization-section">
        <h3>Favorite Teams</h3>
        
        <div className="preference-item">
          <div className="preference-info">
            <span className="preference-name">Select Your Favorite Teams</span>
            <span className="preference-description">Choose teams to customize your experience</span>
          </div>
        </div>
        
        {Object.entries(availableTeams).map(([league, leagueTeams]) => (
          <div key={league} className="league-section">
            <h4>{league.toUpperCase()}</h4>
            <div className="teams-grid">
              {Object.entries(leagueTeams).map(([teamId, team]) => {
                const fullTeamId = `${league}-${teamId}`;
                const isSelected = favoriteTeams.includes(fullTeamId);
                const isPrimary = primaryTeam === fullTeamId;
                
                return (
                  <div 
                    key={fullTeamId}
                    className={`team-item ${isSelected ? 'selected' : ''} ${isPrimary ? 'primary' : ''}`}
                    onClick={() => handleTeamSelection(fullTeamId)}
                    onDoubleClick={() => handlePrimaryTeamSelection(fullTeamId)}
                    style={{
                      borderColor: isSelected ? team.primaryColor : 'transparent',
                      boxShadow: isSelected ? `0 0 10px ${team.neonPrimaryColor}` : 'none'
                    }}
                  >
                    <div className="team-colors">
                      <div className="color-preview" style={{ backgroundColor: team.primaryColor }}></div>
                      <div className="color-preview" style={{ backgroundColor: team.secondaryColor }}></div>
                    </div>
                    <span className="team-name">{team.name}</span>
                    {isPrimary && <span className="primary-badge">Primary</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        <div className="team-selection-help">
          <p>Click to select/deselect a team. Double-click to set as primary team for theming.</p>
          <p>Premium subscribers can use their primary team's colors throughout the app.</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="personalization-panel">
      <div className="personalization-panel-header">
        <h2>Personalize Your Experience</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="personalization-panel-content">
        {/* Existing sections */}
        {/* ... */}
        
        {/* Add Team Selector */}
        {renderTeamSelector()}
        
        {/* Existing sections */}
        {/* ... */}
      </div>
      
      <div className="personalization-panel-footer">
        <button className="cancel-button" onClick={onClose}>Cancel</button>
        <button className="save-button" onClick={handleSave}>Save Preferences</button>
      </div>
    </div>
  );
};

export default PersonalizationPanel;
```

## CSS Styles

### BetNowButton.css (Web)

```css
.bet-now-button {
  display: inline-block;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.bet-now-button:hover {
  transform: scale(1.05);
}

.bet-now-button:active {
  transform: scale(0.98);
}

.bet-now-button.animating {
  animation: pulse 2s infinite;
}

.bet-now-button.flickering {
  animation: flicker 0.2s;
}

.bet-now-button--inline {
  margin: 0.5rem;
}

.bet-now-button--floating {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.bet-now-button--fixed {
  width: 100%;
  margin: 1rem 0;
  text-align: center;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 10px currentColor;
  }
  50% {
    box-shadow: 0 0 20px currentColor;
  }
  100% {
    box-shadow: 0 0 10px currentColor;
  }
}

@keyframes flicker {
  0% {
    opacity: 1;
  }
  25% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
  75% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
```

## Team Colors Database Structure

The team colors database will be structured as follows:

```typescript
// teamColors.ts
export const teamColorsData = {
  nba: {
    lakers: {
      name: "Los Angeles Lakers",
      primaryColor: "#552583",
      secondaryColor: "#FDB927",
      neonPrimaryColor: "#7747A3",
      neonSecondaryColor: "#FFDB8C"
    },
    warriors: {
      name: "Golden State Warriors",
      primaryColor: "#1D428A",
      secondaryColor: "#FFC72C",
      neonPrimaryColor: "#3D62AA",
      neonSecondaryColor: "#FFD74C"
    },
    // More NBA teams...
  },
  nfl: {
    chiefs: {
      name: "Kansas City Chiefs",
      primaryColor: "#E31837",
      secondaryColor: "#FFB81C",
      neonPrimaryColor: "#FF3857",
      neonSecondaryColor: "#FFD83C"
    },
    // More NFL teams...
  },
  // More leagues...
};
```

## Analytics Implementation

We'll track the following events:

1. Button impressions
2. Button clicks
3. Conversion rates
4. User preferences

```typescript
// Analytics events for betting affiliate buttons
export const ANALYTICS_EVENTS = {
  BUTTON_IMPRESSION: 'bet_button_impression',
  BUTTON_CLICK: 'bet_button_click',
  CONVERSION: 'bet_button_conversion',
  FAVORITE_TEAM_SELECTED: 'favorite_team_selected',
  PRIMARY_TEAM_SELECTED: 'primary_team_selected',
};

// Example analytics implementation
trackButtonImpression(location: string, teamId?: string): void {
  analyticsService.trackEvent(ANALYTICS_EVENTS.BUTTON_IMPRESSION, {
    location,
    teamId,
    timestamp: new Date().toISOString(),
  });
}

trackButtonClick(location: string, affiliateCode: string, teamId?: string): void {
  analyticsService.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
    location,
    affiliateCode,
    teamId,
    timestamp: new Date().toISOString(),
  });
}