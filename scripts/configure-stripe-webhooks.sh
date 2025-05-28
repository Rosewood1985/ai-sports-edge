#!/bin/bash

# Stripe Webhook Configuration Script
# Configures webhooks for Firebase Stripe Extension

echo "🚀 Configuring Stripe Webhooks for Firebase Extension..."

# Check if Firebase project is configured
if ! firebase use --active >/dev/null 2>&1; then
    echo "❌ No active Firebase project. Please run 'firebase use <project-id>' first."
    exit 1
fi

PROJECT_ID=$(firebase use --active)
echo "📋 Active Firebase project: $PROJECT_ID"

# Generate webhook URL
WEBHOOK_URL="https://us-central1-$PROJECT_ID.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents"

echo "🔗 Webhook URL: $WEBHOOK_URL"

# Required webhook events
WEBHOOK_EVENTS=(
    "customer.subscription.created"
    "customer.subscription.updated"
    "customer.subscription.deleted"
    "customer.subscription.trial_will_end"
    "invoice.payment_succeeded"
    "invoice.payment_failed"
    "checkout.session.completed"
    "checkout.session.expired"
    "payment_intent.succeeded"
    "payment_intent.payment_failed"
    "customer.created"
    "customer.updated"
    "customer.deleted"
)

echo "📡 Required webhook events:"
for event in "${WEBHOOK_EVENTS[@]}"; do
    echo "  - $event"
done

echo ""
echo "🔧 MANUAL CONFIGURATION REQUIRED:"
echo ""
echo "1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks"
echo "2. Click 'Add endpoint'"
echo "3. Enter webhook URL: $WEBHOOK_URL"
echo "4. Select the following events:"
for event in "${WEBHOOK_EVENTS[@]}"; do
    echo "   ✓ $event"
done
echo ""
echo "5. Click 'Add endpoint'"
echo "6. Copy the webhook signing secret (whsec_...)"
echo "7. Add the webhook secret to Firebase extension configuration"
echo ""

# Product configuration reminder
echo "💰 PRODUCT CONFIGURATION:"
echo ""
echo "Configured Price IDs:"
echo "  - Insight: price_1RTpnOBpGzv2zgRcutbfCICB (\$19.99/month)"
echo "  - Analyst: price_1RTpnpBpGzv2zgRccFtbSsgl (\$74.99/month)"
echo "  - Edge Collective: price_1RTpomBpGzv2zgRc72MCfG7F (\$189.99/month)"
echo ""

# Extension installation command
echo "🏗️  EXTENSION INSTALLATION:"
echo ""
echo "Run this command to install the Stripe extension:"
echo "firebase ext:install stripe/firestore-stripe-payments --project=$PROJECT_ID"
echo ""

# Configuration parameters
echo "⚙️  EXTENSION CONFIGURATION PARAMETERS:"
echo ""
echo "When prompted, use these values:"
echo "  - Stripe secret key: [Your Stripe secret key]"
echo "  - Stripe publishable key: [Your Stripe publishable key]"
echo "  - Customers collection: customers"
echo "  - Products collection: products"
echo "  - Sync users on create: true"
echo "  - Delete Stripe customers on user delete: false"
echo "  - Automatic tax: true"
echo "  - Webhook secret: [Copy from Stripe webhook endpoint]"
echo ""

echo "✅ Configuration script completed!"
echo "📖 See docs/stripe-extension-setup-guide.md for detailed instructions"