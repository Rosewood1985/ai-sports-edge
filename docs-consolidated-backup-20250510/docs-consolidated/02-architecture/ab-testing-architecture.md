# A/B Testing Architecture

## Overview

This document outlines the architecture for implementing A/B testing capabilities in AI Sports Edge, with a specific focus on testing different upgrade prompt strategies to maximize conversions.

## Goals

1. Create a flexible A/B testing framework that can be used across the app
2. Implement specific tests for upgrade prompt strategies
3. Track and analyze conversion metrics
4. Provide a mechanism for rolling out successful strategies

## Architecture Components

### 1. A/B Testing Service

The core of the A/B testing system will be a dedicated service that manages test configuration, user assignment, and tracking.

```typescript
// services/abTestingService.ts

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  targetUserPercentage: number; // 0-100
  targetUserSegments?: string[]; // e.g., 'new-users', 'premium-users'
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Relative weight for random assignment
}

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
}

export interface ABTestEvent {
  testId: string;
  variantId: string;
  userId: string;
  eventType: string; // e.g., 'impression', 'click', 'conversion'
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

### 2. User Assignment System

A system to consistently assign users to test variants and persist these assignments.

```typescript
// Assignment algorithm (pseudocode)
function assignUserToVariant(userId: string, test: ABTest): string {
  // Check if user is already assigned
  const existingAssignment = getExistingAssignment(userId, test.id);
  if (existingAssignment) {
    return existingAssignment.variantId;
  }
  
  // Determine if user should be included in test based on percentage
  const userHash = hashFunction(userId + test.id);
  const normalizedHash = userHash / MAX_HASH_VALUE; // 0-1
  
  if (normalizedHash > test.targetUserPercentage / 100) {
    return null; // User not included in test
  }
  
  // Check if user matches target segments
  if (test.targetUserSegments && !isUserInSegments(userId, test.targetUserSegments)) {
    return null;
  }
  
  // Assign variant based on weights
  const variantId = selectVariantByWeight(test.variants, normalizedHash);
  
  // Save assignment
  saveAssignment(userId, test.id, variantId);
  
  return variantId;
}
```

### 3. Upgrade Prompt Component

A flexible upgrade prompt component that can be configured based on test variants.

```typescript
// components/UpgradePrompt.tsx

export interface UpgradePromptProps {
  testId?: string; // Optional A/B test ID
  onConversion?: () => void;
  onDismiss?: () => void;
  feature?: string; // Feature being promoted
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  testId,
  onConversion,
  onDismiss,
  feature
}) => {
  const { userId } = useAuth();
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  
  useEffect(() => {
    if (testId && userId) {
      // Get assigned variant
      const variantId = abTestingService.getAssignedVariant(userId, testId);
      if (variantId) {
        const testVariant = abTestingService.getVariant(testId, variantId);
        setVariant(testVariant);
        
        // Track impression
        abTestingService.trackEvent(testId, variantId, userId, 'impression', {
          feature,
          screen: getCurrentScreen()
        });
      }
    }
  }, [testId, userId, feature]);
  
  const handleUpgradeClick = () => {
    if (testId && variant && userId) {
      // Track conversion
      abTestingService.trackEvent(testId, variant.id, userId, 'conversion', {
        feature,
        screen: getCurrentScreen()
      });
    }
    
    if (onConversion) {
      onConversion();
    }
  };
  
  // Render different UI based on variant
  if (!variant) {
    return <DefaultUpgradePrompt onUpgrade={handleUpgradeClick} onDismiss={onDismiss} feature={feature} />;
  }
  
  switch (variant.id) {
    case 'value-focused':
      return <ValueFocusedPrompt onUpgrade={handleUpgradeClick} onDismiss={onDismiss} feature={feature} />;
    case 'scarcity-focused':
      return <ScarcityFocusedPrompt onUpgrade={handleUpgradeClick} onDismiss={onDismiss} feature={feature} />;
    case 'social-proof-focused':
      return <SocialProofPrompt onUpgrade={handleUpgradeClick} onDismiss={onDismiss} feature={feature} />;
    default:
      return <DefaultUpgradePrompt onUpgrade={handleUpgradeClick} onDismiss={onDismiss} feature={feature} />;
  }
};
```

### 4. Analytics Integration

Integration with analytics to track and analyze test results.

```typescript
// services/abTestingAnalyticsService.ts

export interface ABTestMetrics {
  testId: string;
  variantId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  averageRevenuePerUser: number;
}

export const getTestMetrics = async (testId: string): Promise<Record<string, ABTestMetrics>> => {
  // Fetch events for this test
  const events = await fetchTestEvents(testId);
  
  // Group by variant
  const variantEvents = groupEventsByVariant(events);
  
  // Calculate metrics for each variant
  const metrics: Record<string, ABTestMetrics> = {};
  
  for (const [variantId, variantEvents] of Object.entries(variantEvents)) {
    const impressions = countEventsByType(variantEvents, 'impression');
    const clicks = countEventsByType(variantEvents, 'click');
    const conversions = countEventsByType(variantEvents, 'conversion');
    const revenue = calculateRevenue(variantEvents);
    
    metrics[variantId] = {
      testId,
      variantId,
      impressions,
      clicks,
      conversions,
      conversionRate: impressions > 0 ? (conversions / impressions) * 100 : 0,
      revenue,
      averageRevenuePerUser: impressions > 0 ? revenue / impressions : 0
    };
  }
  
  return metrics;
};

export const determineWinningVariant = (metrics: Record<string, ABTestMetrics>): string => {
  // Find variant with highest conversion rate
  let highestRate = 0;
  let winningVariant = '';
  
  for (const [variantId, variantMetrics] of Object.entries(metrics)) {
    if (variantMetrics.conversionRate > highestRate) {
      highestRate = variantMetrics.conversionRate;
      winningVariant = variantId;
    }
  }
  
  return winningVariant;
};
```

### 5. Admin Dashboard

A dashboard for creating, monitoring, and analyzing A/B tests.

```typescript
// screens/ABTestingDashboardScreen.tsx

const ABTestingDashboardScreen: React.FC = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ABTestMetrics>>({});
  
  useEffect(() => {
    // Load tests
    const loadTests = async () => {
      const allTests = await abTestingService.getAllTests();
      setTests(allTests);
    };
    
    loadTests();
  }, []);
  
  useEffect(() => {
    // Load metrics for selected test
    if (selectedTest) {
      const loadMetrics = async () => {
        const testMetrics = await abTestingAnalyticsService.getTestMetrics(selectedTest.id);
        setMetrics(testMetrics);
      };
      
      loadMetrics();
    }
  }, [selectedTest]);
  
  const handleCreateTest = () => {
    // Show create test modal
  };
  
  const handleEndTest = async () => {
    if (!selectedTest) return;
    
    // End test
    await abTestingService.endTest(selectedTest.id);
    
    // Determine winning variant
    const winningVariant = abTestingAnalyticsService.determineWinningVariant(metrics);
    
    // Show confirmation dialog to roll out winning variant
    showConfirmationDialog(
      'Roll out winning variant?',
      `Would you like to roll out the winning variant "${winningVariant}" to all users?`,
      async () => {
        await abTestingService.rollOutVariant(selectedTest.id, winningVariant);
      }
    );
  };
  
  return (
    <View>
      <Header title="A/B Testing Dashboard" />
      
      <Button title="Create New Test" onPress={handleCreateTest} />
      
      <TestList tests={tests} onSelectTest={setSelectedTest} />
      
      {selectedTest && (
        <>
          <TestDetails test={selectedTest} />
          <MetricsChart metrics={metrics} />
          <VariantComparison metrics={metrics} />
          <Button title="End Test" onPress={handleEndTest} />
        </>
      )}
    </View>
  );
};
```

## Upgrade Prompt Test Variants

For the specific goal of testing upgrade prompt strategies, we'll implement the following variants:

### Variant 1: Value-Focused

Emphasizes the value and benefits users will get from upgrading.

```typescript
const ValueFocusedPrompt: React.FC<PromptProps> = ({ onUpgrade, onDismiss, feature }) => (
  <Card>
    <Title>Unlock Premium Value</Title>
    <Text>
      Upgrade now to access {feature} and get 5x more insights, advanced analytics, 
      and personalized recommendations. Our premium users win 30% more bets on average!
    </Text>
    <PriceDisplay price="$9.99" period="month" />
    <Button title="Upgrade Now" onPress={onUpgrade} />
    <TextButton title="Maybe Later" onPress={onDismiss} />
  </Card>
);
```

### Variant 2: Scarcity-Focused

Creates a sense of urgency and limited availability.

```typescript
const ScarcityFocusedPrompt: React.FC<PromptProps> = ({ onUpgrade, onDismiss, feature }) => (
  <Card>
    <Title>Limited Time Offer</Title>
    <Text>
      Special 30% discount on premium access to {feature} ends in 24 hours!
      Don't miss this exclusive opportunity to elevate your betting game.
    </Text>
    <PriceDisplay price="$6.99" period="month" originalPrice="$9.99" />
    <CountdownTimer hours={24} />
    <Button title="Claim Discount Now" onPress={onUpgrade} />
    <TextButton title="I'll Miss Out" onPress={onDismiss} />
  </Card>
);
```

### Variant 3: Social Proof-Focused

Leverages social proof to encourage upgrades.

```typescript
const SocialProofPrompt: React.FC<PromptProps> = ({ onUpgrade, onDismiss, feature }) => (
  <Card>
    <Title>Join 50,000+ Winning Bettors</Title>
    <Text>
      95% of our premium users recommend upgrading for access to {feature}.
      "This feature alone improved my win rate by 27%" - John D.
    </Text>
    <RatingStars rating={4.8} reviewCount={1243} />
    <PriceDisplay price="$9.99" period="month" />
    <Button title="Join the Winners" onPress={onUpgrade} />
    <TextButton title="Not Now" onPress={onDismiss} />
  </Card>
);
```

## Implementation Plan

1. **Phase 1: Core Framework (5 days)**
   - Implement ABTestingService
   - Create user assignment system
   - Set up event tracking
   - Integrate with analytics

2. **Phase 2: Upgrade Prompt Variants (3 days)**
   - Implement base UpgradePrompt component
   - Create variant components
   - Integrate with ABTestingService

3. **Phase 3: Admin Dashboard (4 days)**
   - Create test management UI
   - Implement metrics visualization
   - Add test creation/editing functionality
   - Build variant comparison tools

4. **Phase 4: Testing and Rollout (3 days)**
   - Set up initial A/B tests
   - Validate tracking and metrics
   - Monitor initial results
   - Implement rollout mechanism

## Success Metrics

The success of this implementation will be measured by:

1. **Conversion Rate Improvement**: Increase in upgrade conversions compared to baseline
2. **Revenue Impact**: Increase in revenue from premium subscriptions
3. **Framework Flexibility**: Ability to easily create and manage new tests
4. **Data Quality**: Accuracy and completeness of test metrics

## Future Enhancements

1. **Multi-variate Testing**: Extend to support testing multiple variables simultaneously
2. **Personalization**: Use ML to personalize which variant a user sees based on their behavior
3. **Automated Optimization**: Automatically adjust variant weights based on performance
4. **Feature Flagging**: Integrate with feature flag system for controlled rollouts