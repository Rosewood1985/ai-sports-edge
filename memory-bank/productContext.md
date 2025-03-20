# Product Context

## Stripe Integration

### Payment Infrastructure
- Stripe integration supports multiple payment models:
  - Individual subscriptions (Basic Monthly, Premium Monthly, Premium Yearly)
  - Group subscriptions (Pro Monthly)
  - One-time purchases (Weekend Pass, Game Day Pass)
  - Microtransactions (Single Prediction, Parlay Suggestion)

### Payment Flows
- Subscription creation and management
- Group subscription member management
- One-time purchases for temporary access
- Microtransactions for specific content
- Webhook handling for asynchronous events (subscription updates, payment failures)

### Security Measures
- API key protection (only publishable keys exposed to clients)
- Webhook signature verification
- User authorization checks
- Error handling without exposing sensitive information

## Testing Requirements

### Functional Testing
- Verify successful subscription creation and management
- Test group subscription member addition and removal
- Validate one-time purchase and microtransaction flows
- Ensure webhook events are properly processed

### Security Testing
- Verify API keys are properly protected
- Test webhook signature verification
- Validate user authorization checks
- Ensure error handling doesn't expose sensitive information

### Integration Testing
- Test integration with Firebase for storing subscription data
- Validate integration with Stripe API for payment processing
- Test integration with application components that use subscription data