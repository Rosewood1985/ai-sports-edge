# AI Sports Edge: Compliance Features Developer Guide

This guide provides technical documentation for the compliance features in AI Sports Edge, including implementation details, architecture, and best practices.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [GDPR Compliance](#gdpr-compliance)
3. [Cookie Consent](#cookie-consent)
4. [Age Verification](#age-verification)
5. [Self-Exclusion Check](#self-exclusion-check)
6. [Responsible Gambling](#responsible-gambling)
7. [Liability Waiver](#liability-waiver)
8. [License Verification](#license-verification)
9. [Security Considerations](#security-considerations)
10. [Testing Guidelines](#testing-guidelines)
11. [Localization](#localization)

## Architecture Overview

The compliance features in AI Sports Edge follow a modular architecture with the following components:

### Components

1. **Onboarding Navigator**: Manages the flow of verification screens during onboarding
2. **Verification Screens**: Individual screens for each compliance feature
3. **User Service**: Handles storing and retrieving verification data
4. **License Verification Service**: Verifies third-party licenses

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Verification   │────▶│  User Service   │────▶│    Firebase     │
│     Screens     │     │                 │     │   Firestore     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### File Structure

```
src/
├── screens/
│   └── Onboarding/
│       ├── GDPRConsentScreen.tsx
│       ├── CookieConsentScreen.tsx
│       ├── AgeVerificationScreen.tsx
│       ├── SelfExclusionScreen.tsx
│       ├── ResponsibleGamblingScreen.tsx
│       └── LiabilityWaiverScreen.tsx
├── services/
│   ├── userService.ts
│   └── licenseVerificationService.ts
├── navigation/
│   └── OnboardingNavigator.tsx
└── translations/
    ├── en.json
    ├── fr.json
    └── es.json
```

## GDPR Compliance

### Implementation Details

The GDPR compliance feature is implemented in `GDPRConsentScreen.tsx` and allows users to control how their data is used.

#### Data Categories

1. **Essential Data**: Required for app functionality
2. **Analytics Data**: Optional usage statistics
3. **Marketing Data**: Optional promotional content
4. **Third-Party Sharing**: Optional data sharing with partners

#### Data Storage

GDPR consent preferences are stored in Firebase Firestore with the following structure:

```typescript
interface GDPRConsent {
  essentialConsent: boolean;  // Always true
  analyticsConsent: boolean;
  marketingConsent: boolean;
  thirdPartyConsent: boolean;
  timestamp: string;
}
```

#### Usage Example

```typescript
// Save GDPR consent
await saveVerificationData(user.uid, 'gdprConsent', {
  essentialConsent: true,
  analyticsConsent: analyticsConsent,
  marketingConsent: marketingConsent,
  thirdPartyConsent: thirdPartyConsent,
  timestamp: new Date().toISOString()
});

// Check if user has consented to analytics
const userData = await getUserVerificationData(user.uid);
const hasAnalyticsConsent = userData?.gdprConsent?.analyticsConsent === true;
```

### Best Practices

1. Always respect user preferences
2. Only collect essential data by default
3. Provide clear explanations for each data category
4. Allow users to change preferences at any time
5. Implement data deletion functionality

## Cookie Consent

### Implementation Details

The cookie consent feature is implemented in `CookieConsentScreen.tsx` and allows users to control which cookies are used.

#### Cookie Categories

1. **Essential Cookies**: Required for app functionality
2. **Analytics Cookies**: Optional usage tracking
3. **Marketing Cookies**: Optional advertising cookies
4. **Preference Cookies**: Optional user preference storage

#### Data Storage

Cookie consent preferences are stored in Firebase Firestore with the following structure:

```typescript
interface CookieConsent {
  essentialCookies: boolean;  // Always true
  analyticsCookies: boolean;
  marketingCookies: boolean;
  preferenceCookies: boolean;
  timestamp: string;
}
```

#### Usage Example

```typescript
// Save cookie consent
await saveVerificationData(user.uid, 'cookieConsent', {
  essentialCookies: true,
  analyticsCookies: analyticsCookies,
  marketingCookies: marketingCookies,
  preferenceCookies: preferenceCookies,
  timestamp: new Date().toISOString()
});

// Check if user has consented to marketing cookies
const userData = await getUserVerificationData(user.uid);
const hasMarketingCookieConsent = userData?.cookieConsent?.marketingCookies === true;
```

### Best Practices

1. Only set cookies that the user has consented to
2. Provide a way to update cookie preferences
3. Respect Do Not Track settings
4. Document all cookies used in the app
5. Regularly audit cookies to ensure compliance

## Age Verification

### Implementation Details

The age verification feature is implemented in `AgeVerificationScreen.tsx` and ensures users are of legal age.

#### Verification Method

The current implementation uses self-declaration, but can be extended to include:

1. ID verification
2. Credit card verification
3. Third-party age verification services

#### Data Storage

Age verification data is stored in Firebase Firestore with the following structure:

```typescript
interface AgeVerification {
  confirmed: boolean;
  timestamp: string;
}
```

#### Usage Example

```typescript
// Save age verification
await saveVerificationData(user.uid, 'ageVerification', {
  confirmed: true,
  timestamp: new Date().toISOString()
});

// Check if user has verified their age
const userData = await getUserVerificationData(user.uid);
const hasVerifiedAge = userData?.ageVerification?.confirmed === true;
```

### Best Practices

1. Block underage users from accessing the app
2. Consider implementing additional verification for high-risk users
3. Regularly re-verify age for long-term users
4. Keep verification data secure and confidential
5. Comply with local age verification requirements

## Self-Exclusion Check

### Implementation Details

The self-exclusion check feature is implemented in `SelfExclusionScreen.tsx` and prevents users on self-exclusion lists from using the app.

#### Verification Method

The current implementation uses self-declaration, but can be extended to include:

1. Integration with national self-exclusion databases
2. Third-party verification services
3. Identity verification

#### Data Storage

Self-exclusion data is stored in Firebase Firestore with the following structure:

```typescript
interface SelfExclusionCheck {
  response: boolean;  // false = not on self-exclusion list
  timestamp: string;
}
```

#### Usage Example

```typescript
// Save self-exclusion check
await saveVerificationData(user.uid, 'selfExclusionCheck', {
  response: false,  // false = not on self-exclusion list
  timestamp: new Date().toISOString()
});

// Check if user is on a self-exclusion list
const userData = await getUserVerificationData(user.uid);
const isOnSelfExclusionList = userData?.selfExclusionCheck?.response === true;
```

### Best Practices

1. Prevent users on self-exclusion lists from creating accounts
2. Regularly check against self-exclusion databases
3. Provide resources for problem gambling
4. Implement a self-exclusion feature within the app
5. Respect self-exclusion periods

## Responsible Gambling

### Implementation Details

The responsible gambling feature is implemented in `ResponsibleGamblingScreen.tsx` and promotes responsible gambling practices.

#### Features

1. Deposit limits
2. Time limits
3. Loss limits
4. Reality checks
5. Self-exclusion

#### Data Storage

Responsible gambling acknowledgment is stored in Firebase Firestore with the following structure:

```typescript
interface ResponsibleGamblingAcknowledgment {
  acknowledged: boolean;
  timestamp: string;
}
```

#### Usage Example

```typescript
// Save responsible gambling acknowledgment
await saveVerificationData(user.uid, 'responsibleGamblingAcknowledgment', {
  acknowledged: true,
  timestamp: new Date().toISOString()
});

// Check if user has acknowledged responsible gambling
const userData = await getUserVerificationData(user.uid);
const hasAcknowledged = userData?.responsibleGamblingAcknowledgment?.acknowledged === true;
```

### Best Practices

1. Implement deposit, time, and loss limits
2. Provide regular reality checks
3. Include self-exclusion functionality
4. Offer resources for problem gambling
5. Monitor for signs of problem gambling

## Liability Waiver

### Implementation Details

The liability waiver feature is implemented in `LiabilityWaiverScreen.tsx` and ensures users understand the risks of sports betting.

#### Key Components

1. Scrollable waiver text
2. Scroll tracking to ensure users read the entire waiver
3. Explicit acknowledgment checkbox
4. Accept/decline buttons

#### Data Storage

Liability waiver acceptance is stored in Firebase Firestore with the following structure:

```typescript
interface WaiverAcceptance {
  accepted: boolean;
  version: string;
  timestamp: string;
}
```

#### Usage Example

```typescript
// Save waiver acceptance
await saveVerificationData(user.uid, 'waiverAcceptance', {
  accepted: true,
  version: '1.0',
  timestamp: new Date().toISOString()
});

// Check if user has accepted the waiver
const userData = await getUserVerificationData(user.uid);
const hasAcceptedWaiver = userData?.waiverAcceptance?.accepted === true;
```

### Best Practices

1. Keep the waiver clear and understandable
2. Ensure users read the entire waiver
3. Require explicit acceptance
4. Version the waiver for future updates
5. Store acceptance records securely

## License Verification

### Implementation Details

The license verification feature is implemented in `licenseVerificationService.ts` and ensures all third-party dependencies are properly licensed.

#### Features

1. License compatibility checking
2. Attribution text extraction
3. License report generation
4. Incompatible license detection

#### Usage Example

```typescript
// Verify a single package
const result = await verifyLicense('react-native', '0.68.2');

// Verify multiple packages
const dependencies = [
  { packageName: 'react', version: '17.0.2' },
  { packageName: 'react-native', version: '0.68.2' }
];
const results = await verifyLicenses(dependencies);

// Generate a license report
const report = await generateLicenseReport(dependencies);
```

### Best Practices

1. Verify licenses before deployment
2. Include license verification in CI/CD pipeline
3. Document all third-party licenses
4. Include attribution where required
5. Avoid incompatible licenses

## Security Considerations

### Data Protection

1. **Encryption**: All verification data should be encrypted in transit and at rest
2. **Access Control**: Implement proper access controls for verification data
3. **Data Minimization**: Only collect necessary data
4. **Retention Policy**: Implement a data retention policy
5. **Secure Storage**: Use secure storage for sensitive data

### Audit Trail

1. **Logging**: Log all verification actions
2. **Timestamps**: Include timestamps for all verification data
3. **Version Tracking**: Track versions of legal documents
4. **Change History**: Maintain a history of preference changes
5. **Audit Collection**: Store audit records in a separate collection

## Testing Guidelines

### Unit Testing

1. Test each verification component in isolation
2. Verify proper state management
3. Test error handling
4. Verify accessibility compliance
5. Test with different user inputs

### Integration Testing

1. Test the complete onboarding flow
2. Verify data is properly stored in Firebase
3. Test navigation between screens
4. Verify user preferences are respected
5. Test with different device sizes and orientations

### Compliance Testing

1. Verify GDPR compliance
2. Test cookie consent functionality
3. Verify age verification works correctly
4. Test self-exclusion checks
5. Verify responsible gambling features

## Localization

### Supported Languages

The compliance features are currently localized in:

1. English (en)
2. French (fr)
3. Spanish (es)

### Adding a New Language

To add a new language:

1. Create a new translation file in `translations/`
2. Add translations for all compliance-related keys
3. Update the language selector to include the new language
4. Test the app with the new language

### Translation Keys

The following translation sections are used for compliance features:

1. `gdpr`: GDPR consent screen
2. `cookie`: Cookie consent screen
3. `age_verification`: Age verification screen
4. `self_exclusion`: Self-exclusion check screen
5. `responsible_gambling`: Responsible gambling screen
6. `liability`: Liability waiver screen
7. `legal`: Legal information

### Example

```json
"gdpr": {
  "title": "Data Privacy Preferences",
  "description": "We value your privacy. Please select how you would like us to use your data.",
  "essential_title": "Essential Data",
  "essential_description": "Required for the app to function. This includes authentication, security, and basic app functionality."
  // ...
}
```

## Conclusion

By implementing these compliance features, AI Sports Edge ensures legal compliance, promotes responsible gambling, and protects user privacy. Developers should follow the guidelines in this document to maintain and extend these features.

For any questions or clarifications, please contact the development team.