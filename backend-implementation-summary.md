# Backend Implementation Summary

## Overview

The backend implementation for AI Sports Edge provides a robust foundation for the app's features, including betting slip tracking, OCR processing, analytics, and user management. This document outlines the key components of the backend implementation.

## Database Schema (Prisma)

The database schema is implemented using Prisma, providing a type-safe and efficient data access layer. The schema includes the following key models:

### User Model

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

### BetSlip Model

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

### BetLeg Model

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

### OCRUpload Model

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

### UserAnalytics Model

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

## API Routes (Express.js)

The backend API is implemented using Express.js, providing RESTful endpoints for the frontend to interact with. The key API routes include:

### Bet Slip Management

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

### OCR Processing

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

### Analytics

- `GET /api/analytics`: Retrieves a user's betting analytics

  - Returns overall statistics (total bets, win rate, ROI, etc.)
  - Returns breakdowns by sport, league, and sportsbook
  - Returns monthly statistics
  - Supports filtering by date range

- `POST /api/analytics/recalculate`: Triggers a recalculation of a user's analytics
  - Recalculates all statistics based on the user's bet slips
  - Updates the user's analytics record
  - Returns the updated analytics

## OCR Processing Service

The OCR processing service is a key component of the backend, enabling users to scan bet slips with their device camera. The service includes:

### Multi-Provider Integration

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

### Sportsbook Detection

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

### Text Extraction and Parsing

The service extracts text from the uploaded image and parses it into structured data:

```javascript
// Parse extracted text based on sportsbook patterns
const parseWithSportsbookPatterns = (text, sportsbook) => {
  const patterns = SPORTSBOOK_PARSING_PATTERNS[sportsbook] || SPORTSBOOK_PARSING_PATTERNS.generic;

  const parsedData = {
    sportsbook,
    legs: [],
  };

  // Extract bet details using regex patterns
  for (const [field, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      parsedData[field] = match[1].trim();
    }
  }

  // Extract bet legs
  const legMatches = text.matchAll(patterns.legPattern);
  for (const match of legMatches) {
    parsedData.legs.push({
      selection: match[1],
      odds: match[2],
      stake: match[3],
    });
  }

  return parsedData;
};
```

### Confidence Scoring

The service calculates confidence scores for the extracted data:

```javascript
// Calculate confidence score for extracted data
const calculateConfidence = (extractedData, ocrConfidence) => {
  // Base confidence from OCR provider
  let confidence = ocrConfidence || 0.5;

  // Adjust based on required fields presence
  const requiredFields = ['sportsbook', 'totalStake'];
  const presentFields = requiredFields.filter(field => !!extractedData[field]);

  confidence *= presentFields.length / requiredFields.length;

  // Adjust based on legs data
  if (extractedData.legs && extractedData.legs.length > 0) {
    const legConfidence =
      extractedData.legs.reduce((sum, leg) => {
        const hasRequiredLegFields = leg.selection && leg.odds;
        return sum + (hasRequiredLegFields ? 1 : 0);
      }, 0) / extractedData.legs.length;

    confidence = (confidence + legConfidence) / 2;
  }

  return confidence;
};
```

## Analytics Service

The analytics service calculates and updates betting performance metrics for users. The service includes:

### Overall Stats Calculation

The service calculates overall betting statistics:

```javascript
// Calculate overall stats
const calculateOverallStats = betSlips => {
  const stats = {
    totalBets: 0,
    totalStaked: 0,
    totalWon: 0,
    totalLost: 0,
    netProfit: 0,
    roi: 0,
    winRate: 0,
  };

  // Only consider settled bets
  const settledBets = betSlips.filter(bet => bet.result && bet.result !== 'pending');

  if (settledBets.length === 0) {
    return stats;
  }

  stats.totalBets = settledBets.length;

  // Calculate totals
  for (const bet of settledBets) {
    stats.totalStaked += bet.totalStake;

    if (bet.result === 'won') {
      stats.totalWon += bet.actualPayout || 0;
    } else if (bet.result === 'lost') {
      stats.totalLost += bet.totalStake;
    }
  }

  // Calculate derived stats
  stats.netProfit = stats.totalWon - stats.totalStaked;
  stats.roi = stats.totalStaked > 0 ? (stats.netProfit / stats.totalStaked) * 100 : 0;

  const wins = settledBets.filter(bet => bet.result === 'won').length;
  stats.winRate = (wins / stats.totalBets) * 100;

  return stats;
};
```

### Streak Calculation

The service calculates winning and losing streaks:

```javascript
// Calculate streaks
const calculateStreaks = betSlips => {
  const streaks = {
    currentStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
  };

  // Sort bets by settlement date
  const sortedBets = betSlips
    .filter(bet => bet.result && bet.result !== 'pending' && bet.settledAt)
    .sort((a, b) => new Date(a.settledAt) - new Date(b.settledAt));

  if (sortedBets.length === 0) {
    return streaks;
  }

  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const bet of sortedBets) {
    if (bet.result === 'won') {
      currentWinStreak++;
      currentLossStreak = 0;

      if (currentWinStreak > streaks.longestWinStreak) {
        streaks.longestWinStreak = currentWinStreak;
      }
    } else if (bet.result === 'lost') {
      currentLossStreak++;
      currentWinStreak = 0;

      if (currentLossStreak > streaks.longestLossStreak) {
        streaks.longestLossStreak = currentLossStreak;
      }
    } else {
      // Push or other result, reset both streaks
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  }

  // Set current streak (positive for wins, negative for losses)
  if (currentWinStreak > 0) {
    streaks.currentStreak = currentWinStreak;
  } else if (currentLossStreak > 0) {
    streaks.currentStreak = -currentLossStreak;
  }

  return streaks;
};
```

### Sport, League, and Sportsbook Breakdowns

The service calculates breakdowns by sport, league, and sportsbook:

```javascript
// Calculate sport breakdown
const calculateSportBreakdown = betSlips => {
  const breakdown = {};

  // Only consider settled bets
  const settledBets = betSlips.filter(bet => bet.result && bet.result !== 'pending');

  // Group by sport
  for (const bet of settledBets) {
    for (const leg of bet.legs) {
      const sport = leg.sport.toLowerCase();

      if (!breakdown[sport]) {
        breakdown[sport] = {
          bets: 0,
          wins: 0,
          losses: 0,
          pushes: 0,
          staked: 0,
          won: 0,
          lost: 0,
          profit: 0,
          roi: 0,
        };
      }

      breakdown[sport].bets++;

      if (leg.result === 'won') {
        breakdown[sport].wins++;
        breakdown[sport].won += leg.actualPayout || 0;
      } else if (leg.result === 'lost') {
        breakdown[sport].losses++;
        breakdown[sport].lost += leg.stake;
      } else if (leg.result === 'push') {
        breakdown[sport].pushes++;
      }

      breakdown[sport].staked += leg.stake;
    }
  }

  // Calculate derived stats for each sport
  for (const sport in breakdown) {
    breakdown[sport].profit = breakdown[sport].won - breakdown[sport].staked;
    breakdown[sport].roi =
      breakdown[sport].staked > 0 ? (breakdown[sport].profit / breakdown[sport].staked) * 100 : 0;
  }

  return breakdown;
};

// Similar functions for league and sportsbook breakdowns
```

### Monthly Stats

The service calculates monthly betting statistics:

```javascript
// Calculate monthly stats
const calculateMonthlyStats = betSlips => {
  const monthlyStats = [];
  const monthMap = {};

  // Only consider settled bets
  const settledBets = betSlips.filter(
    bet => bet.result && bet.result !== 'pending' && bet.settledAt
  );

  // Group by month
  for (const bet of settledBets) {
    const date = new Date(bet.settledAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        month: monthKey,
        bets: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        staked: 0,
        won: 0,
        lost: 0,
        profit: 0,
        roi: 0,
      };
    }

    monthMap[monthKey].bets++;
    monthMap[monthKey].staked += bet.totalStake;

    if (bet.result === 'won') {
      monthMap[monthKey].wins++;
      monthMap[monthKey].won += bet.actualPayout || 0;
    } else if (bet.result === 'lost') {
      monthMap[monthKey].losses++;
      monthMap[monthKey].lost += bet.totalStake;
    } else if (bet.result === 'push') {
      monthMap[monthKey].pushes++;
    }
  }

  // Calculate derived stats for each month and convert to array
  for (const monthKey in monthMap) {
    const month = monthMap[monthKey];
    month.profit = month.won - month.staked;
    month.roi = month.staked > 0 ? (month.profit / month.staked) * 100 : 0;
    monthlyStats.push(month);
  }

  // Sort by month (newest first)
  return monthlyStats.sort((a, b) => b.month.localeCompare(a.month));
};
```

## Middleware

The backend includes middleware for authentication, validation, and error handling.

### Authentication Middleware

The authentication middleware verifies user authentication for protected routes:

```javascript
// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token',
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User not found',
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
```

### Validation Middleware

The validation middleware validates request data:

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
  for (const [index, leg] of legs.entries()) {
    if (!leg.sport) {
      return res.status(400).json({
        success: false,
        error: `Leg ${index + 1}: Sport is required`,
      });
    }

    if (!leg.selection) {
      return res.status(400).json({
        success: false,
        error: `Leg ${index + 1}: Selection is required`,
      });
    }

    if (!leg.odds) {
      return res.status(400).json({
        success: false,
        error: `Leg ${index + 1}: Odds are required`,
      });
    }

    if (leg.stake === undefined && !isParlay) {
      return res.status(400).json({
        success: false,
        error: `Leg ${index + 1}: Stake is required for non-parlay bets`,
      });
    }
  }

  next();
};
```

## Setup Instructions

### Environment Variables

The backend requires the following environment variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/aisportsedge

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# OCR Services
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_CREDENTIALS=path/to/credentials.json
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1

# Storage
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=10485760 # 10MB

# Subscription Tiers
INSIGHT_TIER_UPLOADS=5
ANALYST_TIER_UPLOADS=20
EDGE_COLLECTIVE_TIER_UPLOADS=50
```

### Database Setup

1. Install PostgreSQL
2. Create a new database
3. Run Prisma migrations:

```bash
npx prisma migrate dev
```

### API Integrations

1. Set up Google Cloud Vision API:

   - Create a Google Cloud project
   - Enable the Vision API
   - Create a service account and download credentials

2. Set up AWS Textract:
   - Create an AWS account
   - Create an IAM user with Textract permissions
   - Generate access keys

### Security Configuration

1. Set up CORS:

```javascript
// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://aisportsedge.app', 'https://www.aisportsedge.app']
        : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
```

2. Set up rate limiting:

```javascript
// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);
```

3. Set up helmet for security headers:

```javascript
// Security headers
app.use(helmet());
```

## Implementation Status

The backend implementation is complete, with the following components:

- ✅ Database schema (Prisma)
- ✅ API routes (Express.js)
- ✅ OCR processing service
- ✅ Analytics service
- ✅ Authentication and validation middleware
- ✅ Error handling
- ✅ Security configuration
