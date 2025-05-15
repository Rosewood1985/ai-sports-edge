# Deep Linking Implementation

This document outlines the implementation of deep linking in AI Sports Edge, which enables the app to respond to external links and track marketing campaigns.

## Architecture Overview

The deep linking system consists of the following components:

1. **Deep Linking Service**: Core service for handling deep links
2. **Deep Link Handler**: Component for processing deep links and navigating to the appropriate screen
3. **URL Scheme**: Custom URL scheme for the app (aisportsedge://)
4. **Universal Links**: Web domain for universal links (aisportsedge.app)
5. **Campaign Tracking**: UTM parameter tracking for marketing campaigns

## Components

### Deep Linking Service

The `deepLinkingService.ts` provides the core functionality for handling deep links:

- **Initialization**: Set up deep linking listeners
- **URL Parsing**: Parse deep link URLs into structured data
- **Link Creation**: Create deep links and universal links
- **Event Handling**: Notify listeners when deep links are received
- **History Tracking**: Track deep link history for analytics

```typescript
// Example: Initialize deep linking service
deepLinkingService.initialize();

// Example: Create a deep link
const deepLink = deepLinkingService.createDeepLink(
  DeepLinkPath.GAME,
  { id: 'game123' },
  { source: 'email', campaign: 'weekly_digest' }
);

// Example: Add deep link listener
const unsubscribe = deepLinkingService.addListener((data) => {
  console.log('Deep link received:', data);
});
```

### Deep Link Handler

The `DeepLinkHandler.tsx` component processes deep links and navigates to the appropriate screen:

- **Initialization**: Initialize deep linking service
- **Initial Link Processing**: Process deep links that launched the app
- **Link Handling**: Handle deep links received while the app is running
- **Navigation**: Navigate to the appropriate screen based on the deep link

```typescript
// Example: Deep link handler component
const DeepLinkHandler: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Initialize deep linking service
    deepLinkingService.initialize();

    // Add deep link listener
    const unsubscribe = deepLinkingService.addListener((data) => {
      // Handle deep link
      handleDeepLink(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ...
};
```

### URL Scheme

The app uses a custom URL scheme for deep links:

```
aisportsedge://[path]?[parameters]
```

For example:
- `aisportsedge://game?id=123` - Open game details screen for game ID 123
- `aisportsedge://player?id=456` - Open player details screen for player ID 456
- `aisportsedge://referral?code=ABC123` - Open referral screen with code ABC123

### Universal Links

The app uses universal links for web-to-app deep linking:

```
https://aisportsedge.app/[path]?[parameters]
```

For example:
- `https://aisportsedge.app/game?id=123` - Open game details screen for game ID 123
- `https://aisportsedge.app/player?id=456` - Open player details screen for player ID 456
- `https://aisportsedge.app/referral?code=ABC123` - Open referral screen with code ABC123

### Campaign Tracking

The app supports UTM parameters for campaign tracking:

- `utm_source` - Source of the traffic (e.g., email, social, search)
- `utm_medium` - Medium of the traffic (e.g., cpc, banner, email)
- `utm_campaign` - Name of the campaign (e.g., spring_sale, product_launch)
- `utm_term` - Search terms used (e.g., sports_betting, basketball_odds)
- `utm_content` - Content of the ad (e.g., logolink, textlink)

For example:
```
aisportsedge://game?id=123&utm_source=email&utm_campaign=weekly_digest
```

## Implementation Details

### iOS Setup

1. **URL Scheme Configuration**: Configure the custom URL scheme in Info.plist
2. **Universal Links Configuration**: Configure universal links with Associated Domains
3. **Deep Link Handling**: Set up deep link handling in AppDelegate.m

### Android Setup

1. **URL Scheme Configuration**: Configure the custom URL scheme in AndroidManifest.xml
2. **Universal Links Configuration**: Configure universal links with App Links
3. **Deep Link Handling**: Set up deep link handling in MainActivity.java

### React Native Setup

1. **Linking API**: Use React Native's Linking API to handle deep links
2. **Initial URL**: Get the initial URL that launched the app
3. **URL Listener**: Add a listener for URLs received while the app is running

### Deep Link Paths

The app supports the following deep link paths:

- `home` - Home screen
- `game` - Game details screen (requires `id` parameter)
- `player` - Player details screen (requires `id` parameter)
- `team` - Team details screen (requires `id` parameter)
- `bet` - Bet details screen (requires `id` parameter)
- `subscription` - Subscription screen
- `referral` - Referral screen (optional `code` parameter)
- `notification` - Notification details screen (requires `id` parameter)
- `settings` - Settings screen
- `promo` - Promo screen (requires `code` parameter)

### Deep Link Parameters

Deep links can include the following parameters:

- `id` - ID of the resource (game, player, team, bet, notification)
- `code` - Referral or promo code
- UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`)

### Deep Link History

Deep link history is stored in Firestore at `deepLinkHistory/{deepLinkId}` with the following structure:

```typescript
interface DeepLinkHistoryEntry {
  id: string;              // Deep link ID
  userId?: string;         // User ID (if authenticated)
  url: string;             // Deep link URL
  path: DeepLinkPath;      // Deep link path
  params: DeepLinkParams;  // Deep link parameters
  utmParams: UTMParams;    // UTM parameters
  timestamp: Date;         // Timestamp
  processed: boolean;      // Whether the deep link was processed
  result?: string;         // Processing result
}
```

## Testing

### Manual Testing

1. **URL Scheme Testing**: Test deep links with the custom URL scheme
   - Example: `aisportsedge://game?id=123`

2. **Universal Links Testing**: Test deep links with universal links
   - Example: `https://aisportsedge.app/game?id=123`

3. **Campaign Tracking Testing**: Test deep links with UTM parameters
   - Example: `aisportsedge://game?id=123&utm_source=email&utm_campaign=weekly_digest`

### Automated Testing

1. **Unit Testing**: Test deep link parsing and creation
2. **Integration Testing**: Test deep link handling and navigation
3. **End-to-End Testing**: Test deep linking from external apps

## Security Considerations

1. **Input Validation**: Validate all parameters from deep links
2. **Authentication**: Require authentication for sensitive deep links
3. **Rate Limiting**: Limit the number of deep links processed
4. **Data Validation**: Validate deep link data before processing

## Marketing Integration

1. **Email Campaigns**: Include deep links in email campaigns
2. **Social Media**: Share deep links on social media
3. **QR Codes**: Generate QR codes for deep links
4. **App Banners**: Use deep links in app banners

## Future Enhancements

1. **Deferred Deep Linking**: Support deep linking for users who don't have the app installed
2. **Dynamic Links**: Support Firebase Dynamic Links
3. **A/B Testing**: Test different deep link destinations
4. **Personalization**: Personalize deep link destinations based on user behavior
5. **Analytics**: Track deep link engagement and conversion

## Troubleshooting

### Common Issues

1. **Deep Link Not Working**: Deep link not opening the app
   - Solution: Check URL scheme configuration and deep link format

2. **Navigation Not Working**: App opens but doesn't navigate to the correct screen
   - Solution: Check deep link handler and navigation code

3. **UTM Parameters Not Tracked**: UTM parameters not being tracked
   - Solution: Check UTM parameter parsing and analytics integration

### Debugging

1. **Console Logging**: Log deep links and navigation events
2. **Firebase Analytics**: Track deep link events in Firebase Analytics
3. **Deep Link History**: Check deep link history in Firestore
4. **Manual Testing**: Test deep links with different parameters and paths

## Conclusion

The deep linking system provides a robust foundation for linking to specific content within the app and tracking marketing campaigns. By supporting both custom URL schemes and universal links, we ensure that users can access content from a variety of sources, improving user engagement and retention.