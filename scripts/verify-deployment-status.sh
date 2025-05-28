#!/bin/bash

echo "🔍 CHECKING STRIPE EXTENSION DEPLOYMENT STATUS..."
echo ""

# Test webhook endpoint
echo "📡 Testing webhook endpoint..."
WEBHOOK_URL="https://us-central1-ai-sports-edge.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" --max-time 10)
echo "Webhook status: $RESPONSE"

if [ "$RESPONSE" = "404" ]; then
    echo "❌ Webhook endpoint not found (404)"
    echo ""
    echo "🔧 POSSIBLE ISSUES:"
    echo "  1. Firebase Stripe Extension not installed"
    echo "  2. Functions deployment incomplete"
    echo "  3. Project authentication needed"
    echo ""
    echo "✅ SOLUTIONS:"
    echo "  1. Install extension: Firebase Console → Extensions → Stripe"
    echo "  2. Re-run: firebase deploy --only functions"
    echo "  3. Check: firebase functions:list"
    echo ""
elif [ "$RESPONSE" = "405" ] || [ "$RESPONSE" = "200" ]; then
    echo "✅ Webhook endpoint is ACTIVE!"
    echo "🎉 Stripe Extension is working!"
    echo ""
    echo "💰 READY FOR REVENUE:"
    echo "  - Insight: $19.99/month"
    echo "  - Analyst: $74.99/month" 
    echo "  - Edge Collective: $189.99/month"
    echo ""
else
    echo "⚠️  Webhook returned status: $RESPONSE"
    echo "   (May still be initializing...)"
fi

echo ""
echo "🧪 MANUAL VERIFICATION COMMANDS:"
echo "  firebase functions:list --project ai-sports-edge"
echo "  firebase ext:list --project ai-sports-edge"
echo ""

# Test base functions URL
echo "🌐 Testing base functions URL..."
BASE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://us-central1-ai-sports-edge.cloudfunctions.net/" --max-time 5)
echo "Base functions status: $BASE_RESPONSE"

echo ""
echo "📋 NEXT STEPS:"
if [ "$RESPONSE" = "404" ]; then
    echo "  🔄 Extension installation needed"
    echo "  📝 Follow: Firebase Console → Extensions → Install Stripe"
else
    echo "  🧪 Test subscription creation"
    echo "  📊 Monitor first transactions"
    echo "  🎯 Go live with subscriptions!"
fi