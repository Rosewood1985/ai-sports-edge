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