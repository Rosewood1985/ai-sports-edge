# Privacy Features Implementation Guide

This guide explains how to use the privacy features implemented in AI Sports Edge. These features help ensure compliance with privacy regulations such as GDPR, CCPA, and other data protection laws.

## Overview

The privacy features include:

1. **Data Retention Policies**: Automatically manage data retention periods for different types of data
2. **Privacy Preferences Management**: Allow users to manage their privacy preferences
3. **Data Access Requests**: Allow users to request access to their data
4. **Data Deletion Requests**: Allow users to request deletion of their data or account

## Architecture

The privacy features follow the atomic architecture pattern:

- **Atoms**: Basic building blocks like data categories and retention periods
- **Molecules**: Components that implement specific privacy features
- **Organisms**: Services that coordinate privacy features and integrate with the rest of the application

## Data Retention Policies

Data retention policies automatically manage the lifecycle of user data based on configurable retention periods.

### Usage

```typescript
import {
  applyRetentionPolicies,
  scheduleDataRetentionJob,
} from 'atomic/atoms/privacy/dataRetentionPolicies';

// Apply retention policies to a specific collection
await applyRetentionPolicies('users', 'createdAt', 'category');

// Schedule a job to automatically apply retention policies
const jobId = scheduleDataRetentionJob(
  ['users', 'activity', 'analytics'],
  1 // Run daily
);

// Stop the job when no longer needed
stopDataRetentionJob(jobId);
```

### Customizing Retention Periods

You can customize the retention periods for different data categories:

```typescript
import { retentionPeriods } from 'atomic/atoms/privacy/dataRetentionPolicies';

// Override default retention periods
retentionPeriods.personalInfo = 365 * 3; // 3 years
retentionPeriods.analyticsData = 30; // 1 month
```

## Privacy Preferences Management

The PrivacyManager allows users to manage their privacy preferences, such as consent for marketing communications, data analytics, and third-party sharing.

### Usage

```typescript
import { privacyService } from 'atomic/organisms/privacy';

// Get user's privacy preferences
const preferences = await privacyService.getPrivacyPreferences(userId);

// Update user's privacy preferences
await privacyService.updatePrivacyPreferences(userId, {
  marketingConsent: true,
  analyticsConsent: true,
  thirdPartySharing: false,
  profiling: false,
});

// Check if user has given consent for a specific purpose
const hasConsent = await privacyService.getPrivacyManager().hasConsent(userId, 'marketingConsent');
```

## Data Access Requests

Users can request access to their data, which will be provided in a downloadable format.

### Usage

```typescript
import { privacyService } from 'atomic/organisms/privacy';

// Request data access
await privacyService.requestDataAccess(userId, ['personalInfo', 'activityData'], 'json');

// Get status of a data access request
const status = await privacyService.getDataAccessRequestStatus(requestId);

// Get all data access requests for a user
const requests = await privacyService.getUserDataAccessRequests(userId);

// Get download URL for a completed request
const downloadUrl = await privacyService.getDataAccessManager().getDownloadUrl(requestId);
```

## Data Deletion Requests

Users can request deletion of specific categories of their data or their entire account.

### Usage

```typescript
import { privacyService } from 'atomic/organisms/privacy';

// Request deletion of specific data categories
await privacyService.requestDataDeletion(userId, ['analyticsData', 'locationData']);

// Request account deletion
await privacyService.requestAccountDeletion(userId);

// Get status of a data deletion request
const status = await privacyService.getDataDeletionRequestStatus(requestId);

// Get all data deletion requests for a user
const requests = await privacyService.getUserDataDeletionRequests(userId);

// Cancel a deletion request
await privacyService.getDataDeletionManager().cancelRequest(requestId);
```

## Integration with UI

To integrate privacy features with the UI, you can create screens for:

1. **Privacy Settings**: Allow users to manage their privacy preferences
2. **Data Access Requests**: Allow users to request access to their data
3. **Data Deletion Requests**: Allow users to request deletion of their data or account

Example of a Privacy Settings screen:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Switch, Text, StyleSheet } from 'react-native';
import { privacyService } from 'atomic/organisms/privacy';

const PrivacySettingsScreen = ({ userId }) => {
  const [preferences, setPreferences] = useState({
    marketingConsent: false,
    analyticsConsent: true,
    thirdPartySharing: false,
    profiling: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const userPreferences = await privacyService.getPrivacyPreferences(userId);
        setPreferences(userPreferences);
      } catch (error) {
        console.error('Error loading privacy preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const handleToggle = async key => {
    try {
      const updatedPreferences = {
        ...preferences,
        [key]: !preferences[key],
      };

      setPreferences(updatedPreferences);
      await privacyService.updatePrivacyPreferences(userId, updatedPreferences);
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      // Revert the change if there was an error
      setPreferences(preferences);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Marketing Communications</Text>
        <Switch
          value={preferences.marketingConsent}
          onValueChange={() => handleToggle('marketingConsent')}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Data Analytics</Text>
        <Switch
          value={preferences.analyticsConsent}
          onValueChange={() => handleToggle('analyticsConsent')}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Third-Party Sharing</Text>
        <Switch
          value={preferences.thirdPartySharing}
          onValueChange={() => handleToggle('thirdPartySharing')}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Profiling</Text>
        <Switch value={preferences.profiling} onValueChange={() => handleToggle('profiling')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
  },
});

export default PrivacySettingsScreen;
```

## Initialization

The privacy service is automatically initialized when the app starts. You can see this in the `App.tsx` file:

```tsx
// Initialize services
React.useEffect(() => {
  firebaseService.initialize();
  monitoringService.initialize();
  privacyService.initialize();
}, []);
```

## Translations

Privacy-related text is available in both English and Spanish. You can find the translations in:

- `translations/en.json`
- `translations/es.json`

## Best Practices

1. **Consent Management**: Always check for user consent before processing data for optional purposes like marketing or analytics.
2. **Data Minimization**: Only collect and store the data you need for the specific purpose.
3. **Transparency**: Clearly inform users about what data you collect, how you use it, and how long you keep it.
4. **User Control**: Give users easy access to their privacy settings and the ability to exercise their rights.
5. **Documentation**: Keep records of user consent and data processing activities.

## Compliance Considerations

- **GDPR**: Ensure you have a legal basis for processing personal data, such as consent or legitimate interest.
- **CCPA**: Allow California residents to opt out of the sale of their personal information.
- **LGPD**: Provide Brazilian users with information about data processing and their rights.
- **PIPEDA**: Obtain meaningful consent from Canadian users before collecting, using, or disclosing their personal information.

## Troubleshooting

- **Data Retention Job Not Running**: Check if the job was properly scheduled and that the Firestore rules allow the operations.
- **Privacy Preferences Not Saving**: Verify that the user has the necessary permissions to write to the privacyPreferences collection.
- **Data Access/Deletion Requests Stuck**: Check the Firestore security rules and ensure the background functions are deployed and running.

## Future Improvements

- Implement automated data portability (export in standard formats)
- Add more granular consent options
- Implement consent versioning to track changes in privacy policy
- Add audit logging for privacy-related actions
