#!/usr/bin/env bash
# CreatorTrack - Automated Backend Setup Script
# Run after filling in your credentials below.
#
# Usage: bash setup.sh
# ─────────────────────────────────────────────────────────────

set -e

# ── 1. CREDENTIALS ────────────────────────────────────────────
# Fill these in before running. Get them from the URLs listed.

SUPABASE_ACCESS_TOKEN=""   # supabase.com → Account → Access Tokens
SUPABASE_ORG_ID=""         # supabase.com/dashboard/org (in the URL)
SUPABASE_DB_PASSWORD=""    # Choose a strong password for your DB
SUPABASE_REGION="us-east-1"

STRIPE_SECRET_KEY=""       # dashboard.stripe.com → Developers → API keys
STRIPE_PRICE_ID=""         # Create a $19.99/month price → copy its ID

VERCEL_APP_URL="https://creatortrack-vert.vercel.app"

# ─────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CreatorTrack Backend Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 2. SUPABASE PROJECT ───────────────────────────────────────
if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_ORG_ID" ]; then
  echo "⚠  Supabase credentials not set — skipping project creation."
  echo "   → Set SUPABASE_ACCESS_TOKEN and SUPABASE_ORG_ID in this script."
else
  echo "Creating Supabase project..."
  SUPA_RESPONSE=$(curl -s -X POST "https://api.supabase.com/v1/projects" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"organization_id\": \"$SUPABASE_ORG_ID\",
      \"name\": \"creatortrack\",
      \"db_pass\": \"$SUPABASE_DB_PASSWORD\",
      \"region\": \"$SUPABASE_REGION\"
    }")

  SUPA_PROJECT_ID=$(echo "$SUPA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "✓ Project created: $SUPA_PROJECT_ID"
  echo "  Waiting 30s for DB to be ready..."
  sleep 30

  # Get API keys
  SUPA_KEYS=$(curl -s "https://api.supabase.com/v1/projects/$SUPA_PROJECT_ID/api-keys" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN")

  SUPA_ANON_KEY=$(echo "$SUPA_KEYS" | grep -o '"anon":"[^"]*"' | cut -d'"' -f4)
  SUPA_SERVICE_KEY=$(echo "$SUPA_KEYS" | grep -o '"service_role":"[^"]*"' | cut -d'"' -f4)
  SUPA_URL="https://$SUPA_PROJECT_ID.supabase.co"

  echo "✓ Supabase URL: $SUPA_URL"
  echo "✓ Anon key retrieved"

  # Run SQL schema
  echo "Running database schema..."
  curl -s -X POST "https://api.supabase.com/v1/projects/$SUPA_PROJECT_ID/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(cat supabase/schema.sql | jq -Rs .)}" > /dev/null
  echo "✓ Schema applied"

  # Update Vercel env vars with real Supabase values
  echo "Updating Vercel environment variables..."
  echo "$SUPA_URL"          | npx vercel env rm VITE_SUPABASE_URL      production --yes 2>/dev/null; echo "$SUPA_URL"          | npx vercel env add VITE_SUPABASE_URL      production --yes
  echo "$SUPA_ANON_KEY"     | npx vercel env rm VITE_SUPABASE_ANON_KEY production --yes 2>/dev/null; echo "$SUPA_ANON_KEY"     | npx vercel env add VITE_SUPABASE_ANON_KEY production --yes
  echo "$SUPA_SERVICE_KEY"  | npx vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes 2>/dev/null; echo "$SUPA_SERVICE_KEY"  | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes
  echo "✓ Supabase env vars updated in Vercel"

  # Write to local .env for dev
  cat > .env << EOF
VITE_SUPABASE_URL=$SUPA_URL
VITE_SUPABASE_ANON_KEY=$SUPA_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPA_SERVICE_KEY
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
APP_URL=http://localhost:5173
EOF
  echo "✓ Local .env updated"
fi

# ── 3. STRIPE PRICE (if key provided) ────────────────────────
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo ""
  echo "⚠  Stripe key not set — skipping price creation."
  echo "   → Set STRIPE_SECRET_KEY in this script."
else
  echo ""
  echo "Setting up Stripe product & price..."

  # Create product
  PRODUCT=$(curl -s -X POST "https://api.stripe.com/v1/products" \
    -u "$STRIPE_SECRET_KEY:" \
    -d "name=CreatorTrack Pro" \
    -d "description=Full access to all CreatorTrack analytics features")
  PRODUCT_ID=$(echo "$PRODUCT" | grep -o '"id": *"[^"]*"' | head -1 | cut -d'"' -f4)

  # Create price
  PRICE=$(curl -s -X POST "https://api.stripe.com/v1/prices" \
    -u "$STRIPE_SECRET_KEY:" \
    -d "product=$PRODUCT_ID" \
    -d "unit_amount=1999" \
    -d "currency=usd" \
    -d "recurring[interval]=month")
  PRICE_ID=$(echo "$PRICE" | grep -o '"id": *"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "✓ Stripe price created: $PRICE_ID"

  # Get publishable key
  STRIPE_PUB_KEY=$(curl -s "https://api.stripe.com/v1/accounts" \
    -u "$STRIPE_SECRET_KEY:" | grep -o '"publishable_key":"[^"]*"' | cut -d'"' -f4 || echo "pk_live_...")

  # Create webhook endpoint
  WEBHOOK=$(curl -s -X POST "https://api.stripe.com/v1/webhook_endpoints" \
    -u "$STRIPE_SECRET_KEY:" \
    -d "url=${VERCEL_APP_URL}/api/stripe-webhook" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "enabled_events[]=customer.subscription.deleted" \
    -d "enabled_events[]=customer.subscription.paused")
  WEBHOOK_SECRET=$(echo "$WEBHOOK" | grep -o '"secret":"[^"]*"' | cut -d'"' -f4)
  echo "✓ Stripe webhook created"

  # Update Vercel env vars
  echo "$STRIPE_PUB_KEY"  | npx vercel env rm VITE_STRIPE_PUBLISHABLE_KEY production --yes 2>/dev/null; echo "$STRIPE_PUB_KEY"  | npx vercel env add VITE_STRIPE_PUBLISHABLE_KEY production --yes
  echo "$STRIPE_SECRET_KEY" | npx vercel env rm STRIPE_SECRET_KEY          production --yes 2>/dev/null; echo "$STRIPE_SECRET_KEY" | npx vercel env add STRIPE_SECRET_KEY          production --yes
  echo "$WEBHOOK_SECRET"  | npx vercel env rm STRIPE_WEBHOOK_SECRET       production --yes 2>/dev/null; echo "$WEBHOOK_SECRET"  | npx vercel env add STRIPE_WEBHOOK_SECRET       production --yes
  echo "$PRICE_ID"        | npx vercel env rm STRIPE_PRICE_ID             production --yes 2>/dev/null; echo "$PRICE_ID"        | npx vercel env add STRIPE_PRICE_ID             production --yes
  echo "✓ Stripe env vars updated in Vercel"

  # Append to .env
  sed -i "s|VITE_STRIPE_PUBLISHABLE_KEY=|VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUB_KEY|" .env
  sed -i "s|STRIPE_SECRET_KEY=|STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY|" .env
  sed -i "s|STRIPE_WEBHOOK_SECRET=|STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET|" .env
  sed -i "s|STRIPE_PRICE_ID=|STRIPE_PRICE_ID=$PRICE_ID|" .env
fi

# ── 4. REDEPLOY WITH REAL ENV VARS ────────────────────────────
echo ""
echo "Redeploying to Vercel with updated env vars..."
npx vercel --yes --prod 2>&1 | tail -3
echo "✓ Redeployed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete!"
echo "  Live URL: $VERCEL_APP_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Sign up at ${VERCEL_APP_URL}/signup"
echo "  2. Complete onboarding"
echo "  3. Test Stripe by subscribing at ${VERCEL_APP_URL}/pricing"
