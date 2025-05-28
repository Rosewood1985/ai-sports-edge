#!/bin/bash

# Production Stripe Deployment Script
echo "🚀 DEPLOYING PRODUCTION STRIPE SYSTEM..."

# Set production Stripe keys
echo "🔑 Setting production Stripe configuration..."

# IMPORTANT: Run these commands in your local terminal after firebase login
echo "📋 PRODUCTION DEPLOYMENT COMMANDS:"
echo ""
echo "# 1. Authenticate with Firebase"
echo "firebase login"
echo ""
echo "# 2. Set project"
echo "firebase use ai-sports-edge"
echo ""
echo "# 3. Configure production Stripe keys"
echo 'firebase functions:config:set stripe.secret_key="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"'
echo ""
echo 'firebase functions:config:set stripe.publishable_key="pk_live_51QBJC5BpGzv2zgRc0lCirOmVAvzlEH99fgrXWQEyz5sr5M4nB8SdtboiiWxSZhhpQ3NlHOfoDRL0P4Z5JT55Ul5100nJBJBzps"'
echo ""
echo 'firebase functions:config:set stripe.webhook_secret="whsec_vNjLLOjktvRWuayucCFJlULWgNoUvnhV"'
echo ""
echo "# 4. Deploy functions with production keys"
echo "firebase deploy --only functions"
echo ""
echo "# 5. Verify deployment"
echo "firebase functions:list"
echo ""
echo "# 6. Test webhook endpoint"
echo "curl -I https://us-central1-ai-sports-edge.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents"
echo ""

echo "💰 PRODUCTION REVENUE TIERS:"
echo "  ✅ Insight: $19.99/month (price_1RTpnOBpGzv2zgRcutbfCICB)"
echo "  ✅ Analyst: $74.99/month (price_1RTpnpBpGzv2zgRccFtbSsgl)" 
echo "  ✅ Edge Collective: $189.99/month (price_1RTpomBpGzv2zgRc72MCfG7F)"
echo ""

echo "🎯 AFTER DEPLOYMENT:"
echo "  - Live subscription processing"
echo "  - Real-time webhook sync"
echo "  - Production revenue generation"
echo ""

echo "⚠️  IMPORTANT: These are LIVE STRIPE KEYS"
echo "     All transactions will be real money!"
echo ""

echo "🚀 Ready to go live with subscription revenue!"