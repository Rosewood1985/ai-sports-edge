-- Financial Reporting Database Migration

-- Transaction table enhancements
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS revenue_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS tax_jurisdiction VARCHAR(100),
ADD COLUMN IF NOT EXISTS reporting_period VARCHAR(20),
ADD COLUMN IF NOT EXISTS financial_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS tax_calculation_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_transaction_id VARCHAR(100);

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
  report_url VARCHAR(255),
  report_data JSONB
);

-- Create revenue categories table
CREATE TABLE IF NOT EXISTS revenue_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
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
CREATE INDEX IF NOT EXISTS idx_transactions_tax_calculation_id ON transactions(tax_calculation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tax_transaction_id ON transactions(tax_transaction_id);
CREATE INDEX IF NOT EXISTS idx_revenue_reports_date_range ON revenue_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_revenue_reports_report_type ON revenue_reports(report_type);
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
('monthly', date_trunc('month', current_date)::date, 
 (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date, 
 'open')
ON CONFLICT DO NOTHING;