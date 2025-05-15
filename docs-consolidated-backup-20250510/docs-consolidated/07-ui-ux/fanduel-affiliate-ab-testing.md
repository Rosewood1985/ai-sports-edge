# FanDuel Affiliate A/B Testing Guide

This document provides instructions for setting up and analyzing A/B tests for the FanDuel affiliate "Bet Now" buttons using Firebase Remote Config and Analytics.

## Overview

The A/B testing system allows you to test different variations of the "Bet Now" buttons to optimize conversion rates. The system automatically assigns users to test groups and tracks their interactions with the buttons.

## Test Variations

The following button variations can be tested:

### Button Styles
- **Default**: Standard button style
- **Neon**: Glowing neon effect
- **Gradient**: Color gradient background
- **Team Colored**: Uses the user's favorite team colors

### Button Sizes
- **Small**: Compact size
- **Medium**: Standard size
- **Large**: Prominent size

### Button Positions
- **Inline**: Within content flow
- **Floating**: Fixed position that follows scroll
- **Fixed**: Full-width at a fixed position

### Button Text
- **BET NOW**: Standard call to action
- **PLACE BET**: Alternative call to action
- **BET HERE**: More casual phrasing
- **GET ODDS**: Focus on information rather than action

## Setting Up A/B Tests in Firebase

### Prerequisites
- Firebase project with Analytics enabled
- Firebase Remote Config set up
- Admin access to Firebase console

### Step 1: Create Remote Config Parameters

1. Go to the Firebase console and select your project
2. Navigate to Remote Config
3. Create the following parameters:

| Parameter Name | Description | Default Value |
|---------------|-------------|--------------|
| `bet_button_test_enabled` | Enable/disable A/B testing | `true` |
| `bet_button_variations` | JSON array of test variations | See below |

Default JSON for `bet_button_variations`:
```json
[
  {
    "id": "A",
    "name": "Default Neon",
    "variation": "neon",
    "size": "medium",
    "position": "inline",
    "text": "BET NOW"
  },
  {
    "id": "B",
    "name": "Team Colored",
    "variation": "team_colored",
    "size": "medium",
    "position": "inline",
    "text": "BET NOW"
  },
  {
    "id": "C",
    "name": "Large Animated",
    "variation": "animated",
    "size": "large",
    "position": "inline",
    "text": "PLACE BET"
  },
  {
    "id": "D",
    "name": "Floating Button",
    "variation": "neon",
    "size": "medium",
    "position": "floating",
    "text": "BET NOW"
  }
]
```

### Step 2: Create A/B Test in Firebase

1. Go to the Firebase console and select your project
2. Navigate to A/B Testing
3. Click "Create Experiment"
4. Set up the experiment:
   - Name: "Bet Now Button Optimization"
   - Goal: "Conversion Rate"
   - Target: 100% of users (or adjust as needed)
   - Variants: Create variants matching your Remote Config parameters
   - Duration: 4 weeks (recommended)
   - Success Metrics: "Conversion Event" → "affiliate_conversion"

## Tracking and Analytics

The A/B testing system automatically tracks the following events:

### Impression Events
- `ab_test_button_impression`: Triggered when a button is shown
  - Properties:
    - `testGroupId`: ID of the test group
    - `testGroupName`: Name of the test group
    - `buttonVariation`: Button style variation
    - `buttonSize`: Button size
    - `buttonPosition`: Button position
    - `buttonText`: Button text
    - `location`: Where the button was shown
    - `teamId`: Team ID if applicable
    - `userId`: User ID if available
    - `gameId`: Game ID if applicable
    - `platform`: Platform (iOS, Android, web)
    - `timestamp`: When the impression occurred

### Click Events
- `ab_test_button_click`: Triggered when a button is clicked
  - Properties: Same as impression events

### Conversion Events
- `ab_test_conversion`: Triggered when a conversion occurs
  - Properties:
    - All properties from impression/click events
    - `conversionType`: Type of conversion (signup, deposit, bet)
    - `conversionValue`: Value of the conversion if applicable

## Analyzing Results

1. Go to the Firebase console and select your project
2. Navigate to A/B Testing
3. Select your active experiment
4. View the results dashboard:
   - Conversion rates by variant
   - Click-through rates by variant
   - Statistical significance indicators
   - Detailed event breakdowns

## Implementation Example

The system is already integrated into the app. To track conversions, call the `trackConversion` method when a user completes a desired action:

```typescript
// After a user places a bet through the affiliate link
useBettingAffiliate().trackConversion('bet_placed', betAmount, userId);

// After a user signs up through the affiliate link
useBettingAffiliate().trackConversion('signup', 0, userId);

// After a user makes a deposit through the affiliate link
useBettingAffiliate().trackConversion('deposit', depositAmount, userId);
```

## Best Practices

1. **Run tests for at least 2-4 weeks** to gather sufficient data
2. **Test one variable at a time** for clearer results
3. **Set clear success metrics** before starting the test
4. **Ensure even distribution** of users across test groups
5. **Wait for statistical significance** before drawing conclusions
6. **Document all test results** for future reference

## Troubleshooting

If you encounter issues with the A/B testing system:

1. Check Firebase Remote Config is properly set up
2. Verify that the app is receiving the Remote Config values
3. Ensure Analytics events are being logged correctly
4. Check for any errors in the Firebase console
5. Verify that users are being assigned to test groups correctly

## Next Steps

After analyzing the results of your A/B tests:

1. Implement the winning variation as the default
2. Plan follow-up tests to further optimize
3. Consider segmenting users for more targeted tests
4. Analyze conversion funnel to identify other optimization opportunities