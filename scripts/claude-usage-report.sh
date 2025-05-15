#!/bin/bash

# Claude Usage Report Script
# This script generates a report of Claude 3.7 usage and costs

# Default values
MONTH=$(date +"%Y-%m")
OUTPUT_FORMAT="text"
OUTPUT_FILE=""
SLACK_WEBHOOK=""
EMAIL=""
DETAILED=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --month) MONTH="$2"; shift 2 ;;
    --format) OUTPUT_FORMAT="$2"; shift 2 ;;
    --output) OUTPUT_FILE="$2"; shift 2 ;;
    --slack) SLACK_WEBHOOK="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --detailed) DETAILED=true; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

# Validate month format
if ! [[ $MONTH =~ ^[0-9]{4}-[0-9]{2}$ ]]; then
  echo "Error: Month must be in YYYY-MM format"
  exit 1
fi

# Validate output format
if [[ "$OUTPUT_FORMAT" != "text" && "$OUTPUT_FORMAT" != "json" && "$OUTPUT_FORMAT" != "csv" && "$OUTPUT_FORMAT" != "html" ]]; then
  echo "Error: Output format must be one of: text, json, csv, html"
  exit 1
fi

# Firebase project ID
FIREBASE_PROJECT_ID="ai-sports-edge"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
  echo "Error: Firebase CLI is not installed"
  echo "Please install it with: npm install -g firebase-tools"
  exit 1
fi

# Check if jq is installed (for JSON processing)
if ! command -v jq &> /dev/null; then
  echo "Error: jq is not installed"
  echo "Please install it with: brew install jq (macOS) or apt-get install jq (Linux)"
  exit 1
fi

# Check if Firebase is logged in
FIREBASE_AUTH_STATUS=$(firebase auth:export --json 2>&1)
if [[ $FIREBASE_AUTH_STATUS == *"Error:"* ]]; then
  echo "Error: Not logged in to Firebase"
  echo "Please login with: firebase login"
  exit 1
fi

echo "🔍 Generating Claude usage report for $MONTH..."

# Create a temporary file for the Firestore query
TEMP_QUERY_FILE=$(mktemp)

# Write the Firestore query to get global usage stats
cat > $TEMP_QUERY_FILE << EOL
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getUsageStats() {
  try {
    // Get global stats
    const globalStatsDoc = await db.collection('claudeUsage').doc('global').get();
    
    if (!globalStatsDoc.exists) {
      console.log(JSON.stringify({ error: 'No usage data found' }));
      process.exit(1);
    }
    
    const stats = globalStatsDoc.data();
    const monthlyStats = stats.monthly || {};
    const currentMonthStats = monthlyStats['$MONTH'] || {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      requestsByType: {},
      tokensByType: {},
      costByType: {}
    };
    
    // Get cache stats
    const cacheStatsDoc = await db.collection('claudeUsage').doc('cache_stats').get();
    
    let cacheHitRate = 0;
    
    if (cacheStatsDoc.exists) {
      const cacheStats = cacheStatsDoc.data();
      const hits = cacheStats.hits || {};
      const total = cacheStats.total || {};
      
      // Calculate cache hit rate
      let totalHits = 0;
      let totalRequests = 0;
      
      Object.values(hits).forEach(count => {
        totalHits += count;
      });
      
      Object.values(total).forEach(count => {
        totalRequests += count;
      });
      
      cacheHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    }
    
    // Get top users if detailed report is requested
    let topUsers = [];
    
    if ($DETAILED) {
      const usersSnapshot = await db.collection('claudeUsage')
        .where('monthly.$MONTH', '!=', null)
        .orderBy('monthly.$MONTH.totalCost', 'desc')
        .limit(10)
        .get();
      
      topUsers = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        return {
          userId: doc.id,
          totalRequests: userData.monthly['$MONTH'].totalRequests || 0,
          totalTokens: userData.monthly['$MONTH'].totalTokens || 0,
          totalCost: userData.monthly['$MONTH'].totalCost || 0
        };
      });
    }
    
    // Return the report data
    console.log(JSON.stringify({
      month: '$MONTH',
      ...currentMonthStats,
      cacheHitRate,
      topUsers: $DETAILED ? topUsers : []
    }));
  } catch (error) {
    console.log(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}

getUsageStats();
EOL

# Replace $MONTH and $DETAILED in the query file
sed -i '' "s/\$MONTH/$MONTH/g" $TEMP_QUERY_FILE
sed -i '' "s/\$DETAILED/$DETAILED/g" $TEMP_QUERY_FILE

# Create a temporary directory for the Firebase service account key
TEMP_DIR=$(mktemp -d)

# Export the Firebase service account key
firebase projects:sdkconfig web --project $FIREBASE_PROJECT_ID > $TEMP_DIR/firebase-config.json

# Extract the service account key from the Firebase config
jq '.serviceAccount' $TEMP_DIR/firebase-config.json > $TEMP_DIR/serviceAccountKey.json

# Run the Firestore query
REPORT_JSON=$(node $TEMP_QUERY_FILE)

# Check if the query was successful
if [[ $REPORT_JSON == *"error"* ]]; then
  echo "Error: Failed to get usage data"
  echo $REPORT_JSON | jq .
  exit 1
fi

# Generate the report in the requested format
if [[ "$OUTPUT_FORMAT" == "json" ]]; then
  # JSON format
  REPORT=$REPORT_JSON
elif [[ "$OUTPUT_FORMAT" == "csv" ]]; then
  # CSV format
  REPORT="Month,Total Requests,Total Tokens,Total Cost,Cache Hit Rate\n"
  REPORT+="$MONTH,$(echo $REPORT_JSON | jq -r '.totalRequests'),$(echo $REPORT_JSON | jq -r '.totalTokens'),$(echo $REPORT_JSON | jq -r '.totalCost'),$(echo $REPORT_JSON | jq -r '.cacheHitRate')\n\n"
  
  REPORT+="Request Type,Requests,Tokens,Cost\n"
  for type in $(echo $REPORT_JSON | jq -r '.requestsByType | keys[]'); do
    REPORT+="$type,$(echo $REPORT_JSON | jq -r ".requestsByType[\"$type\"]"),$(echo $REPORT_JSON | jq -r ".tokensByType[\"$type\"]"),$(echo $REPORT_JSON | jq -r ".costByType[\"$type\"]")\n"
  done
  
  if [[ "$DETAILED" == "true" ]]; then
    REPORT+="\nTop Users\n"
    REPORT+="User ID,Requests,Tokens,Cost\n"
    for i in $(seq 0 $(echo $REPORT_JSON | jq -r '.topUsers | length - 1')); do
      REPORT+="$(echo $REPORT_JSON | jq -r ".topUsers[$i].userId"),$(echo $REPORT_JSON | jq -r ".topUsers[$i].totalRequests"),$(echo $REPORT_JSON | jq -r ".topUsers[$i].totalTokens"),$(echo $REPORT_JSON | jq -r ".topUsers[$i].totalCost")\n"
    done
  fi
elif [[ "$OUTPUT_FORMAT" == "html" ]]; then
  # HTML format
  REPORT="<!DOCTYPE html>
<html>
<head>
  <title>Claude Usage Report - $MONTH</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .summary { margin-bottom: 30px; }
    .cost { font-weight: bold; color: #d9534f; }
  </style>
</head>
<body>
  <h1>Claude Usage Report - $MONTH</h1>
  
  <div class='summary'>
    <h2>Summary</h2>
    <table>
      <tr>
        <th>Total Requests</th>
        <th>Total Tokens</th>
        <th>Total Cost</th>
        <th>Cache Hit Rate</th>
      </tr>
      <tr>
        <td>$(echo $REPORT_JSON | jq -r '.totalRequests')</td>
        <td>$(echo $REPORT_JSON | jq -r '.totalTokens')</td>
        <td class='cost'>$$(echo $REPORT_JSON | jq -r '.totalCost')</td>
        <td>$(echo $REPORT_JSON | jq -r '.cacheHitRate * 100')%</td>
      </tr>
    </table>
  </div>
  
  <div class='by-type'>
    <h2>Usage by Request Type</h2>
    <table>
      <tr>
        <th>Request Type</th>
        <th>Requests</th>
        <th>Tokens</th>
        <th>Cost</th>
      </tr>"
  
  for type in $(echo $REPORT_JSON | jq -r '.requestsByType | keys[]'); do
    REPORT+="
      <tr>
        <td>$type</td>
        <td>$(echo $REPORT_JSON | jq -r ".requestsByType[\"$type\"]")</td>
        <td>$(echo $REPORT_JSON | jq -r ".tokensByType[\"$type\"]")</td>
        <td class='cost'>$$(echo $REPORT_JSON | jq -r ".costByType[\"$type\"]")</td>
      </tr>"
  done
  
  REPORT+="
    </table>
  </div>"
  
  if [[ "$DETAILED" == "true" ]]; then
    REPORT+="
  <div class='top-users'>
    <h2>Top Users</h2>
    <table>
      <tr>
        <th>User ID</th>
        <th>Requests</th>
        <th>Tokens</th>
        <th>Cost</th>
      </tr>"
    
    for i in $(seq 0 $(echo $REPORT_JSON | jq -r '.topUsers | length - 1')); do
      REPORT+="
      <tr>
        <td>$(echo $REPORT_JSON | jq -r ".topUsers[$i].userId")</td>
        <td>$(echo $REPORT_JSON | jq -r ".topUsers[$i].totalRequests")</td>
        <td>$(echo $REPORT_JSON | jq -r ".topUsers[$i].totalTokens")</td>
        <td class='cost'>$$(echo $REPORT_JSON | jq -r ".topUsers[$i].totalCost")</td>
      </tr>"
    done
    
    REPORT+="
    </table>
  </div>"
  fi
  
  REPORT+="
</body>
</html>"
else
  # Text format (default)
  REPORT="# Claude Usage Report - $MONTH\n\n"
  
  REPORT+="## Summary\n\n"
  REPORT+="- Total Requests: $(echo $REPORT_JSON | jq -r '.totalRequests')\n"
  REPORT+="- Total Tokens: $(echo $REPORT_JSON | jq -r '.totalTokens')\n"
  REPORT+="- Total Cost: $$(echo $REPORT_JSON | jq -r '.totalCost')\n"
  REPORT+="- Cache Hit Rate: $(echo $REPORT_JSON | jq -r '.cacheHitRate * 100')%\n\n"
  
  REPORT+="## Usage by Request Type\n\n"
  REPORT+="| Request Type | Requests | Tokens | Cost |\n"
  REPORT+="| ------------ | -------- | ------ | ---- |\n"
  
  for type in $(echo $REPORT_JSON | jq -r '.requestsByType | keys[]'); do
    REPORT+="| $type | $(echo $REPORT_JSON | jq -r ".requestsByType[\"$type\"]") | $(echo $REPORT_JSON | jq -r ".tokensByType[\"$type\"]") | $$(echo $REPORT_JSON | jq -r ".costByType[\"$type\"]") |\n"
  done
  
  if [[ "$DETAILED" == "true" ]]; then
    REPORT+="\n## Top Users\n\n"
    REPORT+="| User ID | Requests | Tokens | Cost |\n"
    REPORT+="| ------- | -------- | ------ | ---- |\n"
    
    for i in $(seq 0 $(echo $REPORT_JSON | jq -r '.topUsers | length - 1')); do
      REPORT+="| $(echo $REPORT_JSON | jq -r ".topUsers[$i].userId") | $(echo $REPORT_JSON | jq -r ".topUsers[$i].totalRequests") | $(echo $REPORT_JSON | jq -r ".topUsers[$i].totalTokens") | $$(echo $REPORT_JSON | jq -r ".topUsers[$i].totalCost") |\n"
    done
  fi
fi

# Output the report
if [[ -n "$OUTPUT_FILE" ]]; then
  echo -e "$REPORT" > "$OUTPUT_FILE"
  echo "✅ Report saved to $OUTPUT_FILE"
else
  echo -e "$REPORT"
fi

# Send to Slack if webhook is provided
if [[ -n "$SLACK_WEBHOOK" ]]; then
  # Create a temporary file for the Slack payload
  TEMP_SLACK_FILE=$(mktemp)
  
  # Create a simplified text version for Slack
  SLACK_TEXT="*Claude Usage Report - $MONTH*\n\n"
  SLACK_TEXT+="*Summary*\n"
  SLACK_TEXT+="• Total Requests: $(echo $REPORT_JSON | jq -r '.totalRequests')\n"
  SLACK_TEXT+="• Total Tokens: $(echo $REPORT_JSON | jq -r '.totalTokens')\n"
  SLACK_TEXT+="• Total Cost: $$(echo $REPORT_JSON | jq -r '.totalCost')\n"
  SLACK_TEXT+="• Cache Hit Rate: $(echo $REPORT_JSON | jq -r '.cacheHitRate * 100')%\n\n"
  
  SLACK_TEXT+="*Top Request Types*\n"
  
  # Get the top 3 request types by cost
  TOP_TYPES=$(echo $REPORT_JSON | jq -r '.costByType | to_entries | sort_by(.value) | reverse | .[0:3] | .[].key')
  
  for type in $TOP_TYPES; do
    SLACK_TEXT+="• $type: $$(echo $REPORT_JSON | jq -r ".costByType[\"$type\"]") ($(echo $REPORT_JSON | jq -r ".requestsByType[\"$type\"]") requests)\n"
  done
  
  # Write the Slack payload
  cat > $TEMP_SLACK_FILE << EOL
{
  "text": "$SLACK_TEXT",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "$SLACK_TEXT"
      }
    }
  ]
}
EOL
  
  # Send to Slack
  curl -s -X POST -H 'Content-type: application/json' --data @$TEMP_SLACK_FILE $SLACK_WEBHOOK
  
  echo "✅ Report sent to Slack"
  
  # Clean up
  rm $TEMP_SLACK_FILE
fi

# Send email if address is provided
if [[ -n "$EMAIL" ]]; then
  # Create a temporary file for the email
  TEMP_EMAIL_FILE=$(mktemp)
  
  # Create email subject
  EMAIL_SUBJECT="Claude Usage Report - $MONTH"
  
  # Create email body
  if [[ "$OUTPUT_FORMAT" == "html" ]]; then
    # Use the HTML report
    EMAIL_BODY="$REPORT"
  else
    # Create a simple HTML email
    EMAIL_BODY="<!DOCTYPE html>
<html>
<head>
  <title>Claude Usage Report - $MONTH</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Claude Usage Report - $MONTH</h1>
  <pre>$(echo -e "$REPORT" | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g')</pre>
</body>
</html>"
  fi
  
  # Write the email body
  echo "$EMAIL_BODY" > $TEMP_EMAIL_FILE
  
  # Send the email
  if command -v mail &> /dev/null; then
    cat $TEMP_EMAIL_FILE | mail -s "$EMAIL_SUBJECT" -a "Content-Type: text/html" $EMAIL
    echo "✅ Report sent to $EMAIL"
  else
    echo "⚠️ mail command not found. Could not send email."
    echo "Please install mailutils (Linux) or configure mail (macOS)."
  fi
  
  # Clean up
  rm $TEMP_EMAIL_FILE
fi

# Clean up
rm $TEMP_QUERY_FILE
rm -rf $TEMP_DIR

echo "✅ Claude usage report generated successfully"