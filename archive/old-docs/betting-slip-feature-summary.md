# Betting Slip Feature Summary

## Overview

The Betting Slip feature allows users to track their betting performance by manually entering bet slips, using quick entry, or scanning bet slips with their camera (for premium tiers). This feature is designed to help users analyze their betting patterns, identify profitable strategies, and improve their overall betting performance.

## Architecture

The Betting Slip feature follows atomic design principles and is organized into the following components:

### Core Data Layer

- **Types** (`types/betting.ts`): Defines the core data structures for the betting slip feature, including:

  - `BetSlip`: The main data structure for a bet slip
  - `BetLeg`: Individual bets within a bet slip (for parlays)
  - `OCRUpload`: Data structure for camera-captured bet slips
  - `BetAnalytics`: Data structure for betting performance analytics

- **Configuration** (`config/sportsbook.ts`): Contains configuration for the betting slip feature, including:

  - `SPORTSBOOK_CONFIG`: Configuration for supported sportsbooks
  - `TIER_CONFIG`: Feature access based on user subscription tier
  - `BET_TYPE_CONFIG`: Configuration for different bet types

- **Utilities** (`utils/betting.ts`): Provides utility functions for the betting slip feature, including:

  - `OddsConverter`: Class for converting between different odds formats
  - `BetValidator`: Class for validating bet slip data
  - `BetAnalytics`: Class for calculating betting performance metrics
  - `OCRProcessor`: Class for processing OCR data from camera-captured bet slips

- **API Service** (`services/betSlipService.ts`): Handles API communication for the betting slip feature, including:
  - `createBetSlip`: Creates a new bet slip
  - `getBetSlips`: Retrieves bet slips for the current user
  - `processOCR`: Processes OCR data from camera-captured bet slips
  - `getBetAnalytics`: Retrieves betting performance analytics

### Mobile-Specific Components

- **Hooks** (`hooks/useMobile.ts`): Provides custom hooks for mobile-specific functionality, including:

  - `useCamera`: Hook for accessing the device camera
  - `useHaptics`: Hook for providing haptic feedback
  - `useOfflineStorage`: Hook for storing data offline

- **Atoms**:

  - `MobileButton` (`atomic/atoms/mobile/MobileButton.tsx`): Touch-friendly button with haptic feedback
  - `MobileInput` (`atomic/atoms/mobile/MobileInput.tsx`): Touch-friendly input field
  - `MobileCard` (`atomic/atoms/mobile/MobileCard.tsx`): Card component with neon glow effects

- **Organisms**:
  - `MobileCameraCapture` (`atomic/organisms/mobile/MobileCameraCapture.tsx`): Camera interface for scanning bet slips
  - `MobileQuickBet` (`atomic/organisms/mobile/MobileQuickBet.tsx`): Quick bet entry form

### Screen and Navigation

- **Screen** (`screens/BetSlipScreen.tsx`): The main screen for the betting slip feature, including:

  - Tab navigation between different entry methods
  - Manual entry form
  - Quick entry form
  - Camera scan option (for premium tiers)
  - Offline mode indicator
  - Error handling and loading states

- **Navigation** (`navigation/BettingNavigator.tsx`): Handles navigation for the betting slip feature, including:

  - Stack navigator for the betting slip feature
  - Navigation between the main screen and camera capture
  - Screen options and animations

- **App Integration** (`navigation/AppNavigator.tsx`): Integrates the betting slip feature into the main app navigation.

## Key Features

### Multiple Entry Methods

- **Manual Entry**: Users can manually enter bet details, including:

  - Sportsbook selection
  - Sport and league selection
  - Bet type selection
  - Odds and stake entry
  - Parlay support

- **Quick Entry**: Users can quickly enter bets using a simplified form, including:

  - Recent sportsbooks
  - Common bet types
  - Simplified odds entry

- **Camera Scan** (Premium Tiers): Users can scan bet slips using their device camera, including:
  - OCR processing
  - Automatic extraction of bet details
  - Manual correction of OCR errors

### Tier-Based Access

- **Insight Tier**: Basic bet tracking with manual entry
- **Edge Tier**: Additional features like quick entry
- **Pro Tier**: Premium features like camera scanning

### Offline Support

- **Offline Mode**: Users can enter bets offline
- **Automatic Sync**: Bets are automatically synced when the user comes online
- **Pending Bets**: Users can see how many bets are pending sync

### Mobile-Optimized UX

- **Touch-Friendly**: All components are designed for touch interaction
- **Haptic Feedback**: Interactive elements provide tactile feedback
- **Animations**: Scale and glow animations for better user experience
- **Responsive Layout**: Components adapt to different screen sizes

### Backend Features Overview

#### Upload Limits & Special Passes

The backend implements tier-based upload limits with special passes for high-volume betting periods:

```javascript
// Check weekend pass, March Madness pass
if (user.monthlyUploads >= uploadLimit) {
  if (!user.weekendPassActive && !user.marchMadnessPass) {
    return res.status(429).json({
      upgradeRequired: true,
    });
  }
}
```

This allows users to:

- Have a monthly upload limit based on their subscription tier
- Purchase weekend passes for high-volume betting periods
- Get special passes for major sporting events like March Madness

#### Smart OCR Processing

The backend implements intelligent OCR processing that can automatically detect the sportsbook from the uploaded image:

```javascript
// Auto-detects sportsbook from image
const detectedSportsbook = detectSportsbook(extractedText);
const parsedData = parseWithSportsbookPatterns(text, detectedSportsbook);
```

This allows for:

- Automatic sportsbook detection from bet slip images
- Sportsbook-specific parsing patterns for more accurate data extraction
- Reduced manual entry for users

#### Real-time Analytics

The backend automatically recalculates analytics after each bet is added:

```javascript
// Automatically recalculates after each bet
await calculateAnalytics(userId);
// Updates: ROI, win rate, streaks, sport breakdowns
```

This provides users with:

- Up-to-date ROI calculations
- Current win rate statistics
- Streak tracking (winning and losing)
- Sport-by-sport performance breakdowns

#### Production Error Handling

The backend implements comprehensive error handling for production use:

```javascript
// Comprehensive error responses
if (!betSlip) {
  return res.status(404).json({
    success: false,
    error: 'Bet slip not found',
  });
}
```

This ensures:

- Clear error messages for users
- Proper HTTP status codes
- Structured error responses for the frontend
- Improved debugging and error tracking

## Backend Implementation

The backend implementation of the Betting Slip feature is built with a robust architecture that supports the frontend functionality while providing scalability, security, and performance. This section details the key components of the backend implementation.

### Database Models (Prisma Schema)

The database schema is implemented using Prisma, providing a type-safe and efficient data access layer. The schema includes the following key models:

#### User Model

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  tier        String   @default("insight") // insight, analyst, edge_collective
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Betting data
  betSlips    BetSlip[]
  ocrUploads  OCRUpload[]
  analytics   UserAnalytics?

  // Subscription tracking
  monthlyUploads      Int @default(0)
  uploadsResetDate    DateTime @default(now())
  weekendPassActive   Boolean @default(false)
  marchMadnessPass    Boolean @default(false)

  @@map("users")
}
```

The User model includes:

- Basic user information (id, email, name)
- Subscription tier information
- Relations to betting data (bet slips, OCR uploads, analytics)
- Subscription tracking for upload limits and special passes

#### BetSlip Model

```prisma
model BetSlip {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  sportsbook      String
  isParlay        Boolean  @default(false)
  totalStake      Float
  totalOdds       Float?
  potentialPayout Float?
  result          String?  // pending, won, lost, push
  actualPayout    Float?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  settledAt       DateTime?

  legs            BetLeg[]
  ocrUpload       OCRUpload?

  @@map("bet_slips")
}
```

The BetSlip model includes:

- Relation to the user who created the bet slip
- Sportsbook information
- Parlay flag and financial details (stake, odds, payouts)
- Result tracking
- Timestamps for creation, updates, and settlement
- Relations to bet legs and OCR upload

#### BetLeg Model

```prisma
model BetLeg {
  id              String   @id @default(cuid())
  betSlipId       String
  betSlip         BetSlip  @relation(fields: [betSlipId], references: [id], onDelete: Cascade)

  sport           String
  league          String
  eventName       String
  eventDate       DateTime?
  betType         String
  selection       String
  odds            String
  oddsFormat      String   @default("american")
  oddsAmerican    Float
  stake           Float
  potentialPayout Float
  result          String?  // won, lost, push
  actualPayout    Float?
  notes           String?

  // ML Model predictions
  modelPrediction Json?
  confidence      Float?

  createdAt       DateTime @default(now())

  @@map("bet_legs")
}
```

The BetLeg model includes:

- Relation to the parent bet slip
- Detailed bet information (sport, league, event, bet type, selection)
- Odds information in multiple formats
- Financial details (stake, potential payout)
- Result tracking
- ML model predictions and confidence scores

#### OCRUpload Model

```prisma
model OCRUpload {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  betSlipId       String?  @unique
  betSlip         BetSlip? @relation(fields: [betSlipId], references: [id])

  filename        String
  originalName    String
  fileSize        Int
  mimeType        String
  uploadPath      String

  // OCR Processing
  status          String   @default("pending") // pending, processing, completed, failed
  ocrProvider     String?  // google_vision, aws_textract
  confidence      Float?
  extractedText   String?
  parsedData      Json?
  errorMessage    String?

  processedAt     DateTime?
  createdAt       DateTime @default(now())

  @@map("ocr_uploads")
}
```

The OCRUpload model includes:

- Relations to the user and bet slip
- File metadata (filename, size, MIME type, path)
- OCR processing information (status, provider, confidence)
- Extracted text and parsed data
- Error handling
- Timestamps for processing and creation

#### UserAnalytics Model

```prisma
model UserAnalytics {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Overall stats
  totalBets       Int      @default(0)
  totalStaked     Float    @default(0)
  totalWon        Float    @default(0)
  totalLost       Float    @default(0)
  netProfit       Float    @default(0)
  roi             Float    @default(0)
  winRate         Float    @default(0)

  // Streaks
  currentStreak   Int      @default(0)
  longestWinStreak Int     @default(0)
  longestLossStreak Int    @default(0)

  // By sport/league
  sportBreakdown  Json?    // { "nfl": { wins: 5, losses: 2, profit: 150 } }
  leagueBreakdown Json?

  // By sportsbook
  sportsbookBreakdown Json?

  // Monthly data
  monthlyStats    Json?    // [{ month: "2024-01", profit: 100, roi: 5.2 }]

  lastCalculated  DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("user_analytics")
}
```

The UserAnalytics model includes:

- Relation to the user
- Overall betting statistics (total bets, stakes, wins, losses, profit, ROI, win rate)
- Streak tracking
- Breakdowns by sport, league, and sportsbook
- Monthly statistics
- Timestamps for calculation and updates

### API Routes (Express.js)

The backend API is implemented using Express.js, providing RESTful endpoints for the frontend to interact with. The key API routes include:

#### Bet Slip Management

- `GET /api/bet-slips`: Retrieves a user's bet history with pagination and filtering options

  - Supports filtering by date range, sport, result, and sportsbook
  - Returns bet slips with their associated legs
  - Implements proper error handling and authentication checks

- `POST /api/bet-slips`: Creates a new bet slip

  - Validates the incoming data using middleware
  - Creates the bet slip and associated legs in a transaction
  - Updates the user's analytics
  - Returns the created bet slip with its ID

- `PUT /api/bet-slips/:id/result`: Updates the result of a bet slip
  - Validates the result data
  - Updates the bet slip and associated legs
  - Recalculates the user's analytics
  - Returns the updated bet slip

#### OCR Processing

- `POST /api/bet-slips/upload-ocr`: Uploads an image for OCR processing

  - Validates the uploaded file (size, type, etc.)
  - Checks the user's upload limits and special passes
  - Creates an OCR upload record
  - Initiates asynchronous OCR processing
  - Returns the upload ID for status checking

- `GET /api/bet-slips/ocr-status/:uploadId`: Checks the status of OCR processing
  - Returns the current status (pending, processing, completed, failed)
  - If completed, returns the extracted data
  - If failed, returns the error message

### OCR Processing Service

The OCR processing service is a key component of the backend, enabling users to scan bet slips with their device camera. The service includes:

#### Multi-Provider Integration

The service integrates with multiple OCR providers to ensure high accuracy and reliability:

```javascript
// OCR provider selection based on image characteristics
const selectOcrProvider = image => {
  // Use Google Vision for high-resolution images
  if (image.width > 1000 && image.height > 1000) {
    return 'google_vision';
  }
  // Use AWS Textract for lower-resolution images
  return 'aws_textract';
};

// Process with the selected provider
const processWithProvider = async (image, provider) => {
  if (provider === 'google_vision') {
    return processWithGoogleVision(image);
  } else {
    return processWithAwsTextract(image);
  }
};
```

#### Sportsbook Detection

The service includes sophisticated pattern matching to detect the sportsbook from the uploaded image:

```javascript
// Sportsbook detection patterns
const SPORTSBOOK_PATTERNS = {
  fanduel: [/FanDuel/i, /FD/i, /Fan Duel/i],
  draftkings: [/DraftKings/i, /DK/i, /Draft Kings/i],
  caesars: [/Caesars/i, /Caesar's/i],
  betmgm: [/BetMGM/i, /MGM/i],
  pointsbet: [/PointsBet/i, /Points Bet/i],
};

// Detect sportsbook from extracted text
const detectSportsbook = text => {
  for (const [sportsbook, patterns] of Object.entries(SPORTSBOOK_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return sportsbook;
      }
    }
  }
  return null; // Unknown sportsbook
};
```

#### Text Extraction and Parsing

The service extracts text from the uploaded image and parses it into structured data:

```javascript
// Parse extracted text based on sportsbook patterns
const parseWithSportsbookPatterns = (text, sportsbook) => {
  // Get the parsing function for the detected sportsbook
  const parseFunction = SPORTSBOOK_PARSERS[sportsbook] || defaultParser;

  // Parse the text into structured data
  const parsedData = parseFunction(text);

  // Validate the parsed data
  if (!validateParsedData(parsedData)) {
    throw new Error('Invalid parsed data');
  }

  return parsedData;
};
```

#### Confidence Scoring

The service includes confidence scoring to indicate the reliability of the OCR results:

```javascript
// Calculate confidence score based on multiple factors
const calculateConfidence = (extractedText, parsedData, ocrProviderConfidence) => {
  // Base confidence from OCR provider
  let confidence = ocrProviderConfidence;

  // Adjust based on completeness of parsed data
  const completeness = calculateCompleteness(parsedData);
  confidence *= completeness;

  // Adjust based on pattern matching
  const patternMatchScore = calculatePatternMatchScore(extractedText, parsedData);
  confidence *= patternMatchScore;

  return confidence;
};
```

### Analytics Service

The analytics service calculates and updates betting performance metrics for users. The service includes:

#### Overall Stats Calculation

The service calculates overall betting statistics:

```javascript
// Calculate overall stats
const calculateOverallStats = async userId => {
  // Get all settled bet slips for the user
  const betSlips = await prisma.betSlip.findMany({
    where: {
      userId,
      result: { not: 'pending' },
    },
    include: { legs: true },
  });

  // Calculate totals
  let totalBets = betSlips.length;
  let totalStaked = 0;
  let totalWon = 0;
  let totalLost = 0;

  betSlips.forEach(slip => {
    totalStaked += slip.totalStake;

    if (slip.result === 'won') {
      totalWon += slip.actualPayout || 0;
    } else if (slip.result === 'lost') {
      totalLost += slip.totalStake;
    }
  });

  // Calculate derived stats
  const netProfit = totalWon - totalLost;
  const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
  const winRate =
    totalBets > 0 ? (betSlips.filter(s => s.result === 'won').length / totalBets) * 100 : 0;

  return {
    totalBets,
    totalStaked,
    totalWon,
    totalLost,
    netProfit,
    roi,
    winRate,
  };
};
```

#### Streak Calculation

The service calculates winning and losing streaks:

```javascript
// Calculate streaks
const calculateStreaks = async userId => {
  // Get all settled bet slips for the user, ordered by settlement date
  const betSlips = await prisma.betSlip.findMany({
    where: {
      userId,
      result: { not: 'pending' },
      settledAt: { not: null },
    },
    orderBy: { settledAt: 'asc' },
  });

  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentStreakType = null;

  betSlips.forEach(slip => {
    if (slip.result === 'won') {
      if (currentStreakType === 'won') {
        currentStreak++;
      } else {
        currentStreakType = 'won';
        currentStreak = 1;
      }
      longestWinStreak = Math.max(longestWinStreak, currentStreak);
    } else if (slip.result === 'lost') {
      if (currentStreakType === 'lost') {
        currentStreak++;
      } else {
        currentStreakType = 'lost';
        currentStreak = 1;
      }
      longestLossStreak = Math.max(longestLossStreak, currentStreak);
    } else {
      // Push result, reset streak
      currentStreakType = null;
      currentStreak = 0;
    }
  });

  return {
    currentStreak: currentStreakType === 'won' ? currentStreak : -currentStreak,
    longestWinStreak,
    longestLossStreak,
  };
};
```

#### Sport, League, and Sportsbook Breakdowns

The service calculates performance breakdowns by sport, league, and sportsbook:

```javascript
// Calculate sport breakdown
const calculateSportBreakdown = async userId => {
  // Get all bet legs for the user
  const betLegs = await prisma.betLeg.findMany({
    where: {
      betSlip: {
        userId,
        result: { not: 'pending' },
      },
    },
    include: { betSlip: true },
  });

  // Group by sport
  const sportBreakdown = {};

  betLegs.forEach(leg => {
    const sport = leg.sport;

    if (!sportBreakdown[sport]) {
      sportBreakdown[sport] = {
        wins: 0,
        losses: 0,
        pushes: 0,
        profit: 0,
        stake: 0,
      };
    }

    sportBreakdown[sport].stake += leg.stake;

    if (leg.result === 'won') {
      sportBreakdown[sport].wins++;
      sportBreakdown[sport].profit += (leg.actualPayout || 0) - leg.stake;
    } else if (leg.result === 'lost') {
      sportBreakdown[sport].losses++;
      sportBreakdown[sport].profit -= leg.stake;
    } else if (leg.result === 'push') {
      sportBreakdown[sport].pushes++;
    }
  });

  return sportBreakdown;
};
```

#### Monthly Stats

The service calculates monthly performance statistics:

```javascript
// Calculate monthly stats
const calculateMonthlyStats = async userId => {
  // Get all settled bet slips for the user
  const betSlips = await prisma.betSlip.findMany({
    where: {
      userId,
      result: { not: 'pending' },
      settledAt: { not: null },
    },
  });

  // Group by month
  const monthlyData = {};

  betSlips.forEach(slip => {
    const month = slip.settledAt.toISOString().substring(0, 7); // YYYY-MM format

    if (!monthlyData[month]) {
      monthlyData[month] = {
        bets: 0,
        stake: 0,
        won: 0,
        lost: 0,
        profit: 0,
      };
    }

    monthlyData[month].bets++;
    monthlyData[month].stake += slip.totalStake;

    if (slip.result === 'won') {
      monthlyData[month].won++;
      monthlyData[month].profit += (slip.actualPayout || 0) - slip.totalStake;
    } else if (slip.result === 'lost') {
      monthlyData[month].lost++;
      monthlyData[month].profit -= slip.totalStake;
    }
  });

  // Convert to array and calculate derived stats
  const monthlyStats = Object.entries(monthlyData).map(([month, data]) => {
    const roi = data.stake > 0 ? (data.profit / data.stake) * 100 : 0;
    const winRate = data.bets > 0 ? (data.won / data.bets) * 100 : 0;

    return {
      month,
      bets: data.bets,
      stake: data.stake,
      profit: data.profit,
      roi,
      winRate,
    };
  });

  // Sort by month (newest first)
  return monthlyStats.sort((a, b) => b.month.localeCompare(a.month));
};
```

### Middleware

The backend includes middleware for authentication and validation to ensure security and data integrity.

#### Authentication Middleware

The authentication middleware verifies the user's identity and permissions:

```javascript
// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided',
      });
    }

    // Extract and verify the token
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid user',
      });
    }

    // Attach the user to the request
    req.user = user;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token',
    });
  }
};
```

#### Validation Middleware

The validation middleware ensures that incoming data meets the required format and constraints:

```javascript
// Bet slip validation middleware
const validateBetSlip = (req, res, next) => {
  const { sportsbook, isParlay, totalStake, legs } = req.body;

  // Validate required fields
  if (!sportsbook) {
    return res.status(400).json({
      success: false,
      error: 'Sportsbook is required',
    });
  }

  if (totalStake === undefined || totalStake <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Total stake must be a positive number',
    });
  }

  if (!legs || !Array.isArray(legs) || legs.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one bet leg is required',
    });
  }

  // Validate each leg
  for (const leg of legs) {
    if (!leg.sport) {
      return res.status(400).json({
        success: false,
        error: 'Sport is required for each bet leg',
      });
    }

    if (!leg.league) {
      return res.status(400).json({
        success: false,
        error: 'League is required for each bet leg',
      });
    }

    if (!leg.eventName) {
      return res.status(400).json({
        success: false,
        error: 'Event name is required for each bet leg',
      });
    }

    if (!leg.betType) {
      return res.status(400).json({
        success: false,
        error: 'Bet type is required for each bet leg',
      });
    }

    if (!leg.selection) {
      return res.status(400).json({
        success: false,
        error: 'Selection is required for each bet leg',
      });
    }

    if (!leg.odds) {
      return res.status(400).json({
        success: false,
        error: 'Odds are required for each bet leg',
      });
    }
  }

  // Continue to the next middleware or route handler
  next();
};
```

## Future Enhancements

### Planned Features

- **Analytics Dashboard**: Create a visualization of betting performance
- **Bet History View**: Allow users to view and filter their past bets
- **Spanish Localization**: Add Spanish translations for all betting-related text
- **Push Notifications**: Alert users when their bets are settled
- **Social Sharing**: Allow users to share their betting performance with friends

### Technical Improvements

- **Enhanced OCR**: Improve OCR accuracy for bet slip scanning
- **Offline Analytics**: Calculate analytics offline for better performance
- **Batch Processing**: Implement batch processing for large numbers of bets
- **Performance Optimization**: Optimize database queries and API calls
- **Caching**: Implement caching for frequently accessed data

## Implementation Status

The Betting Slip feature is now comprehensively implemented, with the following components completed:

### Frontend Components

- ✅ Core data types and configuration
- ✅ Utility functions and API service
- ✅ Mobile-specific hooks and components
- ✅ Main screen and navigation

### Backend Components

- ✅ Database models (Prisma Schema)
- ✅ API routes (Express.js)
- ✅ OCR processing service
- ✅ Analytics service
- ✅ Authentication and validation middleware
- ✅ Backend upload limits and special passes
- ✅ Smart OCR processing
- ✅ Real-time analytics
- ✅ Production error handling

### Feature Enhancements

- ✅ Spanish localization
- ✅ Analytics dashboard
- ✅ Bet history view
- ✅ Push notifications for bet settlements
- ✅ OCR testing utilities

## Spanish Localization

The betting slip feature now includes comprehensive Spanish localization support:

```javascript
// Example of Spanish translations for betting slip feature
export const spanishTranslations = {
  betting: {
    title: 'Seguimiento de Apuestas',
    subtitle: 'Rastrea tu rendimiento en apuestas',
    import: 'Importar Apuesta',
    history: 'Historial',
    analytics: 'Análisis',
    quickEntry: 'Entrada Rápida',
    camera: 'Cámara',
    manual: 'Manual',
  },
  // Additional translations...
};
```

The localization system includes:

- Complete Spanish translations for all betting-related text
- Language context provider for easy language switching
- Proper formatting of numbers, dates, and currency for Spanish locales
- Support for region-specific betting terminology

## Analytics Dashboard

A comprehensive analytics dashboard has been implemented to visualize betting performance:

- **Performance Metrics**: Total bets, win rate, ROI, and net profit
- **Monthly Performance Chart**: Line chart showing profit/loss over time
- **Sport Breakdown**: Pie chart showing distribution of bets by sport
- **Sportsbook Comparison**: Bar chart comparing ROI across different sportsbooks
- **Time Range Filtering**: Options to view data for different time periods
- **Responsive Design**: Mobile-optimized with neon styling consistent with app theme

## Bet History View

A detailed bet history view has been implemented with the following features:

- **Filtering**: Filter bets by status (all, won, lost, pending)
- **Infinite Scrolling**: Load more bets as the user scrolls
- **Pull-to-Refresh**: Update the list with the latest bets
- **Detailed Bet Cards**: Show comprehensive information about each bet
  - Sportsbook and date
  - Result status with color coding
  - Profit/loss amount
  - Individual bet legs for parlays
- **Empty State**: Informative message when no bets match the filter

## Push Notifications

Push notification support has been added for bet-related events:

- **Bet Settlement**: Notify users when their bets are settled
- **Upload Limit Reminders**: Alert users when approaching monthly upload limits
- **Weekly Performance Reports**: Scheduled notifications with betting performance summaries
- **Localized Notifications**: Support for notifications in the user's preferred language
- **Deep Linking**: Navigate to relevant screens when notifications are tapped

## OCR Testing Utilities

Comprehensive OCR testing utilities have been implemented:

- **Accuracy Testing**: Test OCR with sample images and compare to expected results
- **Field-Specific Matching**: Custom matching logic for different types of betting data
- **Test Reporting**: Generate detailed reports on OCR accuracy
- **Improvement Recommendations**: Automatically suggest ways to improve OCR performance
