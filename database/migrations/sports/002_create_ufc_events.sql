-- Migration: Create UFC Events table
-- This migration creates the events table with comprehensive event information

CREATE TABLE IF NOT EXISTS ufc_events (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    event_number INTEGER,
    event_type VARCHAR(50) NOT NULL, -- PPV, Fight Night, Early Prelims, etc.
    venue_name VARCHAR(200) NOT NULL,
    venue_location VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    event_date DATETIME NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
    capacity INTEGER,
    attendance INTEGER,
    gate_revenue DECIMAL(15,2),
    pay_per_view_buys INTEGER,
    broadcast_network VARCHAR(100),
    main_card_start_time DATETIME,
    preliminary_card_start_time DATETIME,
    early_prelims_start_time DATETIME,
    poster_image_url TEXT,
    promotional_video_url TEXT,
    event_description TEXT,
    weather_conditions JSON, -- for outdoor events
    octagon_size VARCHAR(20) DEFAULT 'standard', -- standard, small
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_event_date (event_date),
    INDEX idx_status (status),
    INDEX idx_event_type (event_type),
    INDEX idx_location (city, country),
    INDEX idx_name (name)
);

-- Create event broadcasting table for multiple networks
CREATE TABLE IF NOT EXISTS ufc_event_broadcasting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    network_name VARCHAR(100) NOT NULL,
    broadcast_type VARCHAR(50) NOT NULL, -- live, replay, highlight, streaming
    region VARCHAR(100) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    subscription_required BOOLEAN DEFAULT false,
    ppv_price DECIMAL(8,2),
    currency VARCHAR(3) DEFAULT 'USD',
    streaming_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES ufc_events(id) ON DELETE CASCADE,
    INDEX idx_event_broadcasting (event_id),
    INDEX idx_network (network_name),
    INDEX idx_region (region),
    INDEX idx_broadcast_time (start_time)
);

-- Create event officials table
CREATE TABLE IF NOT EXISTS ufc_event_officials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    official_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- referee, judge, timekeeper, inspector
    experience_years INTEGER,
    notable_events TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES ufc_events(id) ON DELETE CASCADE,
    INDEX idx_event_officials (event_id),
    INDEX idx_official_role (role),
    INDEX idx_official_name (official_name)
);

-- Create event attendance and revenue tracking
CREATE TABLE IF NOT EXISTS ufc_event_financials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    
    -- Attendance Data
    announced_attendance INTEGER,
    actual_attendance INTEGER,
    capacity_percentage DECIMAL(5,2),
    
    -- Revenue Data
    gate_revenue DECIMAL(15,2),
    ppv_buys INTEGER,
    ppv_revenue DECIMAL(15,2),
    merchandise_revenue DECIMAL(15,2),
    sponsorship_revenue DECIMAL(15,2),
    total_revenue DECIMAL(15,2),
    
    -- Cost Data
    production_costs DECIMAL(15,2),
    fighter_purses DECIMAL(15,2),
    venue_costs DECIMAL(15,2),
    marketing_costs DECIMAL(15,2),
    total_costs DECIMAL(15,2),
    
    -- Profit Analysis
    net_profit DECIMAL(15,2),
    profit_margin DECIMAL(5,2),
    
    currency VARCHAR(3) DEFAULT 'USD',
    financial_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES ufc_events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_financials (event_id, financial_date),
    INDEX idx_event_financials (event_id),
    INDEX idx_financial_date (financial_date)
);

-- Create event weather conditions table (for outdoor events)
CREATE TABLE IF NOT EXISTS ufc_event_weather (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    temperature_fahrenheit INTEGER,
    temperature_celsius INTEGER,
    humidity_percentage INTEGER,
    wind_speed_mph INTEGER,
    weather_conditions VARCHAR(100), -- sunny, cloudy, rainy, etc.
    precipitation_chance INTEGER,
    visibility_miles INTEGER,
    atmospheric_pressure DECIMAL(6,2),
    uv_index INTEGER,
    recorded_at DATETIME NOT NULL,
    weather_source VARCHAR(100),
    impact_on_event TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES ufc_events(id) ON DELETE CASCADE,
    INDEX idx_event_weather (event_id),
    INDEX idx_recorded_at (recorded_at)
);

-- Create event timeline table for key moments
CREATE TABLE IF NOT EXISTS ufc_event_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    moment_type VARCHAR(50) NOT NULL, -- fight_start, fight_end, controversy, injury, etc.
    description TEXT NOT NULL,
    event_time TIME,
    event_timestamp DATETIME,
    participant VARCHAR(100), -- fighter name, official name, etc.
    significance VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    media_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES ufc_events(id) ON DELETE CASCADE,
    INDEX idx_event_timeline (event_id),
    INDEX idx_moment_type (moment_type),
    INDEX idx_event_timestamp (event_timestamp),
    INDEX idx_significance (significance)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_ufc_events_timestamp 
    BEFORE UPDATE ON ufc_events 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Create trigger to update event financials timestamp
DELIMITER //
CREATE TRIGGER update_ufc_event_financials_timestamp 
    BEFORE UPDATE ON ufc_event_financials 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample events for testing (optional)
INSERT INTO ufc_events (
    id, name, event_number, event_type, venue_name, venue_location, 
    city, country, event_date, timezone, status
) VALUES 
('ufc_300', 'UFC 300: Pereira vs Hill', 300, 'PPV', 'T-Mobile Arena', 'Las Vegas, Nevada', 'Las Vegas', 'United States', '2024-04-13 22:00:00', 'PST', 'completed'),
('ufc_301', 'UFC 301: Pantoja vs Erceg', 301, 'PPV', 'Farmasi Arena', 'Rio de Janeiro, Brazil', 'Rio de Janeiro', 'Brazil', '2024-05-04 21:00:00', 'BRT', 'completed'),
('ufc_302', 'UFC 302: Makhachev vs Poirier', 302, 'PPV', 'Prudential Center', 'Newark, New Jersey', 'Newark', 'United States', '2024-06-01 22:00:00', 'EST', 'scheduled')
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample broadcasting data
INSERT INTO ufc_event_broadcasting (
    event_id, network_name, broadcast_type, region, start_time, ppv_price
) VALUES 
('ufc_300', 'ESPN+', 'live', 'United States', '2024-04-13 22:00:00', 79.99),
('ufc_300', 'BT Sport', 'live', 'United Kingdom', '2024-04-14 03:00:00', 19.95),
('ufc_301', 'ESPN+', 'live', 'United States', '2024-05-04 21:00:00', 79.99)
ON DUPLICATE KEY UPDATE
    network_name = VALUES(network_name);

-- Commit the changes
COMMIT;