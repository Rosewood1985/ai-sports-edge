# FanDuel Affiliate Integration Implementation Guide

This guide provides instructions for configuring and using the FanDuel affiliate integration with micro-transactions in the AI Sports Edge app.

## Overview

The implementation combines micro-transactions with affiliate marketing to create a dual revenue stream:

1. **Direct Revenue**: Users pay to access odds information ($1.99 per game)
2. **Affiliate Revenue**: Commission on bets placed through FanDuel

## Components Implemented

1. **Configuration File**: `config/affiliateConfig.ts`
   - Contains placeholder values for FanDuel affiliate ID and Stripe credentials
   - Easy to update when actual credentials are available

2. **OddsButton Component**: `components/OddsButton.tsx`
   - Dynamic button that changes from "Get Odds" to "Bet Now on FanDuel" after purchase
   - Handles both Stripe payment processing and FanDuel affiliate link redirection

3. **Firebase Functions**: `functions/stripePayments.js`
   - Handles Stripe payment intents
   - Manages purchase records in Firestore
   - Provides webhook endpoint for Stripe events

4. **Sample Screen**: `screens/GameDetailScreen.tsx`
   - Demonstrates how to use the OddsButton component
   - Shows odds information after purchase

## Configuration Steps

### 1. Update Affiliate Configuration

Once you have your FanDuel affiliate ID, update the configuration in `config/affiliateConfig.ts`:

```typescript
// FanDuel Affiliate Configuration
export const FANDUEL_CONFIG = {
  // Replace with your actual FanDuel affiliate ID
  AFFILIATE_ID: 'YOUR_AFFILIATE_ID',
  
  // Base URL for FanDuel
  BASE_URL: 'https://sportsbook.fanduel.com/',
  
  // Default tracking parameters
  TRACKING_PARAMS: {
    utm_source: 'aisportsedge',
    utm_medium: 'affiliate',
    utm_campaign: 'betbutton',
  },
};
```

### 2. Set Up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Update the configuration in `config/affiliateConfig.ts`:

```typescript
// Stripe Configuration
export const STRIPE_CONFIG = {
  // Replace with your actual Stripe publishable key
  PUBLISHABLE_KEY: 'pk_test_YOUR_PUBLISHABLE_KEY',
  
  // Replace with your actual Stripe merchant identifier
  MERCHANT_IDENTIFIER: 'merchant.com.aisportsedge',
  
  // Default product pricing (in cents)
  PRICING: {
    ODDS_ACCESS: 199, // $1.99 for odds access
  },
};
```

4. Configure Firebase Functions for Stripe:

```bash
firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY" stripe.webhook_secret="YOUR_WEBHOOK_SECRET"
```

### 3. Set Up Firebase

1. Make sure your Firebase project is properly configured
2. Deploy the Firebase functions:

```bash
firebase deploy --only functions
```

3. Set up the Firestore database with the following collections:
   - `user_purchases`: Stores user purchase records

## Usage

### Adding the OddsButton to a Screen

```tsx
import OddsButton from '../components/OddsButton';

// Inside your component
const MyComponent = () => {
  const [hasPurchasedOdds, setHasPurchasedOdds] = useState(false);
  
  const handlePurchaseSuccess = () => {
    setHasPurchasedOdds(true);
  };
  
  return (
    <View>
      <OddsButton
        game={game}
        userId={userId}
        hasPurchasedOdds={hasPurchasedOdds}
        onPurchaseSuccess={handlePurchaseSuccess}
        size="large"
      />
      
      {hasPurchasedOdds && (
        <View>
          {/* Show odds information here */}
        </View>
      )}
    </View>
  );
};
```

### Checking Purchase Status

```tsx
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// Inside your component
useEffect(() => {
  const checkPurchaseStatus = async () => {
    if (functions) {
      const checkStatus = httpsCallable(functions, 'checkPurchaseStatus');
      const result = await checkStatus({
        userId,
        gameId: game.id,
      });
      
      const data = result.data as { hasPurchased: boolean };
      setHasPurchasedOdds(data.hasPurchased);
    }
  };
  
  checkPurchaseStatus();
}, [userId, game.id]);
```

> **Note**: The API endpoints are configured to use `https://ai-sports-edge.firebaseapp.com/api` as the base URL. If your API is hosted elsewhere, update the `BASE_URL` in `config/affiliateConfig.ts`.

## Testing

### Testing Stripe Payments

Use Stripe test cards for testing payments:

- **Success**: `4242 4242 4242 4242`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

### Testing FanDuel Links

1. Use your test affiliate ID for development
2. Verify that the links include the proper tracking parameters
3. Check that the user is redirected to the correct FanDuel page

## Monitoring and Analytics

The implementation includes comprehensive analytics tracking:

1. **Button Impressions**: When the button is displayed
2. **Button Clicks**: When the button is clicked
3. **Purchase Events**: When a user purchases odds access
4. **Conversion Events**: When a user clicks through to FanDuel

You can view these events in the Firebase Analytics dashboard.

## Troubleshooting

### Stripe Payment Issues

- Check that your Stripe API keys are correctly configured
- Verify that the Firebase functions are deployed
- Check the Firebase functions logs for errors

### FanDuel Link Issues

- Verify that your affiliate ID is correct
- Check that the game-specific URLs are being generated correctly
- Test the links in different browsers and devices

## Next Steps

1. **A/B Testing**: Implement A/B testing for button variations
2. **Enhanced Analytics**: Add more detailed analytics tracking
3. **Additional Betting Sites**: Add support for other betting sites

## Resources

- [FanDuel Affiliate Program](https://www.fanduel.com/affiliates)
- [Stripe Documentation](https://stripe.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)