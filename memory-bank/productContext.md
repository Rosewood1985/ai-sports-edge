# Product Context

## Subscription Features

### Gift Subscription (COMPLETED)
- Allows users to purchase subscriptions as gifts for others
- Gift codes are generated and can be shared with recipients
- Recipients can redeem gift codes to activate their subscription
- Gift subscriptions have a duration based on the amount paid

### Subscription Bundles (TO BE IMPLEMENTED)
- Bundle multiple premium features at a discounted price
- Create bundle products and prices in Stripe
- Implement bundle subscription creation and management
- Update frontend to display and purchase bundles
- Implement access control for bundle subscribers

### Usage-Based Billing (TO BE IMPLEMENTED)
- Metered billing for specific premium features
- Users pay based on actual usage rather than a fixed fee
- Requires tracking usage and reporting to Stripe
- Needs UI components to display current usage and costs

## Enhanced Player Statistics (PARTIALLY IMPLEMENTED)
### Current Features
- Basic player statistics
- Advanced player metrics (microtransaction)
- Player comparison tool (microtransaction)
- Historical trends (microtransaction)
- Weather-adjusted odds and predictions

### Pending Features
- Historical trends visualization
- View counter for free users

## Weather Integration for Sports Odds (COMPLETED)

### Weather-Adjusted Odds
- Centralized weather adjustment service for all sports
- Sport-specific adjustment algorithms based on weather conditions
- Human-readable descriptions of weather impacts
- Integration with existing odds services

### Sport-Specific Weather Impacts
- MLB: Temperature, wind, and precipitation adjustments
- Soccer: Field condition and wind adjustments
- Formula 1: Track condition adjustments for races
- Horse Racing: Track condition calculations and adjustments
- Indoor Sports (NBA, NHL, UFC): Minimal weather impact handling

### Weather Data Features
- Real-time weather data for game venues
- Historical weather performance correlations
- Weather impact visualization
- Spanish language support for weather features
- View counter for free users

## Geolocation Features (COMPLETED)

### Local Team Odds
- Show odds for teams based on user's location
- Geolocation service integration with GPS and IP fallback
- Caching system for location data with TTL
- Performance optimization for mobile devices
- Error handling with retry mechanisms
- Home screen integration with dedicated card

### Nearby Venues
- Show sports venues near the user's location
- Provide details and directions to venues
- Venue data integration with mock data fallback
- Distance calculation and sorting
- Filtering options for sports, teams, and capacity
- Map integration for directions
- Home screen integration with dedicated card

## Betting Analytics (COMPLETED)

### Current Features
- Basic betting history
- Win/loss tracking
- Advanced data visualization
  - Heat map charts for activity frequency
  - Bubble charts for multi-dimensional data
  - Historical trends charts for performance over time
- Performance optimizations
  - Memoization for expensive calculations
  - Lazy loading for visualization components
  - Error handling with caching
- Accessibility enhancements
  - Keyboard navigation for charts
  - Screen reader support with data summaries
  - ARIA attributes for all components
- Internationalization support
  - Translated chart labels and descriptions
  - Localized number and date formatting
  - Right-to-left language support

### Future Enhancements
- Personalized recommendations based on betting history
- Advanced filtering and segmentation
- Export functionality for reports

## Group Subscriptions (PARTIALLY IMPLEMENTED)

### Current Features
- Basic group creation
- Member management

### Pending Features
- Group management UI
- Invitation system
- Group admin controls
- Billing for group subscriptions

## Accessibility Features (COMPLETED)

### Core Features
- Accessibility service for managing preferences
- Integration with system accessibility settings
- Accessible component wrappers
- Accessibility settings screen
- Comprehensive accessibility audit

### Text and Typography
- Scalable text based on user preferences
- Bold text option for better visibility
- Proper line height and spacing
- Minimum text size of 16px

### Color and Contrast
- High contrast mode
- Color independence (information not conveyed by color alone)
- WCAG AA compliant contrast ratios (4.5:1 for text)
- Inverted colors support

### Motion and Animation
- Reduced motion option
- No auto-playing content
- Pause/stop controls for animations
- No flashing content

### Screen Reader Support
- Meaningful accessibility labels
- Helpful accessibility hints
- Proper semantic roles
- Logical focus order

## Deployment Requirements

### iOS App Store
- App Store screenshots and metadata
- App privacy policy
- App Store Connect listing
- TestFlight configuration
- App Review submission

### Web App
- Firebase hosting configuration
- SSL certificates
- Custom domain settings
- Redirects and routing

### Environment Configuration
- Production API keys
- Environment variables
- Monitoring and logging
- Error tracking

## Internationalization (COMPLETED)

### Translation System
- Translation files for English and Spanish
- Context-based translation keys
- Parameter interpolation support
- Translation management tools
- Complete Spanish translations for payment and subscription screens
- Comprehensive error message translations

### Language Detection and Selection
- URL-based language selection for web
- Device language detection for iOS
- Language change listener for iOS
- Language selector component

### Localized Formatting
- Number formatting based on locale
- Currency formatting based on locale
- Date formatting based on locale
- Right-to-left language support
- Localized subscription plan intervals (month/year)

### SEO Optimization
- Language-specific URLs with proper structure
- Hreflang tags for language alternatives
- Multilingual XML sitemap
- SEO metadata component

## UI/UX Polishing (COMPLETED)

### Animation Components
- Dedicated animation components for consistent transitions
- Accessibility-aware animations that respect reduced motion preferences
- Performance-optimized animations with native driver
- Staggered animations for related elements

### Dashboard Enhancements
- Smooth transitions between tabs
- Animated chart entrances
- Staggered metric card animations
- Consistent animation patterns across the application

### Accessibility Considerations
- Reduced motion support
- Screen reader compatibility
- Focus management
- High contrast support

### Documentation
- Comprehensive documentation of animation components
- Implementation guidelines for developers
- Accessibility considerations
- Performance optimizations

## Performance Optimization (COMPLETED)

### Code Splitting
- Utility for lazy loading components
- Lazy-loaded components for OddsComparisonComponent
- Proper loading states with Suspense
- Centralized lazy component management

### Memory Management
- Utility for efficient memory usage
- Memoization with TTL for expensive operations
- Cleanup for animations and other resources
- Automatic cache cleanup
- Component lifecycle cleanup

### Testing Infrastructure
- Unit tests for components
- Cross-platform testing for iOS and Android
- Offline testing for web app
- Jest configuration for testing
- Test utilities and mocks

## Analytics Integration (COMPLETED)

### Analytics Service
- Centralized service for tracking events
- User property tracking
- Conversion funnel tracking
- Event types and interfaces
- Documentation

### OddsComparisonComponent Integration
- Tracking for odds viewing
- Tracking for sport selection
- Tracking for sportsbook clicks
- Conversion tracking

## A/B Testing Implementation (COMPLETED)

### A/B Testing Service
- Experiment management system
- Variant assignment based on weights
- Results tracking for impressions, interactions, and conversions
- Experiment interfaces and types
- Documentation

### OddsComparisonComponent Integration
- Experiment for odds comparison layout
- Variant assignment
- Tracking for interactions and conversions
- Experiment results analysis

## Personalization Options (COMPLETED)

### Personalization Service
- User preference management
- Default sport and sportsbook selection
- Favorite teams and leagues management
- Notification and display preferences
- Documentation

### Personalization Context
- App-wide access to preferences
- Hooks for accessing preferences
- Preference update methods
- Preference storage and retrieval

### Personalization UI
- Settings UI with tabs for different categories
- Confirmation dialogs for preference changes
- Reset functionality for default preferences
- Integration with OddsComparisonComponent

## Post-Deployment Monitoring

### Analytics
- Conversion tracking
- User journey analytics
- Feature usage tracking
- Monitoring dashboards

### Feedback Collection
- In-app feedback
- Crash reporting
- User satisfaction surveys
- Feedback processing workflow