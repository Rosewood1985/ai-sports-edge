# AI Sports Edge

AI Sports Edge is a mobile and web application that provides AI-powered sports betting predictions, analytics, and insights for smarter betting decisions.

## Features

- **AI Predictions**: Advanced machine learning algorithms analyze vast amounts of data to provide accurate betting predictions.
- **Real-Time Analytics**: Get up-to-the-minute stats, odds, and analysis to make informed betting decisions.
- **Multi-Sport Coverage**: From NFL to Formula 1, we cover all major sports with specialized prediction models for each.
- **Community Insights**: Connect with other bettors, share strategies, and learn from the community's collective wisdom.
- **Personalized Betting Insights**: Custom risk assessment, personalized betting unit recommendations, and tailored notifications.
- **Enhanced Player Statistics**: Detailed player performance metrics and comparison tools.
- **Location-Based Features**: Find nearby venues and get local team odds.
- **Betting Analytics Dashboard**: Track your betting performance with advanced visualization tools.
- **Multi-user Subscription Options**: Share premium features with friends and family.

## Project Status

AI Sports Edge is currently in pre-deployment phase. For detailed information about the project status, check the following documentation:

- [Pre-Deployment Status](docs/pre-deployment-status.md): Overview of completed and remaining tasks
- [Deployment Checklist](docs/deployment-checklist.md): Comprehensive checklist for web and iOS deployment
- [Technical Debt Inventory](docs/technical-debt.md): Tracking of technical debt items to address
- [Remaining Features Implementation Plan](docs/remaining-features-implementation-plan.md): Detailed plan for completing remaining features

## Getting Started

### Prerequisites

- [Expo Go](https://expo.dev/client) app installed on your iOS or Android device

### Installation

1. Scan the QR code with your mobile device's camera app to open the project in Expo Go.
2. Alternatively, you can open the Expo Go app and scan the QR code from within the app.
3. You can also open the app directly by visiting: `exp://exp.host/@aisportsedge/ai-sports-edge`

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Setup

1. Clone the repository
2. Set up environment variables (see below)
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npx expo start
   ```

### Environment Variables

This project uses environment variables to manage sensitive configuration like API keys. Follow these steps to set up your environment:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your actual API keys and configuration values:
   ```
   # Stripe API Keys
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

   # FanDuel Affiliate
   FANDUEL_AFFILIATE_ID=your_affiliate_id_here
   
   # Other configuration...
   ```

3. **IMPORTANT: Never commit your `.env` file to Git!** The `.env` file is already added to `.gitignore` to prevent accidental commits.

#### Production Deployment

For production environments, set environment variables through your hosting platform:

- **Firebase**: Use Firebase Functions configuration
  ```bash
  firebase functions:config:set stripe.secret_key="sk_live_your_key_here" stripe.webhook_secret="whsec_your_webhook_secret_here"
  ```

- **Expo/EAS**: Set environment variables in your EAS build configuration
  ```json
  {
    "builds": {
      "production": {
        "env": {
          "STRIPE_PUBLISHABLE_KEY": "pk_live_your_key_here"
        }
      }
    }
  }
  ```

#### Security Best Practices

- **Never hardcode API keys** in your source code
- **Use different keys** for development and production
- **Rotate keys periodically** for enhanced security
- **Restrict API key permissions** to only what's needed

### Building for Production

#### iOS

```
npx eas build --platform ios --profile ios-beta
```

#### Android

```
npx eas build --platform android --profile preview
```

### Deploying Updates

```
npx eas update
```

## Web Version

A web version of the app is available at:
- [https://aisportsedge-app.web.app](https://aisportsedge-app.web.app)

To build and deploy the web version:

```
npm run deploy
```

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
