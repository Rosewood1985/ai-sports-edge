#!/bin/bash

# Script to set up financial reporting infrastructure
# This script creates necessary database tables and initializes reporting components

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_CONFIG_FILE="./config/database.json"
REPORTS_DIR="./reports/financial"
TEMPLATES_DIR="./templates/financial"
MIGRATIONS_DIR="./migrations"
MIGRATION_FILE="$MIGRATIONS_DIR/$(date +%Y%m%d%H%M%S)_financial_reporting.sql"

# Display script header
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}   Setup Financial Reporting Infrastructure   ${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo

# Parse command line arguments
VERBOSE=false
SKIP_DB=false
SKIP_DIRS=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --verbose) VERBOSE=true ;;
        --skip-db) SKIP_DB=true ;;
        --skip-dirs) SKIP_DIRS=true ;;
        --help) 
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --verbose      Enable verbose output"
            echo "  --skip-db      Skip database setup"
            echo "  --skip-dirs    Skip directory creation"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Function to log verbose messages
log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${YELLOW}[VERBOSE] $1${NC}"
    fi
}

# Create necessary directories
if [ "$SKIP_DIRS" = false ]; then
    echo -e "${YELLOW}Creating necessary directories...${NC}"
    
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$REPORTS_DIR/daily"
    mkdir -p "$REPORTS_DIR/weekly"
    mkdir -p "$REPORTS_DIR/monthly"
    mkdir -p "$REPORTS_DIR/quarterly"
    mkdir -p "$REPORTS_DIR/annual"
    mkdir -p "$REPORTS_DIR/tax"
    
    mkdir -p "$TEMPLATES_DIR"
    mkdir -p "$MIGRATIONS_DIR"
    
    echo -e "${GREEN}Directories created successfully.${NC}"
fi

# Create database migration file
if [ "$SKIP_DB" = false ]; then
    echo -e "${YELLOW}Creating database migration file...${NC}"
    
    # Create migrations directory if it doesn't exist
    mkdir -p "$MIGRATIONS_DIR"
    
    # Create migration file
    cat > "$MIGRATION_FILE" << 'EOF'
-- Financial Reporting Database Migration

-- Transaction table enhancements
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS revenue_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS tax_jurisdiction VARCHAR(100),
ADD COLUMN IF NOT EXISTS reporting_period VARCHAR(20),
ADD COLUMN IF NOT EXISTS financial_status VARCHAR(20);

-- Create revenue reports table
CREATE TABLE IF NOT EXISTS revenue_reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  generation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_revenue DECIMAL(12, 2) NOT NULL,
  total_tax DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  generated_by VARCHAR(100),
  report_url VARCHAR(255)
);

-- Create revenue categories table
CREATE TABLE IF NOT EXISTS revenue_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tax_code VARCHAR(50),
  is_taxable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create tax jurisdictions table
CREATE TABLE IF NOT EXISTS tax_jurisdictions (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  state_code VARCHAR(10),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  jurisdiction_name VARCHAR(100) NOT NULL,
  tax_authority VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create tax rates table
CREATE TABLE IF NOT EXISTS tax_rates (
  id SERIAL PRIMARY KEY,
  jurisdiction_id INTEGER NOT NULL REFERENCES tax_jurisdictions(id),
  tax_type VARCHAR(50) NOT NULL,
  tax_code VARCHAR(50),
  rate DECIMAL(6, 4) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create tax exemptions table
CREATE TABLE IF NOT EXISTS tax_exemptions (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL,
  exemption_type VARCHAR(50) NOT NULL,
  exemption_certificate VARCHAR(100),
  certificate_url VARCHAR(255),
  valid_from DATE NOT NULL,
  valid_until DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create financial periods table
CREATE TABLE IF NOT EXISTS financial_periods (
  id SERIAL PRIMARY KEY,
  period_type VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  closed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_revenue_category ON transactions(revenue_category);
CREATE INDEX IF NOT EXISTS idx_transactions_reporting_period ON transactions(reporting_period);
CREATE INDEX IF NOT EXISTS idx_transactions_financial_status ON transactions(financial_status);
CREATE INDEX IF NOT EXISTS idx_revenue_reports_date_range ON revenue_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tax_rates_jurisdiction ON tax_rates(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_tax_exemptions_customer ON tax_exemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_periods_dates ON financial_periods(start_date, end_date);

-- Insert default revenue categories
INSERT INTO revenue_categories (name, description, tax_code, is_taxable)
VALUES 
('Subscription', 'Recurring subscription revenue', 'txcd_10103001', true),
('One-time Purchase', 'One-time purchase revenue', 'txcd_10103001', true),
('In-app Purchase', 'In-app purchase revenue', 'txcd_10103001', true),
('Premium Feature', 'Premium feature access revenue', 'txcd_10103001', true),
('Group Subscription', 'Group subscription revenue', 'txcd_10103001', true)
ON CONFLICT (name) DO NOTHING;

-- Insert current financial period
INSERT INTO financial_periods (period_type, start_date, end_date, status)
VALUES 
('monthly', date_trunc('month', current_date), 
 (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date, 
 'open')
ON CONFLICT DO NOTHING;
EOF
    
    echo -e "${GREEN}Database migration file created at $MIGRATION_FILE${NC}"
    
    # Check if we should run the migration
    read -p "Do you want to run the database migration now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Running database migration...${NC}"
        
        # Check if database configuration exists
        if [ ! -f "$DB_CONFIG_FILE" ]; then
            echo -e "${RED}Database configuration file not found at $DB_CONFIG_FILE${NC}"
            echo -e "${YELLOW}Please create the database configuration file and run the migration manually.${NC}"
        else
            # Extract database connection info from config file
            if command -v jq &> /dev/null; then
                DB_HOST=$(jq -r '.host' "$DB_CONFIG_FILE")
                DB_PORT=$(jq -r '.port' "$DB_CONFIG_FILE")
                DB_NAME=$(jq -r '.database' "$DB_CONFIG_FILE")
                DB_USER=$(jq -r '.user' "$DB_CONFIG_FILE")
                
                # Run the migration
                if command -v psql &> /dev/null; then
                    PGPASSWORD=$(jq -r '.password' "$DB_CONFIG_FILE") psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$MIGRATION_FILE"
                    
                    if [ $? -eq 0 ]; then
                        echo -e "${GREEN}Database migration completed successfully.${NC}"
                    else
                        echo -e "${RED}Database migration failed.${NC}"
                        echo -e "${YELLOW}Please check the error message and run the migration manually.${NC}"
                    fi
                else
                    echo -e "${RED}psql command not found. Please install PostgreSQL client tools.${NC}"
                    echo -e "${YELLOW}You can run the migration manually using the generated SQL file.${NC}"
                fi
            else
                echo -e "${RED}jq command not found. Please install jq or extract database configuration manually.${NC}"
                echo -e "${YELLOW}You can run the migration manually using the generated SQL file.${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}Skipping database migration. You can run it later manually.${NC}"
    fi
fi

# Create report templates
echo -e "${YELLOW}Creating report templates...${NC}"

# Daily revenue report template
cat > "$TEMPLATES_DIR/daily_revenue_report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Daily Revenue Report - {{date}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .summary { margin-top: 30px; }
        .footer { margin-top: 50px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <h1>Daily Revenue Report</h1>
    <p>Date: {{date}}</p>
    <p>Generated: {{generated_at}}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Revenue: {{currency_symbol}}{{total_revenue}}</p>
        <p>Total Tax: {{currency_symbol}}{{total_tax}}</p>
        <p>Net Revenue: {{currency_symbol}}{{net_revenue}}</p>
    </div>
    
    <h2>Revenue by Category</h2>
    <table>
        <tr>
            <th>Category</th>
            <th>Gross Revenue</th>
            <th>Tax</th>
            <th>Net Revenue</th>
        </tr>
        {{#each categories}}
        <tr>
            <td>{{name}}</td>
            <td>{{currency_symbol}}{{gross_revenue}}</td>
            <td>{{currency_symbol}}{{tax}}</td>
            <td>{{currency_symbol}}{{net_revenue}}</td>
        </tr>
        {{/each}}
        <tr class="total-row">
            <td>Total</td>
            <td>{{currency_symbol}}{{total_revenue}}</td>
            <td>{{currency_symbol}}{{total_tax}}</td>
            <td>{{currency_symbol}}{{net_revenue}}</td>
        </tr>
    </table>
    
    <h2>Transactions</h2>
    <table>
        <tr>
            <th>ID</th>
            <th>Time</th>
            <th>Customer</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Tax</th>
            <th>Total</th>
        </tr>
        {{#each transactions}}
        <tr>
            <td>{{id}}</td>
            <td>{{time}}</td>
            <td>{{customer}}</td>
            <td>{{category}}</td>
            <td>{{currency_symbol}}{{amount}}</td>
            <td>{{currency_symbol}}{{tax}}</td>
            <td>{{currency_symbol}}{{total}}</td>
        </tr>
        {{/each}}
    </table>
    
    <div class="footer">
        <p>AI Sports Edge Financial Report - Confidential</p>
        <p>Report ID: {{report_id}}</p>
    </div>
</body>
</html>
EOF

# Monthly revenue report template
cat > "$TEMPLATES_DIR/monthly_revenue_report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Monthly Revenue Report - {{month}} {{year}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .summary { margin-top: 30px; }
        .chart { margin-top: 30px; height: 300px; }
        .footer { margin-top: 50px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <h1>Monthly Revenue Report</h1>
    <p>Month: {{month}} {{year}}</p>
    <p>Generated: {{generated_at}}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Revenue: {{currency_symbol}}{{total_revenue}}</p>
        <p>Total Tax: {{currency_symbol}}{{total_tax}}</p>
        <p>Net Revenue: {{currency_symbol}}{{net_revenue}}</p>
        <p>Compared to Previous Month: {{change_percentage}}%</p>
    </div>
    
    <div class="chart">
        <h2>Daily Revenue Trend</h2>
        <img src="{{chart_url}}" alt="Daily Revenue Chart" width="100%" height="300">
    </div>
    
    <h2>Revenue by Category</h2>
    <table>
        <tr>
            <th>Category</th>
            <th>Gross Revenue</th>
            <th>Tax</th>
            <th>Net Revenue</th>
            <th>% of Total</th>
        </tr>
        {{#each categories}}
        <tr>
            <td>{{name}}</td>
            <td>{{currency_symbol}}{{gross_revenue}}</td>
            <td>{{currency_symbol}}{{tax}}</td>
            <td>{{currency_symbol}}{{net_revenue}}</td>
            <td>{{percentage}}%</td>
        </tr>
        {{/each}}
        <tr class="total-row">
            <td>Total</td>
            <td>{{currency_symbol}}{{total_revenue}}</td>
            <td>{{currency_symbol}}{{total_tax}}</td>
            <td>{{currency_symbol}}{{net_revenue}}</td>
            <td>100%</td>
        </tr>
    </table>
    
    <h2>Revenue by Day</h2>
    <table>
        <tr>
            <th>Date</th>
            <th>Transactions</th>
            <th>Gross Revenue</th>
            <th>Tax</th>
            <th>Net Revenue</th>
        </tr>
        {{#each days}}
        <tr>
            <td>{{date}}</td>
            <td>{{transaction_count}}</td>
            <td>{{currency_symbol}}{{gross_revenue}}</td>
            <td>{{currency_symbol}}{{tax}}</td>
            <td>{{currency_symbol}}{{net_revenue}}</td>
        </tr>
        {{/each}}
        <tr class="total-row">
            <td>Total</td>
            <td>{{total_transaction_count}}</td>
            <td>{{currency_symbol}}{{total_revenue}}</td>
            <td>{{currency_symbol}}{{total_tax}}</td>
            <td>{{currency_symbol}}{{net_revenue}}</td>
        </tr>
    </table>
    
    <div class="footer">
        <p>AI Sports Edge Financial Report - Confidential</p>
        <p>Report ID: {{report_id}}</p>
    </div>
</body>
</html>
EOF

# Tax report template
cat > "$TEMPLATES_DIR/tax_report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Tax Report - {{period}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .summary { margin-top: 30px; }
        .jurisdiction { margin-top: 40px; }
        .footer { margin-top: 50px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <h1>Tax Report</h1>
    <p>Period: {{period}}</p>
    <p>Generated: {{generated_at}}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Taxable Revenue: {{currency_symbol}}{{total_taxable_revenue}}</p>
        <p>Total Tax Collected: {{currency_symbol}}{{total_tax}}</p>
        <p>Number of Transactions: {{transaction_count}}</p>
    </div>
    
    <h2>Tax by Jurisdiction</h2>
    <table>
        <tr>
            <th>Jurisdiction</th>
            <th>Tax Type</th>
            <th>Taxable Amount</th>
            <th>Tax Rate</th>
            <th>Tax Collected</th>
        </tr>
        {{#each jurisdictions}}
        <tr>
            <td>{{name}}</td>
            <td>{{tax_type}}</td>
            <td>{{currency_symbol}}{{taxable_amount}}</td>
            <td>{{tax_rate}}%</td>
            <td>{{currency_symbol}}{{tax_collected}}</td>
        </tr>
        {{/each}}
        <tr class="total-row">
            <td colspan="2">Total</td>
            <td>{{currency_symbol}}{{total_taxable_revenue}}</td>
            <td>-</td>
            <td>{{currency_symbol}}{{total_tax}}</td>
        </tr>
    </table>
    
    {{#each jurisdiction_details}}
    <div class="jurisdiction">
        <h2>{{name}} Details</h2>
        <p>Tax Authority: {{tax_authority}}</p>
        <p>Filing Frequency: {{filing_frequency}}</p>
        <p>Next Filing Due: {{next_filing_due}}</p>
        
        <h3>Transactions</h3>
        <table>
            <tr>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Customer</th>
                <th>Taxable Amount</th>
                <th>Tax Rate</th>
                <th>Tax Collected</th>
            </tr>
            {{#each transactions}}
            <tr>
                <td>{{date}}</td>
                <td>{{id}}</td>
                <td>{{customer}}</td>
                <td>{{currency_symbol}}{{taxable_amount}}</td>
                <td>{{tax_rate}}%</td>
                <td>{{currency_symbol}}{{tax_collected}}</td>
            </tr>
            {{/each}}
            <tr class="total-row">
                <td colspan="3">Total</td>
                <td>{{currency_symbol}}{{total_taxable_amount}}</td>
                <td>-</td>
                <td>{{currency_symbol}}{{total_tax_collected}}</td>
            </tr>
        </table>
    </div>
    {{/each}}
    
    <div class="footer">
        <p>AI Sports Edge Tax Report - Confidential</p>
        <p>Report ID: {{report_id}}</p>
        <p>This report is for informational purposes only and should be verified by a tax professional before filing.</p>
    </div>
</body>
</html>
EOF

echo -e "${GREEN}Report templates created successfully.${NC}"

# Create configuration file for financial reporting
echo -e "${YELLOW}Creating financial reporting configuration...${NC}"

mkdir -p "./config"
cat > "./config/financial-reporting.json" << 'EOF'
{
  "reporting": {
    "currency": "USD",
    "currency_symbol": "$",
    "default_timezone": "America/New_York",
    "date_format": "YYYY-MM-DD",
    "fiscal_year_start_month": 1,
    "fiscal_year_start_day": 1
  },
  "schedules": {
    "daily_report": {
      "enabled": true,
      "time": "01:00",
      "recipients": []
    },
    "weekly_report": {
      "enabled": true,
      "day": "Monday",
      "time": "02:00",
      "recipients": []
    },
    "monthly_report": {
      "enabled": true,
      "day": 1,
      "time": "03:00",
      "recipients": []
    },
    "quarterly_report": {
      "enabled": true,
      "months": [1, 4, 7, 10],
      "day": 5,
      "time": "04:00",
      "recipients": []
    },
    "annual_report": {
      "enabled": true,
      "month": 1,
      "day": 15,
      "time": "05:00",
      "recipients": []
    },
    "tax_report": {
      "enabled": true,
      "frequency": "monthly",
      "day": 10,
      "time": "06:00",
      "recipients": []
    }
  },
  "tax": {
    "default_tax_codes": {
      "subscription": "txcd_10103001",
      "one_time_purchase": "txcd_10103001",
      "in_app_purchase": "txcd_10103001",
      "premium_feature": "txcd_10103001",
      "group_subscription": "txcd_10103001"
    },
    "tax_calculation_mode": "stripe_tax",
    "fallback_tax_rate": 0.0,
    "store_tax_details": true
  },
  "storage": {
    "report_retention_days": 730,
    "backup_enabled": true,
    "backup_frequency": "daily",
    "backup_time": "00:00"
  }
}
EOF

echo -e "${GREEN}Financial reporting configuration created successfully.${NC}"

# Create sample report generation script
echo -e "${YELLOW}Creating sample report generation script...${NC}"

mkdir -p "./scripts"
cat > "./scripts/generate-financial-report.js" << 'EOF'
#!/usr/bin/env node

/**
 * Financial Report Generator
 * 
 * This script generates financial reports based on the specified type and date range.
 * 
 * Usage:
 *   node generate-financial-report.js --type=daily --date=2025-04-01
 *   node generate-financial-report.js --type=monthly --month=4 --year=2025
 *   node generate-financial-report.js --type=tax --start=2025-04-01 --end=2025-04-30
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { Pool } = require('pg');
const Handlebars = require('handlebars');
const moment = require('moment');

// Parse command line arguments
program
  .option('--type <type>', 'Report type (daily, weekly, monthly, quarterly, annual, tax)')
  .option('--date <date>', 'Report date (YYYY-MM-DD) for daily reports')
  .option('--month <month>', 'Month number (1-12) for monthly reports')
  .option('--year <year>', 'Year (YYYY) for monthly, quarterly, and annual reports')
  .option('--quarter <quarter>', 'Quarter number (1-4) for quarterly reports')
  .option('--start <start>', 'Start date (YYYY-MM-DD) for custom date range')
  .option('--end <end>', 'End date (YYYY-MM-DD) for custom date range')
  .option('--output <output>', 'Output directory for the report')
  .parse(process.argv);

const options = program.opts();

// Validate required options
if (!options.type) {
  console.error('Error: Report type is required');
  process.exit(1);
}

// Set default values
const reportType = options.type;
const now = moment();
let startDate, endDate, reportDate, reportTitle;

// Determine date range based on report type
switch (reportType) {
  case 'daily':
    reportDate = options.date ? moment(options.date) : now.clone().subtract(1, 'day');
    startDate = reportDate.clone().startOf('day');
    endDate = reportDate.clone().endOf('day');
    reportTitle = `Daily Revenue Report - ${reportDate.format('YYYY-MM-DD')}`;
    break;
    
  case 'weekly':
    const weekStart = options.date ? moment(options.date) : now.clone().subtract(1, 'week').startOf('week');
    startDate = weekStart.clone();
    endDate = weekStart.clone().add(6, 'days').endOf('day');
    reportTitle = `Weekly Revenue Report - ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`;
    break;
    
  case 'monthly':
    const year = options.year ? parseInt(options.year) : now.year();
    const month = options.month ? parseInt(options.month) : now.month();
    startDate = moment([year, month - 1, 1]);
    endDate = startDate.clone().endOf('month');
    reportTitle = `Monthly Revenue Report - ${startDate.format('MMMM YYYY')}`;
    break;
    
  case 'quarterly':
    const qYear = options.year ? parseInt(options.year) : now.year();
    const quarter = options.quarter ? parseInt(options.quarter) : Math.ceil((now.month() + 1) / 3);
    const qMonth = (quarter - 1) * 3;
    startDate = moment([qYear, qMonth, 1]);
    endDate = startDate.clone().add(2, 'months').endOf('month');
    reportTitle = `Quarterly Revenue Report - Q${quarter} ${qYear}`;
    break;
    
  case 'annual':
    const aYear = options.year ? parseInt(options.year) : now.year() - 1;
    startDate = moment([aYear, 0, 1]);
    endDate = moment([aYear, 11, 31]);
    reportTitle = `Annual Revenue Report - ${aYear}`;
    break;
    
  case 'tax':
    if (options.start && options.end) {
      startDate = moment(options.start);
      endDate = moment(options.end);
    } else {
      // Default to previous month for tax reports
      startDate = now.clone().subtract(1, 'month').startOf('month');
      endDate = startDate.clone().endOf('month');
    }
    reportTitle = `Tax Report - ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`;
    break;
    
  default:
    console.error(`Error: Unknown report type: ${reportType}`);
    process.exit(1);
}

// Determine output directory and filename
const config = JSON.parse(fs.readFileSync('./config/financial-reporting.json', 'utf8'));
const dbConfig = JSON.parse(fs.readFileSync('./config/database.json', 'utf8'));
const outputDir = options.output || `./reports/financial/${reportType}`;
const outputFilename = `${reportType}_report_${startDate.format('YYYYMMDD')}_${endDate.format('YYYYMMDD')}.html`;
const outputPath = path.join(outputDir, outputFilename);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Load template
const templatePath = `./templates/financial/${reportType}_revenue_report.html`;
if (!fs.existsSync(templatePath)) {
  console.error(`Error: Template not found: ${templatePath}`);
  process.exit(1);
}
const templateSource = fs.readFileSync(templatePath, 'utf8');
const template = Handlebars.compile(templateSource);

// Connect to database
const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password
});

// Generate report data
async function generateReportData() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Get total revenue and tax
    const revenueQuery = `
      SELECT 
        SUM(amount) as total_revenue,
        SUM(tax_amount) as total_tax,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE created_at BETWEEN $1 AND $2
    `;
    const revenueResult = await client.query(revenueQuery, [startDate.toISOString(), endDate.toISOString()]);
    
    // Get revenue by category
    const categoryQuery = `
      SELECT 
        revenue_category as name,
        SUM(amount) as gross_revenue,
        SUM(tax_amount) as tax,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE created_at BETWEEN $1 AND $2
      "subscription": "txcd_10103001",
      "one_time_purchase": "txcd_10103001",
      "in_app_purchase": "txcd_10103001",
      "premium_feature": "txcd_10103001",
      "group_subscription": "txcd_10103001"
    },
    "tax_calculation_mode": "stripe_tax",
    "fallback_tax_rate": 0.0,
    "store_tax_details": true
  },
  "storage": {
    "report_retention_days": 730,
    "backup_enabled": true,
    "backup_frequency": "daily",
    "backup_time": "00:00"
  }
}
EOF

echo -e "${GREEN}Financial reporting configuration created successfully.${NC}"

# Create sample report generation script
echo -e "${YELLOW}Creating sample report generation script...${NC}"

mkdir -p "./scripts"
cat > "./scripts/generate-financial-report.js" << 'EOF'
#!/usr/bin/env node

/**
 * Financial Report Generator
 * 
 * This script generates financial reports based on the specified type and date range.
 * 
 * Usage:
 *   node generate-financial-report.js --type=daily --date=2025-04-01
 *   node generate-financial-report.js --type=monthly --month=4 --year=2025
 *   node generate-financial-report.js --type=tax --start=2025-04-01 --end=2025-04-30
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { Pool } = require('pg');
const Handlebars = require('handlebars');
const moment = require('moment');

// Parse command line arguments
program
  .option('--type <type>', 'Report type (daily, weekly, monthly, quarterly, annual, tax)')
  .option('--date <date>', 'Report date (YYYY-MM-DD) for daily reports')
  .option('--month <month>', 'Month number (1-12) for monthly reports')
  .option('--year <year>', 'Year (YYYY) for monthly, quarterly, and annual reports')
  .option('--quarter <quarter>', 'Quarter number (1-4) for quarterly reports')
  .option('--start <start>', 'Start date (YYYY-MM-DD) for custom date range')
  .option('--end <end>', 'End date (YYYY-MM-DD) for custom date range')
  .option('--output <output>', 'Output directory for the report')
  .parse(process.argv);

const options = program.opts();

// Validate required options
if (!options.type) {
  console.error('Error: Report type is required');
  process.exit(1);
}

// Set default values
const reportType = options.type;
const now = moment();
let startDate, endDate, reportDate, reportTitle;

// Determine date range based on report type
switch (reportType) {
  case 'daily':
    reportDate = options.date ? moment(options.date) : now.clone().subtract(1, 'day');
    startDate = reportDate.clone().startOf('day');
    endDate = reportDate.clone().endOf('day');
    reportTitle = `Daily Revenue Report - ${reportDate.format('YYYY-MM-DD')}`;
    break;
    
  case 'weekly':
    const weekStart = options.date ? moment(options.date) : now.clone().subtract(1, 'week').startOf('week');
    startDate = weekStart.clone();
    endDate = weekStart.clone().add(6, 'days').endOf('day');
    reportTitle = `Weekly Revenue Report - ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`;
    break;
    
  case 'monthly':
    const year = options.year ? parseInt(options.year) : now.year();
    const month = options.month ? parseInt(options.month) : now.month();
    startDate = moment([year, month - 1, 1]);
    endDate = startDate.clone().endOf('month');
    reportTitle = `Monthly Revenue Report - ${startDate.format('MMMM YYYY')}`;
    break;
    
  case 'quarterly':
    const qYear = options.year ? parseInt(options.year) : now.year();
    const quarter = options.quarter ? parseInt(options.quarter) : Math.ceil((now.month() + 1) / 3);
    const qMonth = (quarter - 1) * 3;
    startDate = moment([qYear, qMonth, 1]);
    endDate = startDate.clone().add(2, 'months').endOf('month');
    reportTitle = `Quarterly Revenue Report - Q${quarter} ${qYear}`;
    break;
    
  case 'annual':
    const aYear = options.year ? parseInt(options.year) : now.year() - 1;
    startDate = moment([aYear, 0, 1]);
    endDate = moment([aYear, 11, 31]);
    reportTitle = `Annual Revenue Report - ${aYear}`;
    break;
    
  case 'tax':
    if (options.start && options.end) {
      startDate = moment(options.start);
      endDate = moment(options.end);
    } else {
      // Default to previous month for tax reports
      startDate = now.clone().subtract(1, 'month').startOf('month');
      endDate = startDate.clone().endOf('month');
    }
    reportTitle = `Tax Report - ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`;
    break;
    
  default:
    console.error(`Error: Unknown report type: ${reportType}`);
    process.exit(1);
}

// Determine output directory and filename
const config = JSON.parse(fs.readFileSync('./config/financial-reporting.json', 'utf8'));
const dbConfig = JSON.parse(fs.readFileSync('./config/database.json', 'utf8'));
const outputDir = options.output || `./reports/financial/${reportType}`;
const outputFilename = `${reportType}_report_${startDate.format('YYYYMMDD')}_${endDate.format('YYYYMMDD')}.html`;
const outputPath = path.join(outputDir, outputFilename);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Load template
const templatePath = `./templates/financial/${reportType}_revenue_report.html`;
if (!fs.existsSync(templatePath)) {
  console.error(`Error: Template not found: ${templatePath}`);
  process.exit(1);
}
const templateSource = fs.readFileSync(templatePath, 'utf8');
const template = Handlebars.compile(templateSource);

// Connect to database
const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password
});

// Generate report data
async function generateReportData() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Get total revenue and tax
    const revenueQuery = `
      SELECT 
        SUM(amount) as total_revenue,
        SUM(tax_amount) as total_tax,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE created_at BETWEEN $1 AND $2
    `;
    const revenueResult = await client.query(revenueQuery, [startDate.toISOString(), endDate.toISOString()]);
    
    // Get revenue by category
    const categoryQuery = `
      SELECT 
        revenue_category as name,
        SUM(amount) as gross_revenue,
        SUM(tax_amount) as tax,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE created_at BETWEEN $1 AND $2
