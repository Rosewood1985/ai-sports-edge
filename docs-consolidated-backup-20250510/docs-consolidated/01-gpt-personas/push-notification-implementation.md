# Push Notification System Implementation

This document outlines the implementation of the push notification system in AI Sports Edge, which enables real-time notifications for game starts, results, betting opportunities, and other important events.

## Architecture Overview

The push notification system consists of the following components:

1. **Push Notification Service**: Core service for managing notifications
2. **OneSignal Integration**: Third-party service for cross-platform push notifications
3. **Notification Preferences**: User-configurable notification settings
4. **Scheduled Notifications**: Backend system for scheduling notifications
5. **Notification UI**: User interface for managing notification preferences

## Components

### Push Notification Service

The `pushNotificationService.ts` provides the core functionality for managing notifications:

- **Initialization**: Set up OneSignal with the appropriate app ID
- **User Management**: Associate notifications with specific users
- **Permission Handling**: Request and check notification permissions
- **Preference Management**: Store and retrieve user notification preferences
- **Notification Scheduling**: Schedule notifications for future delivery

```typescript
// Example: Initialize push notification service
pushNotificationService.initialize();

// Example: Set external user ID
await pushNotificationService.setExternalUserId(userId);

// Example: Request permission
const permissionGranted = await pushNotificationService.requestPermission();

// Example: Schedule notification
await pushNotificationService.scheduleNotification(
  'Game Starting Soon',
  'Lakers vs. Warriors starts in 30 minutes',
  { gameId: 'game123', type: 'gameStart' },
  new Date(Date.now() + 30 * 60 * 1000),
  'gameAlert'
);
```

### OneSignal Integration

OneSignal is used as the cross-platform push notification provider:

- **iOS and Android Support**: Unified API for both platforms
- **Web Push Support**: Push notifications for web app users
- **Rich Notifications**: Support for images, buttons, and deep links
- **Analytics**: Track notification delivery and open rates

Note: The OneSignal integration requires proper configuration in the OneSignal dashboard and appropriate app IDs for each platform.

### Notification Preferences

Users can configure their notification preferences to control which notifications they receive:

```typescript
// Notification preference structure
interface NotificationPreferences {
  enabled: boolean;        // Master toggle for all notifications
  gameAlerts: boolean;     // Game starts, scores, and results
  betReminders: boolean;   // Betting opportunities and reminders
  specialOffers: boolean;  // Promotions and special offers
  newsUpdates: boolean;    // Sports news and updates
  scoreUpdates: boolean;   // Real-time score updates
  playerAlerts: boolean;   // Player injuries, trades, and performance
}
```

These preferences are stored in Firestore at `users/{userId}/settings/notifications` and are also synchronized with OneSignal tags for targeting.

### Scheduled Notifications

Notifications can be scheduled for future delivery using the backend system:

```typescript
// Scheduled notification structure
interface ScheduledNotification {
  id: string;              // Notification ID
  userId: string;          // User ID
  title: string;           // Notification title
  message: string;         // Notification message
  data?: Record<string, any>; // Additional data
  scheduledAt: Date;       // Scheduled delivery time
  sent: boolean;           // Whether the notification has been sent
  category: string;        // Notification category
}
```

These scheduled notifications are stored in Firestore at `scheduledNotifications/{notificationId}` and are processed by a Cloud Function that sends them at the appropriate time.

### Notification UI

The `NotificationSettingsScreen.tsx` provides a user interface for managing notification preferences:

- **Permission Status**: Display current notification permission status
- **Permission Request**: Allow users to request notification permissions
- **Preference Toggles**: Enable/disable specific notification types
- **Preference Descriptions**: Explain what each notification type includes
- **Save Button**: Save notification preferences to Firestore

## Implementation Details

### OneSignal Setup

1. **Create OneSignal App**: Create an app in the OneSignal dashboard
2. **Configure Platforms**: Set up iOS, Android, and Web platforms
3. **Get App IDs**: Obtain app IDs for each platform
4. **Initialize SDK**: Initialize the OneSignal SDK in the app

### Firebase Integration

1. **Firestore Structure**: Store notification preferences and scheduled notifications
2. **Cloud Functions**: Process scheduled notifications and send them at the appropriate time
3. **Authentication**: Associate notifications with authenticated users

### User Flow

1. **Onboarding**: Request notification permission during app onboarding
2. **Preference Configuration**: Allow users to configure notification preferences
3. **Notification Delivery**: Send notifications based on user preferences
4. **Notification Handling**: Handle notification clicks and deep links

## Testing

The `test-push-notifications.js` script provides a way to test the push notification system:

- **Preference Testing**: Test getting and updating notification preferences
- **Scheduling Testing**: Test scheduling and retrieving notifications
- **Permission Testing**: Test requesting and checking notification permissions

## Security Considerations

1. **User Authentication**: Only authenticated users can manage their notification preferences
2. **Permission Validation**: Validate notification permissions before sending
3. **Rate Limiting**: Limit the number of notifications sent to a user
4. **Data Validation**: Validate notification data before sending

## Future Enhancements

1. **Rich Notifications**: Add support for images and action buttons
2. **Personalization**: Personalize notifications based on user behavior
3. **A/B Testing**: Test different notification messages and timing
4. **Analytics**: Track notification engagement and conversion
5. **Batch Processing**: Optimize notification sending for large user bases

## Troubleshooting

### Common Issues

1. **Permission Denied**: User denied notification permission
   - Solution: Provide clear value proposition and request permission at appropriate time

2. **Notification Not Delivered**: Notification was scheduled but not delivered
   - Solution: Check OneSignal dashboard for delivery status and errors

3. **Preference Not Saved**: User preference not saved to Firestore
   - Solution: Check authentication status and Firestore rules

### Debugging

1. **OneSignal Dashboard**: Check notification delivery status in OneSignal dashboard
2. **Firebase Console**: Check Firestore for notification preferences and scheduled notifications
3. **Device Logs**: Check device logs for notification-related errors
4. **Test Script**: Use the test script to verify notification functionality

## Conclusion

The push notification system provides a robust foundation for engaging users with timely and relevant notifications. By allowing users to configure their notification preferences, we ensure that they receive only the notifications they want, improving user satisfaction and engagement.