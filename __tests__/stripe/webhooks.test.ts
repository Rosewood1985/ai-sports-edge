/**
 * Stripe Webhook Tests
 *
 * These tests verify the handling of Stripe webhook events.
 */

// Import the webhook handler function
const stripeWebhooks = require('../../functions/stripeWebhooks');

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const firestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    add: jest.fn(),
  };

  return {
    apps: [],
    initializeApp: jest.fn(),
    firestore: jest.fn(() => firestore),
    auth: jest.fn(() => ({
      getUser: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(),
      arrayUnion: jest.fn(),
      arrayRemove: jest.fn(),
    },
    Timestamp: {
      fromMillis: jest.fn(millis => ({ toMillis: () => millis })),
      fromDate: jest.fn(date => ({ toDate: () => date })),
    },
  };
});

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      update: jest.fn(),
    },
  }));
});

// Define types for request and response
interface MockRequest {
  headers: {
    'stripe-signature'?: string;
  };
  rawBody: string;
}

interface MockResponse {
  status: jest.Mock;
  send: jest.Mock;
}

interface MockStripe {
  webhooks: {
    constructEvent: jest.Mock;
  };
  subscriptions: {
    update: jest.Mock;
  };
}

interface MockAdmin {
  firestore: jest.Mock;
  FieldValue: {
    serverTimestamp: jest.Mock;
    arrayUnion: jest.Mock;
    arrayRemove: jest.Mock;
  };
  Timestamp: {
    fromMillis: jest.Mock;
    fromDate: jest.Mock;
  };
}

describe('Stripe Webhooks', () => {
  let req: MockRequest;
  let res: MockResponse;
  let stripe: MockStripe;
  let admin: MockAdmin;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request and response objects
    req = {
      headers: {
        'stripe-signature': 'test_signature',
      },
      rawBody: JSON.stringify({ type: 'test_event' }),
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Get references to mocked modules
    stripe = require('stripe')() as MockStripe;
    admin = require('firebase-admin') as MockAdmin;
  });

  // Test ID: STRIPE-WEBHOOK-001
  describe('Subscription Created Webhook', () => {
    test('should handle subscription.created event', async () => {
      // Mock the webhook event
      const subscriptionEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123456',
            customer: 'cus_123456',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_premium_monthly',
                  },
                },
              ],
            },
          },
        },
      };

      // Mock Stripe webhook verification
      stripe.webhooks.constructEvent.mockReturnValue(subscriptionEvent);

      // Mock Firestore query results
      const mockUserDoc = {
        id: 'test-user-id',
        exists: true,
        data: () => ({ stripeCustomerId: 'cus_123456' }),
      };
      const mockUserSnapshot = {
        empty: false,
        docs: [mockUserDoc],
      };
      admin.firestore().collection().where().limit().get.mockResolvedValue(mockUserSnapshot);

      const mockPriceDoc = {
        id: 'price-doc-id',
        exists: true,
        data: () => ({ name: 'Premium Monthly' }),
      };
      const mockPriceSnapshot = {
        empty: false,
        docs: [mockPriceDoc],
      };
      admin.firestore().collection().where().limit().get.mockResolvedValueOnce(mockPriceSnapshot);

      // Call the webhook handler
      await stripeWebhooks.stripeWebhook(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ received: true });

      // Verify Firestore operations
      expect(admin.firestore().collection).toHaveBeenCalledWith('users');
      expect(admin.firestore().collection().doc().collection().doc().set).toHaveBeenCalled();
      expect(admin.firestore().collection().doc().update).toHaveBeenCalled();
    });
  });

  // Test ID: STRIPE-WEBHOOK-002
  describe('Subscription Updated Webhook', () => {
    test('should handle subscription.updated event', async () => {
      // Mock the webhook event
      const subscriptionEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123456',
            customer: 'cus_123456',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            cancel_at_period_end: true,
          },
        },
      };

      // Mock Stripe webhook verification
      stripe.webhooks.constructEvent.mockReturnValue(subscriptionEvent);

      // Mock Firestore query results
      const mockUserDoc = {
        id: 'test-user-id',
        exists: true,
        data: () => ({ stripeCustomerId: 'cus_123456', subscriptionId: 'sub_123456' }),
      };
      const mockUserSnapshot = {
        empty: false,
        docs: [mockUserDoc],
      };
      admin.firestore().collection().where().limit().get.mockResolvedValue(mockUserSnapshot);

      // Call the webhook handler
      await stripeWebhooks.stripeWebhook(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ received: true });

      // Verify Firestore operations
      expect(admin.firestore().collection).toHaveBeenCalledWith('users');
      expect(admin.firestore().collection().doc().collection().doc().update).toHaveBeenCalled();
    });
  });

  // Test ID: STRIPE-WEBHOOK-003
  describe('Subscription Canceled Webhook', () => {
    test('should handle subscription.deleted event', async () => {
      // Mock the webhook event
      const subscriptionEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123456',
            customer: 'cus_123456',
            status: 'canceled',
            canceled_at: Math.floor(Date.now() / 1000),
          },
        },
      };

      // Mock Stripe webhook verification
      stripe.webhooks.constructEvent.mockReturnValue(subscriptionEvent);

      // Mock Firestore query results
      const mockUserDoc = {
        id: 'test-user-id',
        exists: true,
        data: () => ({ stripeCustomerId: 'cus_123456', subscriptionId: 'sub_123456' }),
      };
      const mockUserSnapshot = {
        empty: false,
        docs: [mockUserDoc],
      };
      admin.firestore().collection().where().limit().get.mockResolvedValue(mockUserSnapshot);

      // Call the webhook handler
      await stripeWebhooks.stripeWebhook(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ received: true });

      // Verify Firestore operations
      expect(admin.firestore().collection).toHaveBeenCalledWith('users');
      expect(admin.firestore().collection().doc().collection().doc().update).toHaveBeenCalled();
      expect(admin.firestore().collection().doc().update).toHaveBeenCalled();
    });
  });

  // Test ID: STRIPE-WEBHOOK-004
  describe('Payment Failed Webhook', () => {
    test('should handle payment_intent.payment_failed event', async () => {
      // Mock the webhook event
      const paymentFailedEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_123456',
            customer: 'cus_123456',
            metadata: {
              type: 'one_time',
              userId: 'test-user-id',
              productId: 'weekend-pass',
            },
            last_payment_error: {
              message: 'Your card was declined',
            },
          },
        },
      };

      // Mock Stripe webhook verification
      stripe.webhooks.constructEvent.mockReturnValue(paymentFailedEvent);

      // Call the webhook handler
      await stripeWebhooks.stripeWebhook(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ received: true });

      // Verify Firestore operations
      expect(admin.firestore().collection).toHaveBeenCalledWith('users');
      expect(admin.firestore().collection().doc().collection().doc().update).toHaveBeenCalled();
      expect(admin.firestore().collection().doc().collection().add).toHaveBeenCalled();
    });
  });

  describe('Webhook Signature Verification', () => {
    test('should reject requests with missing signature', async () => {
      // Remove signature from request
      req.headers['stripe-signature'] = undefined;

      // Call the webhook handler
      await stripeWebhooks.stripeWebhook(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Missing Stripe signature');

      // Verify that no Firestore operations were performed
      expect(admin.firestore().collection).not.toHaveBeenCalled();
    });

    test('should reject requests with invalid signature', async () => {
      // Mock Stripe webhook verification to throw an error
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Call the webhook handler
      await stripeWebhooks.stripeWebhook(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Webhook Error: Invalid signature');

      // Verify that no Firestore operations were performed
      expect(admin.firestore().collection).not.toHaveBeenCalled();
    });
  });
});
