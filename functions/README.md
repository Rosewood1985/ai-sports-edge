# AI Sports Edge - Firebase Cloud Functions

This directory contains the Firebase Cloud Functions for the AI Sports Edge application. These functions automate various backend processes, including game predictions, AI Pick of the Day selection, and data management.

## Directory Structure

- `src/` - Contains the TypeScript source code for the Cloud Functions
  - `index.ts` - Main entry point that exports all functions
  - `predictTodayGames.ts` - Function to predict outcomes for today's games
  - `markAIPickOfDay.ts` - Function to mark the top prediction as the AI Pick of the Day

## Setup

### Prerequisites

- Node.js 18 or later
- Firebase CLI
- TypeScript

### Installation

1. Install dependencies:

```bash
cd functions
npm install
```

2. Build the functions:

```bash
npm run build
```

## Deployment

Deploy the functions to Firebase:

```bash
firebase deploy --only functions
```

To deploy a specific function:

```bash
firebase deploy --only functions:predictTodayGames
```

## Cloud Functions

### predictTodayGames

This function runs daily at 10 AM (Eastern Time) to predict outcomes for today's games.

#### Trigger

- Scheduled: `0 10 * * *` (10 AM daily)

#### Process

1. Fetches games scheduled for today from Firestore
2. For each game, calls the ML model to predict the outcome
3. Updates the game documents with predictions
4. Logs prediction summary to Firestore

#### Configuration

The function uses the following environment variables:

- `TIMEZONE`: The timezone for scheduling (default: "America/New_York")

### markAIPickOfDay

This function runs daily at 9 AM (Eastern Time) to mark the top prediction as the AI Pick of the Day.

#### Trigger

- Scheduled: `0 9 * * *` (9 AM daily)

#### Process

1. Fetches games scheduled for today from Firestore
2. Sorts games by AI confidence score
3. Marks the top pick (confidence >= 65%) as the AI Pick of the Day
4. Saves the pick to a historical collection for tracking

#### Configuration

The function uses the following environment variables:

- `TIMEZONE`: The timezone for scheduling (default: "America/New_York")
- `MIN_CONFIDENCE`: Minimum confidence threshold for Pick of the Day (default: 65)

## ML Integration

The functions integrate with the ML component to make predictions. The ML model is located in the `ml/` directory at the project root.

### Prediction Process

1. The function creates a temporary file with game data
2. It calls the Python script with the game data and model path
3. The script returns a JSON object with the prediction
4. The function parses the result and updates Firestore

## Firestore Collections

The functions interact with the following Firestore collections:

- `games`: Contains game data and predictions
- `predictionLogs`: Contains logs of prediction runs
- `aiPicksOfDay`: Contains historical AI Picks of the Day

## Local Testing

To test the functions locally:

```bash
firebase emulators:start
```

To test a specific function:

```bash
firebase functions:shell
```

Then call the function:

```javascript
predictTodayGames()
```

## Monitoring

You can monitor the functions in the Firebase Console:

1. Go to the Firebase Console
2. Select your project
3. Go to Functions
4. View logs and execution details

## Troubleshooting

### Common Issues

- **Function timeout**: If the function times out, consider optimizing the prediction process or increasing the timeout in the function configuration.
- **Memory issues**: If the function runs out of memory, consider optimizing the code or increasing the memory allocation.
- **Firestore quota**: Be mindful of Firestore read/write quotas, especially if you have a large number of games.

### Logs

Check the function logs in the Firebase Console for detailed error information.