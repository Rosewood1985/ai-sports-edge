# System Patterns

## Testing Patterns

### Mocking External Services
```typescript
// Mock Firebase auth
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id'
    }
  },
  firestore: jest.fn()
}));

// Mock firebaseSubscriptionService
jest.mock('../../services/firebaseSubscriptionService', () => ({
  subscribeToPlan: jest.fn(),
  cancelSubscription: jest.fn(),
  getUserSubscription: jest.fn()
}));
```

This pattern allows testing payment flows without making real API calls, providing:
- Isolation from external dependencies
- Consistent test behavior
- Fast test execution
- No side effects in production systems

### Test Organization by Functional Domain
```
__tests__/stripe/
  ├── config.test.ts           # Configuration tests
  ├── subscription.test.ts     # Individual subscription tests
  ├── group-subscription.test.ts # Group subscription tests
  ├── one-time-purchases.test.ts # One-time purchase tests
  ├── webhooks.test.ts         # Webhook tests
  ├── security.test.ts         # Security tests
  ├── run-stripe-tests.sh      # Test runner script
  └── README.md                # Documentation
```

This organization provides:
- Clear separation of concerns
- Easy navigation of test files
- Focused test files for specific functionality
- Comprehensive coverage of all aspects of the system

### Security-Focused Testing
```typescript
describe('API Key Protection', () => {
  test('should only expose publishable key to client', () => {
    // Verify that the publishable key starts with 'pk_'
    expect(STRIPE_PUBLISHABLE_KEY).toBeDefined();
    expect(STRIPE_PUBLISHABLE_KEY.startsWith('pk_')).toBe(true);
    
    // Verify that no secret key is exposed
    // @ts-ignore - Intentionally checking for undefined variable
    expect(typeof STRIPE_SECRET_KEY).toBe('undefined');
  });
});
```

This pattern ensures:
- API keys are properly protected
- Only publishable keys are exposed to clients
- Secret keys are kept secure
- Security vulnerabilities are caught early

### Test Runner Script
```bash
#!/bin/bash

# Run the tests
echo -e "\n${YELLOW}1. Testing Stripe Configuration${NC}"
npx jest --testMatch="**/__tests__/stripe/config.test.ts" --verbose

# ... more test commands ...

# Run all tests together and generate a coverage report
echo -e "\n${YELLOW}Running all tests with coverage report${NC}"
npx jest --testMatch="**/__tests__/stripe/*.test.ts" --coverage --coverageDirectory=test-results/stripe/coverage
```

This pattern provides:
- Easy execution of all tests
- Consistent test execution environment
- Coverage reporting for quality assurance
- Clear output for test results

## Implementation Patterns

### Webhook Handling
```javascript
// Check signature
const signature = req.headers['stripe-signature'];
if (!signature) {
  return res.status(400).send('Missing Stripe signature');
}

// Verify event
try {
  event = stripe.webhooks.constructEvent(
    req.rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  return res.status(400).send(`Webhook Error: ${err.message}`);
}
```

This pattern ensures:
- Webhook signatures are verified
- Invalid requests are rejected
- Error handling is robust
- Security is maintained

### User Authorization
```javascript
// Auth check
if (!context.auth) {
  throw new Error('unauthenticated');
}

// Owner check
if (groupData.ownerId !== userId) {
  throw new Error('permission-denied');
}
```

This pattern ensures:
- Only authenticated users can access resources
- Only authorized users can modify resources
- Security is maintained throughout the application
- Clear error messages for unauthorized access

## Usage-Based Billing Patterns

### Usage Tracking
```typescript
// services/usageTrackingService.ts
export const trackUsage = async (
  userId: string,
  featureId: string,
  quantity: number = 1
): Promise<void> => {
  try {
    await firestore.collection('usageRecords').add({
      userId,
      featureId,
      quantity,
      timestamp: serverTimestamp()
    });
    
    // Track analytics event
    await analyticsService.trackEvent(`used_metered_feature`, {
      featureId,
      quantity
    });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
};
```

This pattern provides:
- Consistent tracking of feature usage
- Integration with analytics for business insights
- Error handling to prevent tracking failures
- Flexibility for different feature types

### Usage Reporting to Stripe
```javascript
// functions/src/reportUsage.js
exports.reportUsageToStripe = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get all active metered subscriptions
    const subscriptionsSnapshot = await db.collectionGroup('subscriptions')
      .where('status', '==', 'active')
      .where('usageType', '==', 'metered')
      .get();
    
    for (const doc of subscriptionsSnapshot.docs) {
      const subscription = doc.data();
      const userId = doc.ref.parent.parent.id;
      
      // Get usage records for yesterday
      const usageSnapshot = await db.collection('usageRecords')
        .where('userId', '==', userId)
        .where('featureId', '==', subscription.featureId)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(now))
        .get();
      
      // Sum up the quantities
      let totalUsage = 0;
      usageSnapshot.forEach(doc => {
        totalUsage += doc.data().quantity || 1;
      });
      
      if (totalUsage > 0) {
        // Report usage to Stripe
        await stripe.subscriptionItems.createUsageRecord(
          subscription.stripeSubscriptionItemId,
          {
            quantity: totalUsage,
            timestamp: Math.floor(now.getTime() / 1000),
            action: 'increment'
          }
        );
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
    return null;
  }
});
```

This pattern ensures:
- Usage is reported to Stripe on a regular schedule
- Only active subscriptions are processed
- Usage is aggregated correctly
- Errors are handled gracefully

### Metered Subscription Creation
```javascript
// Create subscription with metered pricing
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{
    price_data: {
      currency: 'usd',
      product: METERED_PRODUCTS[featureId],
      recurring: {
        interval: 'month',
        usage_type: 'metered'
      },
      unit_amount: METERED_PRICES[featureId]
    }
  }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent']
});

// Store subscription in Firestore
await db.collection('users').doc(userId)
  .collection('subscriptions').doc(subscription.id).set({
    status: subscription.status,
    featureId: featureId,
    usageType: 'metered',
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionItemId: subscription.items.data[0].id,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
```

This pattern provides:
- Proper configuration of metered subscriptions in Stripe
- Storage of subscription details in Firestore
- Tracking of subscription item IDs for usage reporting
- Proper timestamp handling between Stripe and Firestore

### Usage Display Component
```tsx
// components/UsageTracker.tsx
const UsageTracker: React.FC<UsageTrackerProps> = ({ featureId }) => {
  const [currentUsage, setCurrentUsage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { colors } = useTheme();
  
  const feature = METERED_FEATURES[featureId];
  
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const usage = await getCurrentUsage(userId, featureId);
        setCurrentUsage(usage);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsage();
  }, [featureId]);
  
  // Render usage information
  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {feature.name} Usage
      </Text>
      <Text style={[styles.usage, { color: colors.primary }]}>
        {currentUsage} units used this month
      </Text>
      <Text style={[styles.info, { color: colors.textSecondary }]}>
        Base price: ${(feature.basePrice / 100).toFixed(2)}/month
        + ${(feature.unitPrice / 100).toFixed(2)} per unit
      </Text>
    </View>
  );
};
```

This pattern provides:
- Real-time display of usage information
- Clear presentation of pricing structure
- Integration with the app's theme system
- Loading state handling

## Accessibility Patterns

### Accessibility Service
```typescript
// services/accessibilityService.ts
export const getAccessibilityProps = (
  label: string,
  hint?: string,
  role?: AccessibilityRole,
  state?: Record<string, boolean>
): Record<string, any> => {
  const props: Record<string, any> = {
    accessible: true,
    accessibilityLabel: label
  };
  
  if (hint && preferences.screenReaderHints) {
    props.accessibilityHint = hint;
  }
  
  if (role) {
    props.accessibilityRole = role;
  }
  
  if (state) {
    props.accessibilityState = state;
  }
  
  return props;
};
```

This pattern ensures:
- Consistent accessibility properties across components
- Proper screen reader support
- Respect for user preferences
- Clean component code without repetitive accessibility logic

### Accessible Component Wrappers
```tsx
// components/AccessibleText.tsx
const AccessibleText: React.FC<AccessibleTextProps> = ({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  applyHighContrast = true,
  applyLargeText = true,
  applyBoldText = true,
  highContrastStyle,
  largeTextStyle,
  boldTextStyle,
  style,
  children,
  ...props
}) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );
  
  // Subscribe to accessibility service changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener((newPreferences) => {
      setPreferences(newPreferences);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Apply styles based on preferences
  const appliedStyle = [
    style,
    preferences.highContrast && applyHighContrast && [styles.highContrast, highContrastStyle],
    preferences.largeText && applyLargeText && [styles.largeText, largeTextStyle],
    (preferences.boldText || accessibilityService.isBoldTextActive()) && 
      applyBoldText && [styles.boldText, boldTextStyle]
  ];
  
  // Get accessibility props
  const accessibilityProps = accessibilityLabel
    ? accessibilityService.getAccessibilityProps(
        accessibilityLabel,
        accessibilityHint,
        accessibilityRole,
        accessibilityState
      )
    : {};
  
  return (
    <Text
      style={appliedStyle}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </Text>
  );
};
```

This pattern provides:
- Automatic adaptation to user preferences
- Consistent styling for accessibility features
- Clean component API
- Reusable accessibility logic

### Reduced Motion Animation
```typescript
// hooks/useAccessibleAnimation.ts
export const useAccessibleAnimation = (
  defaultConfig: Animated.TimingAnimationConfig
): Animated.TimingAnimationConfig => {
  const [reduceMotion, setReduceMotion] = useState<boolean>(
    accessibilityService.isReduceMotionActive()
  );
  
  // Subscribe to accessibility service changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener((preferences) => {
      setReduceMotion(
        preferences.reduceMotion || accessibilityService.isReduceMotionActive()
      );
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Return modified animation config based on reduce motion preference
  return reduceMotion
    ? {
        ...defaultConfig,
        duration: 0, // Disable animation
      }
    : defaultConfig;
};
```

This pattern ensures:
- Animations respect the reduce motion preference
- Consistent animation behavior across the app
- Clean component code without repetitive motion checks
- Proper handling of system and user preferences

### Accessibility Testing
```typescript
// scripts/accessibility-audit.js
function scanFile(filePath) {
  const issues = [];
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Check for missing accessibility props
  if (!fileContent.includes('accessibilityLabel') && 
      (fileContent.includes('<TouchableOpacity') || 
       fileContent.includes('<Button') || 
       fileContent.includes('<Pressable'))) {
    issues.push({
      file: filePath,
      line: findLineNumber(fileContent, '<TouchableOpacity') || 
            findLineNumber(fileContent, '<Button') || 
            findLineNumber(fileContent, '<Pressable'),
      criterion: '4.1.2',
      severity: 'error',
      message: 'Interactive element missing accessibilityLabel',
      code: 'missing-accessibility-label',
      suggestion: 'Add accessibilityLabel prop to describe the purpose of this control'
    });
  }
  
  // Check for small touch targets
  if (fileContent.includes('width:') && fileContent.includes('height:')) {
    const smallTouchTargetRegex = /width:\s*(\d+)(px|pt)?.+?height:\s*(\d+)(px|pt)?/gs;
    let match;
    while ((match = smallTouchTargetRegex.exec(fileContent)) !== null) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[3], 10);
      
      if ((width < 44 || height < 44) && 
          fileContent.substring(match.index - 200, match.index).includes('<TouchableOpacity')) {
        issues.push({
          file: filePath,
          line: findLineNumber(fileContent, match[0]),
          criterion: 'M1',
          severity: 'warning',
          message: 'Touch target may be too small',
          code: 'small-touch-target',
          suggestion: 'Ensure touch targets are at least 44x44 points'
        });
      }
    }
  }
  
  return issues;
}
```

This pattern provides:
- Automated accessibility testing
- Identification of common accessibility issues
- Specific suggestions for fixing issues
- Integration with development workflow