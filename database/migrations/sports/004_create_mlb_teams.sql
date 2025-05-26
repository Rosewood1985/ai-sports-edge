-- Migration: Create MLB Teams table
-- This migration creates the core MLB teams table with comprehensive team information

CREATE TABLE IF NOT EXISTS mlb_teams (
    id VARCHAR(10) PRIMARY KEY, -- "NYY", "BOS", "LAD", etc.
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL, -- "New York Yankees"
    city VARCHAR(50) NOT NULL,
    division VARCHAR(20) NOT NULL, -- "AL East", "NL Central", etc.
    league VARCHAR(2) NOT NULL, -- "AL", "NL"
    
    -- Stadium Information
    stadium_name VARCHAR(100),
    stadium_capacity INTEGER,
    field_dimensions JSON, -- {"left_field": 310, "center_field": 408, "right_field": 314}
    altitude INTEGER, -- feet above sea level (important for Coors Field)
    field_surface VARCHAR(50), -- "Natural Grass", "Artificial Turf"
    foul_territory_size VARCHAR(20), -- "Large", "Medium", "Small"
    
    -- Team Colors and Branding
    primary_color VARCHAR(7), -- hex color
    secondary_color VARCHAR(7),
    logo_url VARCHAR(200),
    
    -- Current Season Information
    current_wins INTEGER DEFAULT 0,
    current_losses INTEGER DEFAULT 0,
    current_ties INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    winning_percentage DECIMAL(4,3) DEFAULT 0.000,
    runs_scored INTEGER DEFAULT 0,
    runs_allowed INTEGER DEFAULT 0,
    run_differential INTEGER DEFAULT 0,
    
    -- Payroll and Financial Data
    payroll_total DECIMAL(15,2),
    payroll_rank INTEGER,
    luxury_tax_status BOOLEAN DEFAULT FALSE,
    
    -- Team Management
    manager VARCHAR(100),
    general_manager VARCHAR(100),
    owner VARCHAR(100),
    
    -- Advanced Team Statistics
    team_era DECIMAL(4,2) DEFAULT 0.00,
    team_batting_average DECIMAL(4,3) DEFAULT 0.000,
    team_ops DECIMAL(4,3) DEFAULT 0.000,
    team_fielding_percentage DECIMAL(4,3) DEFAULT 0.000,
    
    -- Home Field Advantage Metrics
    home_record VARCHAR(10), -- "45-36"
    away_record VARCHAR(10), -- "41-40"
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'mlb_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_division (division),
    INDEX idx_league (league),
    INDEX idx_winning_percentage (winning_percentage DESC),
    INDEX idx_last_updated (last_updated)
);

-- Create MLB team season statistics table for historical tracking
CREATE TABLE IF NOT EXISTS mlb_team_season_stats (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    season_year INTEGER NOT NULL,
    
    -- Season Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    winning_percentage DECIMAL(4,3) DEFAULT 0.000,
    division_rank INTEGER,
    league_rank INTEGER,
    playoff_appearance BOOLEAN DEFAULT FALSE,
    playoff_result VARCHAR(50), -- "World Series Champions", "Division Series", etc.
    
    -- Offensive Statistics
    runs_scored INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    team_batting_average DECIMAL(4,3) DEFAULT 0.000,
    team_on_base_percentage DECIMAL(4,3) DEFAULT 0.000,
    team_slugging_percentage DECIMAL(4,3) DEFAULT 0.000,
    team_ops DECIMAL(4,3) DEFAULT 0.000,
    
    -- Pitching Statistics
    runs_allowed INTEGER DEFAULT 0,
    earned_runs_allowed INTEGER DEFAULT 0,
    team_era DECIMAL(4,2) DEFAULT 0.00,
    innings_pitched DECIMAL(6,1) DEFAULT 0.0,
    strikeouts INTEGER DEFAULT 0,
    walks_allowed INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    blown_saves INTEGER DEFAULT 0,
    
    -- Fielding Statistics
    errors INTEGER DEFAULT 0,
    double_plays INTEGER DEFAULT 0,
    team_fielding_percentage DECIMAL(4,3) DEFAULT 0.000,
    
    -- Advanced Metrics
    runs_created INTEGER DEFAULT 0,
    pythagorean_wins DECIMAL(4,1) DEFAULT 0.0,
    strength_of_schedule DECIMAL(4,3) DEFAULT 0.000,
    
    -- Attendance and Revenue
    total_attendance INTEGER,
    average_attendance INTEGER,
    season_revenue DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES mlb_teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_season (team_id, season_year),
    INDEX idx_team_season_stats (team_id),
    INDEX idx_season_year (season_year),
    INDEX idx_playoff_teams (playoff_appearance, season_year)
);

-- Create MLB stadiums table for detailed venue information
CREATE TABLE IF NOT EXISTS mlb_stadiums (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    stadium_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(30),
    country VARCHAR(50) DEFAULT 'United States',
    
    -- Physical Characteristics
    capacity INTEGER,
    opened_year INTEGER,
    surface_type VARCHAR(50), -- "Natural Grass", "Artificial Turf"
    roof_type VARCHAR(50), -- "Open", "Retractable", "Fixed Dome"
    
    -- Field Dimensions
    left_field_distance INTEGER, -- feet
    left_center_distance INTEGER,
    center_field_distance INTEGER,
    right_center_distance INTEGER,
    right_field_distance INTEGER,
    left_field_height INTEGER, -- wall height in feet
    center_field_height INTEGER,
    right_field_height INTEGER,
    foul_territory_rating VARCHAR(20), -- "Large", "Average", "Small"
    
    -- Environmental Factors
    altitude INTEGER, -- feet above sea level
    climate_type VARCHAR(50), -- "Humid Continental", "Desert", "Mediterranean"
    average_wind_speed DECIMAL(4,1), -- mph
    prevailing_wind_direction VARCHAR(10), -- "Out to RF", "In from LF"
    
    -- Ballpark Factors (relative to league average = 1.000)
    home_run_factor DECIMAL(4,3) DEFAULT 1.000,
    doubles_factor DECIMAL(4,3) DEFAULT 1.000,
    triples_factor DECIMAL(4,3) DEFAULT 1.000,
    
    -- Historical Significance
    notable_features TEXT,
    famous_moments TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES mlb_teams(id) ON DELETE CASCADE,
    INDEX idx_team_stadium (team_id),
    INDEX idx_stadium_name (stadium_name)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_mlb_teams_timestamp 
    BEFORE UPDATE ON mlb_teams 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample MLB teams for testing (optional)
INSERT INTO mlb_teams (
    id, name, full_name, city, division, league, stadium_name, 
    current_wins, current_losses, manager
) VALUES 
('NYY', 'Yankees', 'New York Yankees', 'New York', 'AL East', 'AL', 'Yankee Stadium', 85, 65, 'Aaron Boone'),
('BOS', 'Red Sox', 'Boston Red Sox', 'Boston', 'AL East', 'AL', 'Fenway Park', 78, 72, 'Alex Cora'),
('LAD', 'Dodgers', 'Los Angeles Dodgers', 'Los Angeles', 'NL West', 'NL', 'Dodger Stadium', 95, 55, 'Dave Roberts'),
('SF', 'Giants', 'San Francisco Giants', 'San Francisco', 'NL West', 'NL', 'Oracle Park', 82, 68, 'Gabe Kapler'),
('HOU', 'Astros', 'Houston Astros', 'Houston', 'AL West', 'AL', 'Minute Maid Park', 88, 62, 'Dusty Baker')
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample stadium data
INSERT INTO mlb_stadiums (
    team_id, stadium_name, city, capacity, opened_year, surface_type,
    left_field_distance, center_field_distance, right_field_distance,
    left_field_height, altitude
) VALUES 
('NYY', 'Yankee Stadium', 'New York', 47309, 2009, 'Natural Grass', 318, 408, 314, 8, 55),
('BOS', 'Fenway Park', 'Boston', 37755, 1912, 'Natural Grass', 310, 420, 302, 37, 20),
('LAD', 'Dodger Stadium', 'Los Angeles', 56000, 1962, 'Natural Grass', 330, 395, 330, 8, 340),
('SF', 'Oracle Park', 'San Francisco', 41915, 2000, 'Natural Grass', 339, 399, 309, 8, 8),
('HOU', 'Minute Maid Park', 'Houston', 41168, 2000, 'Natural Grass', 315, 436, 326, 19, 22)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Commit the changes
COMMIT;