# Stripe Integration Tests

This directory contains comprehensive tests for the Stripe integration in the AI Sports Edge application. These tests verify that all Stripe-related functionality works correctly in both development and production environments.

## Test Coverage

The test suite covers the following aspects of Stripe integration:

1. **Configuration Tests** (`config.test.ts`)
   - Verify that Stripe API keys are properly configured
   - Verify that Stripe price IDs are properly configured

2. **Individual Subscription Tests** (`subscription.test.ts`)
   - Test subscribing to Basic Monthly plan
   - Test subscribing to Premium Monthly plan
   - Test subscribing to Premium Yearly plan
   - Test handling of failed payments
   - Test subscription cancellation

3. **Group Subscription Tests** (`group-subscription.test.ts`)
   - Test creating a group subscription
   - Test adding members to a group subscription
   - Test removing members from a group subscription
   - Test canceling a group subscription

4. **One-Time Purchase Tests** (`one-time-purchases.test.ts`)
   - Test purchasing a weekend pass
   - Test purchasing a game day pass
   - Test purchasing a single prediction
   - Test purchasing a parlay suggestion

5. **Webhook Tests** (`webhooks.test.ts`)
   - Test handling of subscription.created webhook event
   - Test handling of subscription.updated webhook event
   - Test handling of subscription.deleted webhook event
   - Test handling of payment_intent.payment_failed webhook event
   - Test webhook signature verification

6. **Security Tests** (`security.test.ts`)
   - Test that only publishable keys are exposed to clients
   - Test that webhook signatures are properly verified
   - Test that user authorization is properly enforced
   - Test that error responses don't expose sensitive information

## Running the Tests

### Running All Tests

To run all Stripe integration tests with coverage report:

```bash
./__tests__/stripe/run-stripe-tests.sh
```

This script will run all the tests and generate a coverage report in the `test-results/stripe/coverage` directory.

### Running Individual Test Files

To run a specific test file:

```bash
npx jest --testMatch="**/__tests__/stripe/config.test.ts" --verbose
```

Replace `config.test.ts` with the name of the test file you want to run.

## Test Data

The tests use the following test data:

### Test Cards

- **Successful Payment:** 4242 4242 4242 4242
- **Failed Payment:** 4000 0000 0000 0002
- **Requires Authentication:** 4000 0025 0000 3155

### Test Users

- **Owner User:** owner@test.com / TestPassword123
- **Member User 1:** member1@test.com / TestPassword123
- **Member User 2:** member2@test.com / TestPassword123

## Mocking Strategy

The tests use Jest's mocking capabilities to mock the following dependencies:

- Firebase Auth and Firestore
- Stripe API
- Axios for network requests
- File system for reading configuration files

This allows the tests to run without making actual API calls or modifying the database.

## Continuous Integration

These tests are designed to be run in a CI/CD pipeline. The test runner script (`run-stripe-tests.sh`) will exit with a non-zero status code if any tests fail, which can be used to fail the build in a CI/CD pipeline.

## Adding New Tests

When adding new Stripe functionality to the application, please add corresponding tests to this suite. Follow the existing patterns for mocking dependencies and structuring test cases.