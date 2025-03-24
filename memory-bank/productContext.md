# Product Context

## Security Features

### Web Application Security (COMPLETED)
- Content Security Policy (CSP) implementation
  - Restricts the sources from which various resource types can be loaded
  - Mitigates XSS attacks by controlling which scripts can execute
  - Prevents data exfiltration by limiting connection destinations
- Subresource Integrity (SRI) for external resources
  - Ensures the integrity of third-party resources
  - Prevents attackers from injecting malicious content via compromised CDNs
- CSRF protection for API requests
  - Prevents Cross-Site Request Forgery attacks
  - Ensures that only requests from the legitimate application are processed
- Enhanced XSS protection
  - Comprehensive sanitization of user inputs and API responses
  - Multiple layers of protection against various XSS attack vectors
- Environment variable security
  - Secure management of sensitive configuration
  - Prevents exposure of API keys and other sensitive information
- HTTP Strict Transport Security (HSTS)
  - Forces all connections to use HTTPS
  - Protects against protocol downgrade attacks
- Additional security headers
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY/SAMEORIGIN
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: restricts browser features

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

## Spanish Language Testing (COMPLETED)
### Current Features
- Comprehensive Spanish translations for all app features:
  - Login and authentication
  - Personalization settings
  - Enhanced Analytics Dashboard
  - Betting Slip Import
  - Fraud Detection
  - Player Statistics
- Automated testing framework:
  - Unit tests for Spanish language functionality
  - Test script for running Spanish tests
  - Test summary generation
  - Documentation for Spanish testing
- Language switching functionality
- Proper handling of text length differences
- Cultural adaptations for Spanish-speaking users

## Betting Slip Import (COMPLETED)
### Current Features
- Import betting slips from popular sportsbooks:
  - DraftKings
  - FanDuel
  - BetMGM
  - Caesars
  - And more
- Multiple import methods:
  - Screenshot
  - Copy & Paste
  - Manual entry
- AI-powered suggestions:
  - Better odds at other sportsbooks
  - Hedging opportunities
  - Value bet identification
  - Risk assessment
- Premium subscription integration
- User-friendly interface
- Spanish language support

## Enhanced Analytics Dashboard (COMPLETED)
### Current Features
- Comprehensive admin dashboard
- User engagement metrics:
  - Active users (daily, weekly, monthly)
  - Retention and churn rates
  - Session duration and frequency
- Betting metrics:
  - Popular bets
  - Bet types distribution
  - Sports distribution
  - AI prediction accuracy
- Revenue metrics:
  - Subscription revenue
  - Microtransaction revenue
  - ARPU and ARPPU
  - Conversion rates
- Interactive charts and visualizations
- Advanced time period filtering:
  - Today, Yesterday
  - Last 7/30/90 Days
  - This Month, Last Month
  - Last 3 Months, Last 6 Months
  - Year to Date, Last Year
  - Custom Date Range
- Real API integration with caching
- Performance optimizations:
  - In-memory cache
  - AsyncStorage persistence
  - Cache invalidation with TTL
- Spanish language support
- Accessibility features

## Enhanced Player Statistics (COMPLETED)
### Current Features
- Basic player statistics
- Advanced player metrics (microtransaction)
- Player comparison tool (microtransaction)
- Historical trends (microtransaction)
- Weather-adjusted odds and predictions
- Historical trends visualization with chart controls
- View counter for free users with ViewLimitIndicator
- Spanish translations for player statistics screens

## Automated Fraud Detection (COMPLETED)
### Current Features
- Comprehensive fraud detection service
- Real-time monitoring of suspicious activities
- Multiple fraud pattern detection types:
  - Unusual betting patterns
  - Multiple account usage
  - Rapid account switching
  - Suspicious locations
  - Odds manipulation attempts
  - Automated betting
  - Payment anomalies
  - Account takeover attempts
- Admin dashboard with:
  - Real-time alerts
  - Statistical analysis
  - User risk scoring
  - Account action management
- Integration with analytics and notification systems

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

## Payment Processing (COMPLETED)

### Production API Keys
- Script for switching from test to production payment API keys
- Backup and restore functionality for configuration files
- Verification steps to ensure proper configuration
- Support for multiple payment providers (Stripe, PayPal)
- Comprehensive documentation for the process

### Payment Webhooks
- Script for configuring production webhooks for payment events
- Support for both Stripe and PayPal webhooks
- Secure storage of webhook secrets
- Event-specific configuration for different payment events
- Manual and automated configuration options

### Refund Process
- Comprehensive refund policies and procedures
- Technical implementation for processing refunds
- Support for different refund scenarios:
  - Full refunds
  - Partial refunds
  - Subscription refunds
  - Batch refunds
- Error handling and validation
- Testing framework for refund procedures

## Deployment Preparation (IN PROGRESS)

### Mock Data Removal (COMPLETED)
- Removed all simulated data and mock APIs
- Replaced simulated API call in FanDuelService with real API implementation
- Removed mock data from prediction.controller.js
- Added TODO comments to mark sample data functions for removal in production
- Verified real data fetching functions are in place

### Required Configuration
- API keys for external services:
  - The Odds API
  - ESPN API
  - FanDuel API
  - Other sportsbook APIs
- Database connection strings:
  - MongoDB for game data
  - Firebase for user data
- Environment variables:
  - NODE_ENV=production
  - API keys and secrets
  - Database credentials
  - Feature flags

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
- Onboarding and feature tour translations in both languages

### Language Detection and Selection
- URL-based language selection for web
- Device language detection for iOS
- Language change listener for iOS
- Language selector component
- Language-specific routing for onboarding and feature tour

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
- Language-specific meta descriptions and titles
- Canonical links for language variants

## Multilingual Onboarding Experience (COMPLETED)

### Onboarding Flow
- Multilingual welcome screens with engaging content
- Step-by-step introduction to app features
- Personalized onboarding based on user preferences
- Progress tracking with visual indicators
- Skip and navigation options for flexibility
- Enhanced accessibility with ARIA attributes and keyboard navigation
- Unified analytics tracking across platforms

### Feature Tour
- Interactive tour of key app features
- Multilingual descriptions and instructions
- Visual demonstrations of feature usage
- Contextual hints and tips for better understanding
- Analytics tracking for tour completion and engagement
- Comprehensive error handling with fallbacks

### Technical Implementation
- Secure storage of onboarding state with validation
- Robust error handling with fallback mechanisms
- Accessibility features for all users
- Performance optimizations with caching
- Cross-platform compatibility for web and mobile
- Development mode bypass configuration for testing
- Unified analytics service for consistent tracking

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

### Homepage Enhancements
- Enhanced hero section with animated elements and gradient text
- Improved features section with hover effects and animated icons
- Enhanced "How It Works" section with connected steps and visual cues
- Compelling CTA section with testimonials and floating particles
- Improved footer section with newsletter signup and organized navigation
- Responsive design for all screen sizes
- Consistent design language across all sections

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

## Machine Learning Model (COMPLETED)

### TensorFlow.js Integration
- Integration with TensorFlow.js for sports predictions
- Model loading and caching for different sports
- Fallback to default models when cloud models unavailable
- Model versioning and metadata tracking

### Sports-Specific Prediction Logic
- Feature generators for different sports:
  - Basketball, Football, Baseball
  - Hockey, Soccer, MMA
  - Formula 1, Horse Racing
- Sport-specific reasoning generation
- Proper input shapes for each sport's model
- Multi-language support (English and Spanish)

### Feedback Loop System
- Prediction storage in Firestore
- Feedback collection mechanism
- Historical accuracy tracking
- Automatic model retraining triggers
- Performance monitoring and optimization

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