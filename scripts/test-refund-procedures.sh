#!/bin/bash

# Script to test refund procedures
# This script tests various refund scenarios using test API keys

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
CONFIG_DIR="./config"
TEST_DATA_DIR="./test-data"
RESULTS_DIR="./test-results/refunds"
STRIPE_CLI="stripe"
TEST_CUSTOMER_EMAIL="test@example.com"

# Display script header
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}        Test Refund Procedures           ${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo

# Parse command line arguments
MODE="all"
VERBOSE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --mode=*) MODE="${1#*=}" ;;
        --verbose) VERBOSE=true ;;
        --help) 
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --mode=TYPE    Test mode (full, partial, subscription, error, batch, all)"
            echo "  --verbose      Enable verbose output"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Create directories if they don't exist
mkdir -p "$CONFIG_DIR"
mkdir -p "$TEST_DATA_DIR"
mkdir -p "$RESULTS_DIR"

# Check for required tools
echo -e "${YELLOW}Checking for required tools...${NC}"

# Check for curl
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed. Please install curl and try again.${NC}"
    exit 1
fi

# Check for jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install jq and try again.${NC}"
    exit 1
fi

# Check for Stripe CLI (optional)
STRIPE_CLI_AVAILABLE=false
if command -v "$STRIPE_CLI" &> /dev/null; then
    STRIPE_CLI_AVAILABLE=true
    echo -e "${GREEN}Stripe CLI found. Will use it for testing.${NC}"
else
    echo -e "${YELLOW}Stripe CLI not found. Will use API calls directly.${NC}"
fi

# Function to get Stripe API key
get_stripe_api_key() {
    # Check if API key is already set
    if [ -n "$STRIPE_SECRET_KEY" ]; then
        return 0
    fi
    
    # Try to get from environment
    if [ -n "$STRIPE_TEST_SECRET_KEY" ]; then
        STRIPE_SECRET_KEY="$STRIPE_TEST_SECRET_KEY"
        return 0
    fi
    
    # Ask user for API key
    read -p "Enter your Stripe Test Secret Key: " STRIPE_SECRET_KEY
    
    # Verify it's a test key
    if [[ ! "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
        echo -e "${RED}Error: Please use a test secret key (starts with sk_test_).${NC}"
        echo -e "${RED}Using a production key could result in real charges and refunds!${NC}"
        STRIPE_SECRET_KEY=""
        return 1
    fi
    
    return 0
}

# Function to get PayPal credentials
get_paypal_credentials() {
    # Check if credentials are already set
    if [ -n "$PAYPAL_CLIENT_ID" ] && [ -n "$PAYPAL_SECRET" ]; then
        return 0
    fi
    
    # Try to get from environment
    if [ -n "$PAYPAL_SANDBOX_CLIENT_ID" ] && [ -n "$PAYPAL_SANDBOX_SECRET" ]; then
        PAYPAL_CLIENT_ID="$PAYPAL_SANDBOX_CLIENT_ID"
        PAYPAL_SECRET="$PAYPAL_SANDBOX_SECRET"
        return 0
    fi
    
    # Ask user for credentials
    read -p "Enter your PayPal Sandbox Client ID: " PAYPAL_CLIENT_ID
    read -p "Enter your PayPal Sandbox Secret: " PAYPAL_SECRET
    
    return 0
}

# Function to create a test payment with Stripe
create_stripe_test_payment() {
    local amount=$1
    local currency=${2:-usd}
    local description=${3:-"Test payment for refund testing"}
    
    echo -e "${YELLOW}Creating test payment with Stripe...${NC}"
    
    # Create a test customer if needed
    local customer_id=""
    local customer_response=$(curl -s -X GET \
        "https://api.stripe.com/v1/customers?email=$TEST_CUSTOMER_EMAIL&limit=1" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY")
    
    local has_customers=$(echo "$customer_response" | jq -r '.data | length')
    
    if [ "$has_customers" -eq 0 ]; then
        echo -e "${YELLOW}Creating test customer...${NC}"
        local create_customer_response=$(curl -s -X POST \
            "https://api.stripe.com/v1/customers" \
            -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
            -d "email=$TEST_CUSTOMER_EMAIL" \
            -d "name=Test Customer" \
            -d "description=Test customer for refund testing")
        
        customer_id=$(echo "$create_customer_response" | jq -r '.id')
        
        if [ -z "$customer_id" ] || [ "$customer_id" = "null" ]; then
            echo -e "${RED}Failed to create test customer.${NC}"
            echo "$create_customer_response"
            return 1
        fi
    else
        customer_id=$(echo "$customer_response" | jq -r '.data[0].id')
    fi
    
    echo -e "${YELLOW}Using customer: $customer_id${NC}"
    
    # Create a payment method
    local payment_method_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/payment_methods" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "type=card" \
        -d "card[number]=4242424242424242" \
        -d "card[exp_month]=12" \
        -d "card[exp_year]=2030" \
        -d "card[cvc]=123")
    
    local payment_method_id=$(echo "$payment_method_response" | jq -r '.id')
    
    if [ -z "$payment_method_id" ] || [ "$payment_method_id" = "null" ]; then
        echo -e "${RED}Failed to create payment method.${NC}"
        echo "$payment_method_response"
        return 1
    fi
    
    echo -e "${YELLOW}Using payment method: $payment_method_id${NC}"
    
    # Attach payment method to customer
    local attach_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/payment_methods/$payment_method_id/attach" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "customer=$customer_id")
    
    # Create a payment intent
    local payment_intent_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/payment_intents" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "amount=$amount" \
        -d "currency=$currency" \
        -d "customer=$customer_id" \
        -d "payment_method=$payment_method_id" \
        -d "description=$description" \
        -d "confirm=true" \
        -d "off_session=true")
    
    local payment_intent_id=$(echo "$payment_intent_response" | jq -r '.id')
    local payment_intent_status=$(echo "$payment_intent_response" | jq -r '.status')
    
    if [ -z "$payment_intent_id" ] || [ "$payment_intent_id" = "null" ]; then
        echo -e "${RED}Failed to create payment intent.${NC}"
        echo "$payment_intent_response"
        return 1
    fi
    
    if [ "$payment_intent_status" != "succeeded" ]; then
        echo -e "${RED}Payment intent not succeeded. Status: $payment_intent_status${NC}"
        echo "$payment_intent_response"
        return 1
    }
    
    echo -e "${GREEN}Successfully created payment: $payment_intent_id${NC}"
    
    # Save payment info to test data
    echo "{
        \"id\": \"$payment_intent_id\",
        \"amount\": $amount,
        \"currency\": \"$currency\",
        \"customer_id\": \"$customer_id\",
        \"payment_method_id\": \"$payment_method_id\",
        \"description\": \"$description\",
        \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }" > "$TEST_DATA_DIR/stripe_payment_$payment_intent_id.json"
    
    echo "$payment_intent_id"
}

# Function to process a Stripe refund
process_stripe_refund() {
    local payment_intent_id=$1
    local amount=$2
    local reason=${3:-requested_by_customer}
    
    echo -e "${YELLOW}Processing Stripe refund...${NC}"
    
    # Get payment details if amount is not specified
    if [ -z "$amount" ]; then
        local payment_info_file="$TEST_DATA_DIR/stripe_payment_$payment_intent_id.json"
        
        if [ -f "$payment_info_file" ]; then
            amount=$(jq -r '.amount' "$payment_info_file")
        else
            local payment_intent_response=$(curl -s -X GET \
                "https://api.stripe.com/v1/payment_intents/$payment_intent_id" \
                -H "Authorization: Bearer $STRIPE_SECRET_KEY")
            
            amount=$(echo "$payment_intent_response" | jq -r '.amount')
        fi
    fi
    
    # Process refund
    local refund_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/refunds" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "payment_intent=$payment_intent_id" \
        -d "amount=$amount" \
        -d "reason=$reason")
    
    local refund_id=$(echo "$refund_response" | jq -r '.id')
    local refund_status=$(echo "$refund_response" | jq -r '.status')
    
    if [ -z "$refund_id" ] || [ "$refund_id" = "null" ]; then
        echo -e "${RED}Failed to process refund.${NC}"
        echo "$refund_response"
        return 1
    fi
    
    echo -e "${GREEN}Successfully processed refund: $refund_id (Status: $refund_status)${NC}"
    
    # Save refund info to test data
    echo "{
        \"id\": \"$refund_id\",
        \"payment_intent_id\": \"$payment_intent_id\",
        \"amount\": $amount,
        \"reason\": \"$reason\",
        \"status\": \"$refund_status\",
        \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }" > "$TEST_DATA_DIR/stripe_refund_$refund_id.json"
    
    echo "$refund_id"
}

# Function to create a test subscription with Stripe
create_stripe_test_subscription() {
    local price_amount=$1
    local interval=${2:-month}
    
    echo -e "${YELLOW}Creating test subscription with Stripe...${NC}"
    
    # Create a test customer if needed
    local customer_id=""
    local customer_response=$(curl -s -X GET \
        "https://api.stripe.com/v1/customers?email=$TEST_CUSTOMER_EMAIL&limit=1" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY")
    
    local has_customers=$(echo "$customer_response" | jq -r '.data | length')
    
    if [ "$has_customers" -eq 0 ]; then
        echo -e "${YELLOW}Creating test customer...${NC}"
        local create_customer_response=$(curl -s -X POST \
            "https://api.stripe.com/v1/customers" \
            -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
            -d "email=$TEST_CUSTOMER_EMAIL" \
            -d "name=Test Customer" \
            -d "description=Test customer for subscription testing")
        
        customer_id=$(echo "$create_customer_response" | jq -r '.id')
        
        if [ -z "$customer_id" ] || [ "$customer_id" = "null" ]; then
            echo -e "${RED}Failed to create test customer.${NC}"
            echo "$create_customer_response"
            return 1
        fi
    else
        customer_id=$(echo "$customer_response" | jq -r '.data[0].id')
    fi
    
    echo -e "${YELLOW}Using customer: $customer_id${NC}"
    
    # Create a payment method
    local payment_method_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/payment_methods" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "type=card" \
        -d "card[number]=4242424242424242" \
        -d "card[exp_month]=12" \
        -d "card[exp_year]=2030" \
        -d "card[cvc]=123")
    
    local payment_method_id=$(echo "$payment_method_response" | jq -r '.id')
    
    if [ -z "$payment_method_id" ] || [ "$payment_method_id" = "null" ]; then
        echo -e "${RED}Failed to create payment method.${NC}"
        echo "$payment_method_response"
        return 1
    fi
    
    echo -e "${YELLOW}Using payment method: $payment_method_id${NC}"
    
    # Attach payment method to customer
    local attach_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/payment_methods/$payment_method_id/attach" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "customer=$customer_id")
    
    # Create a product
    local product_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/products" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "name=Test Subscription" \
        -d "description=Test subscription for refund testing")
    
    local product_id=$(echo "$product_response" | jq -r '.id')
    
    if [ -z "$product_id" ] || [ "$product_id" = "null" ]; then
        echo -e "${RED}Failed to create product.${NC}"
        echo "$product_response"
        return 1
    fi
    
    echo -e "${YELLOW}Created product: $product_id${NC}"
    
    # Create a price
    local price_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/prices" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "product=$product_id" \
        -d "unit_amount=$price_amount" \
        -d "currency=usd" \
        -d "recurring[interval]=$interval")
    
    local price_id=$(echo "$price_response" | jq -r '.id')
    
    if [ -z "$price_id" ] || [ "$price_id" = "null" ]; then
        echo -e "${RED}Failed to create price.${NC}"
        echo "$price_response"
        return 1
    fi
    
    echo -e "${YELLOW}Created price: $price_id${NC}"
    
    # Create a subscription
    local subscription_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/subscriptions" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "customer=$customer_id" \
        -d "items[0][price]=$price_id" \
        -d "default_payment_method=$payment_method_id")
    
    local subscription_id=$(echo "$subscription_response" | jq -r '.id')
    local subscription_status=$(echo "$subscription_response" | jq -r '.status')
    
    if [ -z "$subscription_id" ] || [ "$subscription_id" = "null" ]; then
        echo -e "${RED}Failed to create subscription.${NC}"
        echo "$subscription_response"
        return 1
    fi
    
    echo -e "${GREEN}Successfully created subscription: $subscription_id (Status: $subscription_status)${NC}"
    
    # Save subscription info to test data
    echo "{
        \"id\": \"$subscription_id\",
        \"customer_id\": \"$customer_id\",
        \"product_id\": \"$product_id\",
        \"price_id\": \"$price_id\",
        \"amount\": $price_amount,
        \"interval\": \"$interval\",
        \"status\": \"$subscription_status\",
        \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }" > "$TEST_DATA_DIR/stripe_subscription_$subscription_id.json"
    
    echo "$subscription_id"
}

# Function to cancel a Stripe subscription with refund
cancel_stripe_subscription() {
    local subscription_id=$1
    local prorate=${2:-true}
    
    echo -e "${YELLOW}Canceling Stripe subscription with refund...${NC}"
    
    # Cancel subscription
    local cancel_response=$(curl -s -X DELETE \
        "https://api.stripe.com/v1/subscriptions/$subscription_id" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "prorate=$prorate")
    
    local cancel_status=$(echo "$cancel_response" | jq -r '.status')
    
    if [ "$cancel_status" != "canceled" ]; then
        echo -e "${RED}Failed to cancel subscription.${NC}"
        echo "$cancel_response"
        return 1
    fi
    
    echo -e "${GREEN}Successfully canceled subscription: $subscription_id${NC}"
    
    # Check for invoice with refund
    if [ "$prorate" = "true" ]; then
        local invoices_response=$(curl -s -X GET \
            "https://api.stripe.com/v1/invoices?subscription=$subscription_id&limit=1" \
            -H "Authorization: Bearer $STRIPE_SECRET_KEY")
        
        local has_invoices=$(echo "$invoices_response" | jq -r '.data | length')
        
        if [ "$has_invoices" -gt 0 ]; then
            local invoice_id=$(echo "$invoices_response" | jq -r '.data[0].id')
            local amount_refunded=$(echo "$invoices_response" | jq -r '.data[0].amount_refunded')
            
            if [ "$amount_refunded" -gt 0 ]; then
                echo -e "${GREEN}Subscription cancellation generated a refund of $amount_refunded cents on invoice $invoice_id${NC}"
            else
                echo -e "${YELLOW}No refund was generated for subscription cancellation.${NC}"
            fi
        else
            echo -e "${YELLOW}No invoices found for subscription.${NC}"
        }
    fi
    
    # Save cancellation info to test data
    echo "{
        \"subscription_id\": \"$subscription_id\",
        \"status\": \"$cancel_status\",
        \"prorate\": $prorate,
        \"canceled_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }" > "$TEST_DATA_DIR/stripe_subscription_cancel_$subscription_id.json"
    
    return 0
}

# Function to run full refund test
run_full_refund_test() {
    echo -e "${YELLOW}Running full refund test...${NC}"
    
    # Get Stripe API key
    get_stripe_api_key || return 1
    
    # Create a test payment
    local payment_id=$(create_stripe_test_payment 2000)
    
    if [ -z "$payment_id" ]; then
        echo -e "${RED}Failed to create test payment.${NC}"
        return 1
    fi
    
    # Process a full refund
    local refund_id=$(process_stripe_refund "$payment_id")
    
    if [ -z "$refund_id" ]; then
        echo -e "${RED}Failed to process refund.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Full refund test completed successfully!${NC}"
    return 0
}

# Function to run partial refund test
run_partial_refund_test() {
    echo -e "${YELLOW}Running partial refund test...${NC}"
    
    # Get Stripe API key
    get_stripe_api_key || return 1
    
    # Create a test payment
    local payment_id=$(create_stripe_test_payment 5000)
    
    if [ -z "$payment_id" ]; then
        echo -e "${RED}Failed to create test payment.${NC}"
        return 1
    fi
    
    # Process a partial refund (50%)
    local refund_id=$(process_stripe_refund "$payment_id" 2500)
    
    if [ -z "$refund_id" ]; then
        echo -e "${RED}Failed to process partial refund.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Partial refund test completed successfully!${NC}"
    return 0
}

# Function to run subscription refund test
run_subscription_refund_test() {
    echo -e "${YELLOW}Running subscription refund test...${NC}"
    
    # Get Stripe API key
    get_stripe_api_key || return 1
    
    # Create a test subscription
    local subscription_id=$(create_stripe_test_subscription 3000)
    
    if [ -z "$subscription_id" ]; then
        echo -e "${RED}Failed to create test subscription.${NC}"
        return 1
    fi
    
    # Wait a moment for subscription to be fully processed
    echo -e "${YELLOW}Waiting for subscription to be processed...${NC}"
    sleep 5
    
    # Cancel subscription with prorated refund
    cancel_stripe_subscription "$subscription_id" true
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to cancel subscription with refund.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Subscription refund test completed successfully!${NC}"
    return 0
}

# Function to run error handling test
run_error_handling_test() {
    echo -e "${YELLOW}Running error handling test...${NC}"
    
    # Get Stripe API key
    get_stripe_api_key || return 1
    
    # Create a test payment
    local payment_id=$(create_stripe_test_payment 1000)
    
    if [ -z "$payment_id" ]; then
        echo -e "${RED}Failed to create test payment.${NC}"
        return 1
    fi
    
    # Process a refund
    local refund_id=$(process_stripe_refund "$payment_id")
    
    if [ -z "$refund_id" ]; then
        echo -e "${RED}Failed to process first refund.${NC}"
        return 1
    fi
    
    # Try to refund the same payment again (should fail)
    echo -e "${YELLOW}Attempting to refund the same payment again (expected to fail)...${NC}"
    local second_refund_response=$(curl -s -X POST \
        "https://api.stripe.com/v1/refunds" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
        -d "payment_intent=$payment_id")
    
    local error_message=$(echo "$second_refund_response" | jq -r '.error.message')
    
    if [ -z "$error_message" ] || [ "$error_message" = "null" ]; then
        echo -e "${RED}Expected an error but got success. This is unexpected.${NC}"
        echo "$second_refund_response"
        return 1
    fi
    
    echo -e "${GREEN}Error handling test completed successfully!${NC}"
    echo -e "${GREEN}Received expected error: $error_message${NC}"
    return 0
}

# Function to run batch refund test
run_batch_refund_test() {
    echo -e "${YELLOW}Running batch refund test...${NC}"
    
    # Get Stripe API key
    get_stripe_api_key || return 1
    
    # Create multiple test payments
    echo -e "${YELLOW}Creating multiple test payments...${NC}"
    local payment_ids=()
    
    for i in {1..3}; do
        local payment_id=$(create_stripe_test_payment $((1000 + i * 500)))
        
        if [ -z "$payment_id" ]; then
            echo -e "${RED}Failed to create test payment $i.${NC}"
            continue
        fi
        
        payment_ids+=("$payment_id")
    done
    
    if [ ${#payment_ids[@]} -eq 0 ]; then
        echo -e "${RED}Failed to create any test payments.${NC}"
        return 1
    fi
    
    # Process batch refunds
    echo -e "${YELLOW}Processing batch refunds...${NC}"
    local refund_ids=()
    
    for payment_id in "${payment_ids[@]}"; do
        local refund_id=$(process_stripe_refund "$payment_id")
        
        if [ -z "$refund_id" ]; then
            echo -e "${RED}Failed to process refund for payment $payment_id.${NC}"
            continue
        fi
        
        refund_ids+=("$refund_id")
    done
    
    # Report results
    echo -e "${GREEN}Batch refund test completed!${NC}"
    echo -e "${GREEN}Successfully processed ${#refund_ids[@]} out of ${#payment_ids[@]} refunds.${NC}"
    
    if [ ${#refund_ids[@]} -eq ${#payment_ids[@]} ]; then
        return 0
    else
        return 1
    fi
}

# Main function to run tests
run_tests() {
    local success=true
    
    # Create test results directory with timestamp
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local test_dir="$RESULTS_DIR/$timestamp"
    mkdir -p "$test_dir"
    
    # Start test report
    echo "# Refund Procedures Test Report" > "$test_dir/report.md"
    echo "Generated: $(date)" >> "$test_dir/report.md"
    echo "" >> "$test_dir/report.md"
    echo "## Test Results" >> "$test_dir/report.md"
    echo "" >> "$test_dir/report.md"
    
    # Run selected tests
    if [ "$MODE" = "all" ] || [ "$MODE" = "full" ]; then
        echo -e "\n${YELLOW}=== Full Refund Test ===${NC}\n"
        if run_full_refund_test; then
            echo "- ✅ Full Refund Test: Passed" >> "$test_dir/report.md"
        else
            echo "- ❌ Full Refund Test: Failed" >> "$test_dir/report.md"
            success=false
        fi
    fi
    
    if [ "$MODE" = "all" ] || [ "$MODE" = "partial" ]; then
        echo -e "\n${YELLOW}=== Partial Refund Test ===${NC}\n"
        if run_partial_refund_test; then
            echo "- ✅ Partial Refund Test: Passed" >> "$test_dir/report.md"
        else
            echo "- ❌ Partial Refund Test: Failed" >> "$test_dir/report.md"
            success=false
        fi
    fi
    
    if [ "$MODE" = "all" ] || [ "$MODE" = "subscription" ]; then
        echo -e "\n${YELLOW}=== Subscription Refund Test ===${NC}\n"
        if run_subscription_refund_test; then
            echo "- ✅ Subscription Refund Test: Passed" >> "$test_dir/report.md"
        else
            echo "- ❌ Subscription Refund Test: Failed" >> "$test_dir/report.md"
            success=false
        fi
    fi
    
    if [ "$MODE" = "all" ] || [ "$MODE" = "error" ]; then
        echo -e "\n${YELLOW}=== Error Handling Test ===${NC}\n"
        if run_error_handling_test; then
            echo "- ✅ Error Handling Test: Passed" >> "$test_dir/report.md"
        else
            echo "- ❌ Error Handling Test: Failed" >> "$test_dir/report.md"
            success=false
        fi
    fi
    
    if [ "$MODE" = "all" ] || [ "$MODE" = "batch" ]; then
        echo -e "\n${YELLOW}=== Batch Refund Test ===${NC}\n"
        if run_batch_refund_test; then
            echo "- ✅ Batch Refund Test: Passed" >> "$test_dir/report.md"
        else
            echo "- ❌ Batch Refund Test: Failed" >> "$test_dir/report.md"
            success=false
        fi
    fi
    
    # Copy test data to results directory
    if [ -d "$TEST_DATA_DIR" ] && [ "$(ls -A "$TEST_DATA_DIR")" ]; then
        mkdir -p "$test_dir/data"
        cp "$TEST_DATA_DIR"/* "$test_dir/data/"
    fi
    
    # Finalize report
    echo "" >> "$test_dir/report.md"
    echo "## Summary" >> "$test_dir/report.md"
    
    if [ "$success" = true ]; then
        echo "" >> "$test_dir/report.md"
        echo "All tests completed successfully! ✅" >> "$test_dir/report.md"
        echo -e "\n${GREEN}All tests completed successfully! ✅${NC}\n"
    else
        echo "" >> "$test_dir/report.md"
        echo "Some tests failed. Please check the report for details. ❌" >> "$test_dir/report.md"
        echo -e "\n${RED}Some tests failed. Please check the report for details. ❌${NC}\n"
    fi
    
    echo "Test report saved to: $test_dir/report.md"
}

# Run the tests
run_tests