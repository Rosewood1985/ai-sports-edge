# AI Sports Edge - Comprehensive Project Map

## Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure Analysis](#directory-structure-analysis)
3. [Architecture Patterns](#architecture-patterns)
4. [File Naming Conventions](#file-naming-conventions)
5. [Key Integration Points](#key-integration-points)
6. [Documentation Locations](#documentation-locations)
7. [Development Guidelines](#development-guidelines)

---

## Project Overview

**AI Sports Edge** is a React Native/Expo application built with a hybrid atomic-modular architecture. The project uses TypeScript/JavaScript and Firebase backend services, with a strong emphasis on accessibility, internationalization, and scalable component design.

### Tech Stack
- **Frontend**: React Native 0.68.2, Expo ^45.0.0, TypeScript ~4.3.5
- **Backend**: Firebase (Auth, Firestore, Functions, Hosting)
- **Payment**: Stripe integration with tax handling
- **Styling**: Material-UI, Emotion, custom theme system
- **Testing**: Jest, React Testing Library, Jest-Axe for accessibility
- **Build**: Webpack, Expo CLI, Babel

---

## Directory Structure Analysis

### 1. Root Level Organization

```
/workspaces/ai-sports-edge-restore/
├── 📱 App.tsx                    # Main application entry point
├── 📄 package.json              # Project dependencies and scripts
├── ⚙️ babel.config.js           # Babel transpilation configuration
├── ⚙️ metro.config.js           # Metro bundler configuration
├── ⚙️ webpack.config.js         # Web build configuration
├── 🔧 firebase.json             # Firebase hosting/functions config
├── 🔧 firestore.rules          # Firestore security rules
├── 🔧 storage.rules             # Firebase storage security rules
└── 📚 [Documentation Files]     # Various .md files for project docs
```

### 2. Core Application Structure

#### 2.1 Traditional React Components (`/components/` - 132 files)
**Purpose**: Legacy component structure being migrated to atomic design
**Pattern**: `ComponentName.tsx` (PascalCase)

Key categories:
- **UI Components**: `ThemedText.tsx`, `ThemedView.tsx`, `LoadingIndicator.tsx`
- **Charts**: `BettingAnalyticsChart.tsx`, `HeatMapChart.tsx`, `BubbleChart.tsx`
- **Cards**: `GameCard.tsx`, `ParlayCard.tsx`, `AIPickCard.tsx`
- **Forms**: `PersonalizationSettings.tsx`, `QuestionSubmissionForm.tsx`
- **Navigation**: `Header.tsx`, `TabTransition.tsx`, `PageTransition.tsx`
- **Accessibility**: `AccessibleText.tsx`, `AccessibleTouchable.tsx`, `AccessibleView.tsx`

#### 2.2 Atomic Architecture (`/atomic/` - 117 files total)
**Purpose**: Modern component architecture following Brad Frost's atomic design methodology

```
/atomic/
├── atoms/ (47 files)           # Basic building blocks
│   ├── UI Elements: ThemedText, ThemedView, LoadingIndicator, Toast
│   ├── Form Controls: CheckboxWithLabel, Slider, FilterTag
│   ├── Accessibility: AccessibleThemedText, AccessibleThemedView
│   ├── Icons: AlertTypeIcon, IconButton
│   └── Utilities: focusStateUtils, formatUtils, errorUtils
├── molecules/ (40 files)       # Compound components
│   ├── charts/: LineChart, PieChart, BettingAnalyticsChart
│   ├── language/: LanguageSelector
│   ├── responsive/: withResponsiveStyles
│   ├── theme/: ThemeToggle
│   └── privacy/: ConsentManager, DataAccessManager
├── organisms/ (30 files)       # Complex features
│   ├── reporting/: useReportTemplates, useReportHistory
│   ├── widgets/: BettingAnalyticsWidget, EnhancedSubscriptionAnalyticsWidget
│   ├── api/: apiService
│   ├── privacy/: PrivacyService, PrivacySettingsScreen
│   └── stripe/: StripeProvider, stripeService
├── templates/                  # Layout structures
│   └── MainLayout.js
└── pages/                      # Complete page implementations
    ├── HomePage.js, LoginScreen.js, BettingPage.js
    ├── ProfilePage.js, SettingsPage.js
    └── SignupPage.js, ForgotPasswordPage.js
```

#### 2.3 Screen Components (`/screens/` - 84 files)
**Purpose**: Full-screen React Native components
**Pattern**: `ScreenName.tsx` with "Screen" suffix

Key categories:
- **Authentication**: `AuthScreen.tsx`, `LoginScreen.tsx`, `OnboardingScreen.tsx`
- **Sports**: `GamesScreen.tsx`, `UFCScreen.tsx`, `Formula1Screen.tsx`, `NcaaBasketballScreen.tsx`
- **Betting**: `BettingAnalyticsScreen.tsx`, `OddsComparisonScreen.tsx`, `ParlayScreen.tsx`
- **User Management**: `ProfileScreen.tsx`, `SettingsScreen.tsx`, `PersonalizationScreen.tsx`
- **Analytics**: `AnalyticsDashboardScreen.tsx`, `SubscriptionAnalyticsScreen.tsx`

#### 2.4 Service Layer (`/services/` - 115 files)
**Purpose**: Business logic, API integration, and data management
**Pattern**: `serviceName.ts` or `ServiceName.js`

Key categories:
- **Odds Services**: `OddsService.js`, `UfcOddsService.js`, `Formula1OddsService.js`
- **API Services**: `apiService.ts`, `analyticsService.ts`, `notificationService.ts`
- **User Services**: `userPreferencesService.ts`, `onboardingService.ts`
- **Payment Services**: `paymentService.js`, `stripeTaxService.js`
- **Utility Services**: `cacheService.ts`, `geolocationService.ts`, `deepLinkingService.ts`

### 3. Configuration and Setup

#### 3.1 Configuration Files (`/config/` - 16 files)
```
/config/
├── 🔑 apiKeys.ts               # API key management
├── 🔥 firebase.ts              # Firebase configuration
├── 💳 stripe.ts                # Stripe payment configuration
├── 🎨 teamColors.ts            # Sports team color definitions
├── 🔗 affiliateConfig.ts       # Affiliate program configuration
└── 📊 seo.ts                   # SEO optimization settings
```

#### 3.2 Context Providers (`/contexts/` - 6 files)
```
/contexts/
├── 🌐 LanguageContext.tsx      # Internationalization state
├── 🎨 ThemeContext.tsx         # Theme management
├── 👤 PersonalizationContext.tsx # User preferences
├── 🧭 NavigationStateContext.tsx # Navigation state
└── 💰 BettingAffiliateContext.tsx # Affiliate tracking
```

#### 3.3 Custom Hooks (`/hooks/` - 11 files)
```
/hooks/
├── 🔐 useAuth.ts               # Authentication state
├── 🌐 useTranslation.ts        # Language translation
├── 🎨 useThemeColor.ts         # Theme management
├── 📱 useResponsiveStyles.ts   # Responsive design
└── 🔍 useSearch.ts             # Search functionality
```

### 4. Backend and Infrastructure

#### 4.1 Firebase Functions (`/functions/` - 22 files)
```
/functions/
├── 🔐 index.js                 # Main functions entry point
├── 💳 stripePayments.js        # Payment processing
├── 📧 notificationService.js   # Push notifications
├── 👥 referralProgram.js       # Referral system
├── 📊 subscriptionAnalytics.js # Subscription tracking
└── 🔄 autoResubscribe.js       # Automatic renewals
```

#### 4.2 Database Models (`/models/` - 3 files)
```
/models/
├── 👤 Player.js                # Player data model
├── 👥 Team.js                  # Team data model
└── 🏆 League.js                # League data model
```

### 5. Testing and Quality Assurance

#### 5.1 Test Configuration
```
├── 🧪 jest.config.js           # Main Jest configuration
├── 🧪 jest.config.atomic.js    # Atomic component testing
├── 🧪 jest.setup.js            # Test environment setup
├── 🎯 jest-setup-axe.ts        # Accessibility testing setup
└── 📊 /coverage/               # Test coverage reports
```

#### 5.2 Mocks and Test Utilities (`/__mocks__/`, `/__tests__/`)
```
/__mocks__/
├── 📁 fileMock.js              # File import mocking
└── 🎨 styleMock.js             # CSS import mocking

/__tests__/
├── 🧪 run-spanish-tests.js     # Spanish localization tests
└── 📄 spanish-testing-summary.md
```

### 6. Build and Deployment

#### 6.1 Build Artifacts
```
/build/                         # Production build output
/deploy/                        # Deployment-ready files
/public/                        # Static web assets
```

#### 6.2 Deployment Scripts (`/scripts/` - 150+ files)
**Purpose**: Automated deployment, testing, and maintenance scripts
**Key Scripts**:
- `deploy-to-firebase.sh` - Firebase deployment
- `deploy-vscode-sftp.sh` - SFTP deployment
- `run-accessibility-tests.js` - Accessibility validation
- `dependency-audit.js` - Security auditing

---

## Architecture Patterns

### 1. Atomic Design Implementation

#### Component Hierarchy
```
Pages (Complete screens)
  ↓
Templates (Layout structures)
  ↓
Organisms (Complex features with business logic)
  ↓
Molecules (Compound UI components)
  ↓
Atoms (Basic UI elements)
```

#### Migration Strategy
- **Legacy**: `/components/` → **Modern**: `/atomic/`
- **Import Pattern**: `import { Component } from '../atomic/atoms'`
- **Compliance**: 100% atomic architecture implementation complete

### 2. Service Layer Patterns

#### Service Organization
```
/services/
├── 📊 Data Services (API calls, caching)
├── 🔐 Auth Services (Firebase Auth, user management)
├── 💳 Payment Services (Stripe integration)
├── 📧 Notification Services (Push notifications, OneSignal)
├── 🎯 Analytics Services (User tracking, performance)
└── 🔧 Utility Services (Helpers, validation)
```

#### Service Naming Convention
- **API Services**: `apiService.ts`, `oddsService.ts`
- **Feature Services**: `userPreferencesService.ts`, `notificationService.ts`
- **Utility Services**: `cacheService.ts`, `errorUtils.ts`

### 3. State Management Approaches

#### Context-Based State
```
/contexts/
├── Global State: LanguageContext, ThemeContext
├── Feature State: PersonalizationContext, BettingAffiliateContext
└── Navigation State: NavigationStateContext
```

#### Hook-Based State
```
/hooks/
├── Data Hooks: useAuth, useOddsData
├── UI Hooks: useThemeColor, useResponsiveStyles
└── Utility Hooks: useTranslation, useSearch
```

### 4. Firebase Integration Points

#### Authentication Flow
```
Firebase Auth → useAuth hook → AuthScreen → Protected Routes
```

#### Data Flow
```
Firestore → Service Layer → React Hooks → UI Components
```

#### Functions Integration
```
Client Events → Firebase Functions → External APIs → Database Updates
```

---

## File Naming Conventions

### 1. Component Files

#### React Components
- **Format**: `ComponentName.tsx` (PascalCase)
- **Examples**: `GameCard.tsx`, `BettingAnalytics.tsx`, `UserProfile.tsx`
- **Atomic**: Follow same pattern within atomic structure

#### Screen Components
- **Format**: `ScreenName.tsx` with "Screen" suffix
- **Examples**: `HomeScreen.tsx`, `LoginScreen.tsx`, `SettingsScreen.tsx`

#### Page Components (Atomic)
- **Format**: `PageName.js` without "Screen" suffix
- **Examples**: `HomePage.js`, `LoginPage.js`, `BettingPage.js`

### 2. Service Files

#### TypeScript Services
- **Format**: `serviceName.ts` (camelCase)
- **Examples**: `userService.ts`, `analyticsService.ts`, `cacheService.ts`

#### JavaScript Services
- **Format**: `ServiceName.js` (PascalCase) or `serviceName.js` (camelCase)
- **Examples**: `OddsService.js`, `paymentService.js`, `UfcOddsService.js`

### 3. Configuration Files

#### TypeScript Config
- **Format**: `configName.ts` (camelCase)
- **Examples**: `apiKeys.ts`, `firebase.ts`, `stripe.ts`

#### JSON Config
- **Format**: `config-name.json` (kebab-case)
- **Examples**: `api-keys.json`, `custom-domains.json`

### 4. Type Definitions

#### Types and Interfaces
- **Location**: Same file as component or dedicated `.types.ts`
- **Format**: `TypeName` (PascalCase)
- **Examples**: `UserProfile`, `BettingData`, `ApiResponse`

### 5. Translation Files

#### Internationalization
```
/atomic/atoms/translations/
├── en.json                     # English translations
├── es.json                     # Spanish translations
├── odds-comparison-en.json     # Feature-specific English
└── odds-comparison-es.json     # Feature-specific Spanish
```

---

## Key Integration Points

### 1. Firebase Configuration

#### Primary Config Files
```
├── 🔥 /firebase.js             # Root Firebase config
├── 🔥 /config/firebase.ts      # TypeScript Firebase config
├── 🔥 /firebase.json           # Firebase CLI configuration
├── 🔧 /firestore.rules         # Firestore security rules
└── 🔧 /storage.rules           # Storage security rules
```

#### Environment-Specific Config
```
├── 📁 /firebase-config/
│   ├── google-services.json    # Android configuration
│   └── GoogleService-Info.plist # iOS configuration
└── 🔑 /config/firebase-production.json # Production settings
```

### 2. API Service Patterns

#### Central API Service
```typescript
// /services/apiService.ts
export class ApiService {
  static async fetchOdds(gameId: string): Promise<OddsData>
  static async getUserPreferences(userId: string): Promise<UserPreferences>
  static async updateSubscription(data: SubscriptionData): Promise<void>
}
```

#### Feature-Specific Services
```typescript
// /services/oddsService.ts
export const fetchNBAOdds = (gameId: string) => ApiService.fetchOdds(gameId)
export const fetchUFCOdds = (fightId: string) => ApiService.fetchFightOdds(fightId)
```

### 3. State Management Files

#### Context Providers
```typescript
// /contexts/LanguageContext.tsx
export const LanguageProvider: React.FC<Props>
export const useLanguage: () => LanguageContextType

// /contexts/ThemeContext.tsx  
export const ThemeProvider: React.FC<Props>
export const useTheme: () => ThemeContextType
```

#### Custom Hooks
```typescript
// /hooks/useAuth.ts
export const useAuth = (): AuthState

// /hooks/useTranslation.ts
export const useTranslation = (): TranslationState
```

### 4. Navigation Structure

#### Navigation Configuration
```typescript
// /navigation/types.ts
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Betting: { gameId?: string };
}

// /navigation/AppNavigator.tsx
export const AppNavigator: React.FC
export const BettingNavigator: React.FC
```

### 5. Translation/i18n Structure

#### Translation System
```
/atomic/atoms/translations/
├── 📄 index.js                 # Translation loader
├── 🇺🇸 en.json                 # English base translations
├── 🇪🇸 es.json                 # Spanish translations
├── 🎯 odds-comparison-en.json  # Feature-specific English
└── 🎯 odds-comparison-es.json  # Feature-specific Spanish
```

#### Usage Pattern
```typescript
import { useTranslation } from '../hooks/useTranslation';

const { t } = useTranslation();
const title = t('screens.home.title');
```

### 6. Testing File Organization

#### Test Configuration
```
├── 🧪 jest.config.js           # Main Jest config
├── 🧪 jest.config.atomic.js    # Atomic component testing
├── 🧪 jest.setup.js            # Global test setup
├── 🎯 jest-setup-axe.ts        # Accessibility testing
└── 📊 /coverage/               # Coverage reports
```

#### Test File Patterns
```
ComponentName.test.tsx          # Component tests
serviceName.test.ts             # Service tests
screenName.test.tsx             # Screen tests
```

---

## Documentation Locations

### 1. Primary Documentation (`/docs/` - 150+ files)

#### Architecture Documentation
```
/docs/
├── 📋 README.md                # Main documentation index
├── 🏗️ ARCHITECTURE.md          # Architecture overview
├── 🧱 ATOMIC_ARCHITECTURE_COMPLETE.md # Atomic design docs
├── 🔐 firebase-integration.md  # Firebase setup guide
└── 🎨 ui-ux-design-principles.md # Design system docs
```

#### Implementation Guides
```
/docs/
├── 🚀 deployment-guide.md      # Deployment instructions
├── 🧪 testing-guide.md         # Testing procedures
├── 🌐 internationalization-and-seo.md # i18n setup
├── 🔒 security-features.md     # Security implementation
└── 🎯 accessibility-features.md # Accessibility guide
```

#### Feature Documentation
```
/docs/
├── 💰 stripe-integration-plan.md # Payment setup
├── 📧 push-notification-implementation.md # Notifications
├── 📊 analytics-dashboard-documentation.md # Analytics
├── 🔗 referral-program-implementation-plan.md # Referrals
└── 🏈 betting-analytics-implementation.md # Betting features
```

### 2. Root-Level Documentation

#### Project Overview
```
├── 📄 README.md                # Project introduction
├── 🏗️ ARCHITECTURE.md          # Architecture overview  
├── 📝 CHANGELOG.md             # Version history
├── 🎨 BRAND_GUIDE.md           # Brand guidelines
├── 🗣️ VOICE_GUIDE.md           # Content voice guide
└── 📋 PROJECT.md               # Project specifications
```

#### Technical Documentation
```
├── 🔧 TECHNICAL_FACT_SHEET_v1.0.md # Technical specifications
├── 🧱 atomic-architecture-plan.md # Atomic design plan
├── 🚀 deployment-instructions.md # Deployment guide
└── 📊 comprehensive-ai-sports-edge-documentation.md # Complete docs
```

### 3. Component-Level Documentation

#### Atomic Component Docs
```
/atomic/
├── 📄 README.md                # Atomic design overview
├── atoms/README.md             # Atoms documentation
├── molecules/README.md         # Molecules documentation
└── organisms/README.md         # Organisms documentation
```

#### Example Documentation
```
/examples/
├── 📄 README.md                # Example usage guide
├── 🧩 ApiCachingExample.tsx    # API caching patterns
├── 📱 ResponsiveCardExample.tsx # Responsive design
└── 🎨 ThemeToggleExample.tsx   # Theme implementation
```

### 4. Implementation Documentation

#### Memory Bank (`/memory-bank/` - 40+ files)
**Purpose**: Development context and implementation history
```
/memory-bank/
├── 🧠 activeContext.md         # Current development context
├── 📝 decisionLog.md           # Technical decisions log
├── 📊 progress.md              # Development progress
├── 🏗️ systemPatterns.md       # System architecture patterns
└── 💼 productContext.md       # Product requirements context
```

### 5. Script Documentation

#### Scripts Documentation
```
/scripts/
├── 📄 README.md                # Scripts overview
├── 🚀 deployment-checklist.sh  # Deployment procedures
├── 🧪 test-accessibility.js    # Accessibility testing
└── 📊 generate-report.js       # Reporting utilities
```

---

## Development Guidelines

### 1. Component Development

#### Creating New Components

1. **Determine Atomic Level**
   ```
   Atom: Basic UI element (Button, Input, Text)
   Molecule: Compound component (SearchBar, Card)
   Organism: Complex feature (Dashboard, Form)
   ```

2. **File Location**
   ```
   /atomic/atoms/ComponentName.tsx
   /atomic/molecules/ComponentName.tsx  
   /atomic/organisms/ComponentName.tsx
   ```

3. **Import Pattern**
   ```typescript
   // Correct atomic imports
   import { LoadingIndicator } from '../atomic/atoms';
   import { BettingChart } from '../atomic/molecules/charts';
   import { useReportTemplates } from '../atomic/organisms/reporting';
   ```

### 2. Service Development

#### Service Creation Guidelines

1. **File Naming**
   ```
   TypeScript: serviceName.ts (camelCase)
   JavaScript: ServiceName.js (PascalCase) or serviceName.js
   ```

2. **Service Structure**
   ```typescript
   // /services/exampleService.ts
   export class ExampleService {
     static async getData(): Promise<DataType> { }
     static async updateData(data: DataType): Promise<void> { }
   }
   ```

3. **Error Handling**
   ```typescript
   import { errorUtils } from '../atomic/atoms/errorUtils';
   
   try {
     const result = await apiCall();
     return result;
   } catch (error) {
     errorUtils.logError('ServiceName', error);
     throw new Error('User-friendly error message');
   }
   ```

### 3. Testing Standards

#### Test File Organization
```
ComponentName.test.tsx          # Component tests
serviceName.test.ts             # Service tests  
integration.test.ts             # Integration tests
accessibility.test.tsx          # Accessibility tests
```

#### Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

test('should not have accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 4. Code Quality Standards

#### TypeScript Standards
- Use strict type checking
- Define interfaces for all data structures
- Use enums for constants
- Implement proper error boundaries

#### Performance Standards
- Use React.memo for heavy components
- Implement proper loading states
- Use lazy loading for large components
- Optimize re-renders with useCallback/useMemo

#### Security Standards
- Validate all inputs
- Use Firebase security rules
- Implement proper authentication checks
- Sanitize user data

### 5. Deployment Workflow

#### Pre-Deployment Checklist
1. Run test suite: `npm test`
2. Run accessibility tests: `npm run test:accessibility`
3. Build verification: `npm run build`
4. Dependency audit: `npm run dependency:audit`

#### Deployment Commands
```bash
# Firebase deployment
npm run deploy

# Atomic architecture deployment  
npm run deploy:atomic

# SFTP deployment (alternative)
./scripts/deploy-vscode-sftp.sh
```

---

## Quick Reference

### Common File Paths
```
📱 Main App: /App.tsx
🏗️ Architecture: /ARCHITECTURE.md
🧱 Atomic Design: /atomic/README.md
🔧 Firebase Config: /config/firebase.ts
🎨 Theme System: /contexts/ThemeContext.tsx
🌐 Translations: /atomic/atoms/translations/
📊 Analytics: /services/analyticsService.ts
🔐 Authentication: /hooks/useAuth.ts
```

### Import Patterns
```typescript
// Atomic components
import { LoadingIndicator, Toast } from '../atomic/atoms';
import { LineChart } from '../atomic/molecules/charts';
import { BettingAnalyticsWidget } from '../atomic/organisms/widgets';

// Services
import { apiService } from '../services/apiService';
import { analyticsService } from '../services/analyticsService';

// Hooks & Context
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
```

### Configuration Files
```typescript
// Firebase: /config/firebase.ts
// API Keys: /config/apiKeys.ts  
// Stripe: /config/stripe.ts
// Colors: /config/teamColors.ts
```

---

*This project map serves as the definitive reference for AI Sports Edge codebase navigation and development standards.*

**Last Updated**: May 25, 2025  
**Version**: 1.0  
**Maintained by**: AI Sports Edge Development Team