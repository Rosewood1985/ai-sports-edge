-- Migration: Create NFL Teams table
-- This migration creates the core NFL teams table with comprehensive team information

CREATE TABLE IF NOT EXISTS nfl_teams (
    id VARCHAR(10) PRIMARY KEY, -- "NE", "GB", "DAL", "KC", etc.
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL, -- "New England Patriots"
    city VARCHAR(50) NOT NULL,
    conference VARCHAR(3) NOT NULL, -- "AFC", "NFC"
    division VARCHAR(10) NOT NULL, -- "East", "North", "South", "West"
    
    -- Stadium Information
    stadium_name VARCHAR(100),
    stadium_capacity INTEGER,
    is_dome BOOLEAN DEFAULT FALSE,
    retractable_roof BOOLEAN DEFAULT FALSE,
    field_surface VARCHAR(50), -- "Natural Grass", "FieldTurf", "Artificial Turf"
    
    -- Current Season Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    winning_percentage DECIMAL(4,3) DEFAULT 0.000,
    division_rank INTEGER,
    conference_rank INTEGER,
    
    -- Points and Yardage
    points_scored INTEGER DEFAULT 0,
    points_allowed INTEGER DEFAULT 0,
    point_differential INTEGER DEFAULT 0,
    total_yards_offense INTEGER DEFAULT 0,
    total_yards_defense INTEGER DEFAULT 0,
    yards_differential INTEGER DEFAULT 0,
    
    -- Team Salary Cap and Financial Information
    salary_cap_space DECIMAL(15,2), -- remaining cap space in dollars
    dead_money DECIMAL(15,2), -- dead money counting against cap
    total_cap_commitments DECIMAL(15,2),
    luxury_tax_penalties DECIMAL(15,2) DEFAULT 0,
    
    -- Coaching Staff
    head_coach VARCHAR(100),
    offensive_coordinator VARCHAR(100),
    defensive_coordinator VARCHAR(100),
    special_teams_coordinator VARCHAR(100),
    
    -- Team Performance Metrics
    offensive_efficiency DECIMAL(5,2), -- yards per play
    defensive_efficiency DECIMAL(5,2), -- opponent yards per play
    turnover_differential INTEGER DEFAULT 0,
    penalty_yards_per_game DECIMAL(5,1),
    time_of_possession_avg TIME, -- average per game
    
    -- Special Teams Statistics
    field_goal_percentage DECIMAL(5,2),
    punt_return_average DECIMAL(4,1),
    kickoff_return_average DECIMAL(4,1),
    
    -- Strength of Schedule
    strength_of_schedule DECIMAL(4,3), -- opponents' combined win percentage
    strength_of_victory DECIMAL(4,3), -- defeated opponents' win percentage
    
    -- Home Field Advantage
    home_record VARCHAR(10), -- "6-2"
    away_record VARCHAR(10), -- "4-4"
    division_record VARCHAR(10), -- "3-1"
    conference_record VARCHAR(10), -- "8-4"
    
    -- Team Colors and Branding
    primary_color VARCHAR(7), -- hex color
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    logo_url VARCHAR(200),
    
    -- Playoff Information
    playoff_appearances INTEGER DEFAULT 0,
    super_bowl_wins INTEGER DEFAULT 0,
    last_playoff_appearance INTEGER, -- year
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'nfl_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_conference_division (conference, division),
    INDEX idx_winning_percentage (winning_percentage DESC),
    INDEX idx_point_differential (point_differential DESC),
    INDEX idx_last_updated (last_updated)
);

-- Create NFL team season statistics table for historical tracking
CREATE TABLE IF NOT EXISTS nfl_team_season_stats (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    season_year INTEGER NOT NULL,
    
    -- Season Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    winning_percentage DECIMAL(4,3) DEFAULT 0.000,
    division_rank INTEGER,
    conference_rank INTEGER,
    playoff_seed INTEGER,
    playoff_result VARCHAR(50), -- "Super Bowl Champions", "Conference Championship", etc.
    
    -- Offensive Statistics
    points_scored INTEGER DEFAULT 0,
    total_yards_offense INTEGER DEFAULT 0,
    passing_yards INTEGER DEFAULT 0,
    rushing_yards INTEGER DEFAULT 0,
    first_downs INTEGER DEFAULT 0,
    third_down_conversion_rate DECIMAL(5,2),
    red_zone_efficiency DECIMAL(5,2),
    turnovers_lost INTEGER DEFAULT 0,
    
    -- Defensive Statistics
    points_allowed INTEGER DEFAULT 0,
    total_yards_defense INTEGER DEFAULT 0,
    passing_yards_allowed INTEGER DEFAULT 0,
    rushing_yards_allowed INTEGER DEFAULT 0,
    sacks INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    fumbles_recovered INTEGER DEFAULT 0,
    turnovers_forced INTEGER DEFAULT 0,
    
    -- Special Teams
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    field_goal_percentage DECIMAL(5,2),
    punt_return_touchdowns INTEGER DEFAULT 0,
    kickoff_return_touchdowns INTEGER DEFAULT 0,
    
    -- Advanced Metrics
    dvoa_offense DECIMAL(5,2), -- Defense-adjusted Value Over Average
    dvoa_defense DECIMAL(5,2),
    dvoa_special_teams DECIMAL(5,2),
    dvoa_total DECIMAL(5,2),
    
    -- Injury Impact
    adjusted_games_lost DECIMAL(5,1), -- weighted by player importance
    injury_reserve_additions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES nfl_teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_season (team_id, season_year),
    INDEX idx_team_season_stats (team_id),
    INDEX idx_season_year (season_year),
    INDEX idx_playoff_teams (playoff_seed, season_year)
);

-- Create NFL stadiums table for detailed venue information
CREATE TABLE IF NOT EXISTS nfl_stadiums (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    stadium_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(30),
    country VARCHAR(50) DEFAULT 'United States',
    
    -- Physical Characteristics
    capacity INTEGER,
    opened_year INTEGER,
    surface_type VARCHAR(50), -- "Natural Grass", "FieldTurf", "Artificial Turf"
    roof_type VARCHAR(50), -- "Open", "Retractable", "Fixed Dome"
    
    -- Environmental Factors
    altitude INTEGER, -- feet above sea level
    climate_type VARCHAR(50), -- "Humid Continental", "Desert", "Coastal"
    average_wind_speed DECIMAL(4,1), -- mph
    prevailing_wind_direction VARCHAR(20),
    
    -- Home Field Advantage Factors
    crowd_noise_level DECIMAL(4,1), -- average decibels
    home_win_percentage DECIMAL(4,3), -- historical home win rate
    weather_impact_rating VARCHAR(20), -- "High", "Medium", "Low"
    
    -- Field Specifications
    field_length INTEGER DEFAULT 120, -- yards (including end zones)
    field_width INTEGER DEFAULT 53, -- yards
    end_zone_depth INTEGER DEFAULT 10, -- yards
    goal_post_height INTEGER DEFAULT 30, -- feet
    
    -- Notable Features
    notable_features TEXT,
    historic_moments TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES nfl_teams(id) ON DELETE CASCADE,
    INDEX idx_team_stadium (team_id),
    INDEX idx_stadium_name (stadium_name),
    INDEX idx_surface_type (surface_type)
);

-- Create NFL coaching staff table for detailed staff tracking
CREATE TABLE IF NOT EXISTS nfl_coaching_staff (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    coach_name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL, -- "Head Coach", "Offensive Coordinator", etc.
    hire_date DATE,
    contract_expiration DATE,
    
    -- Coaching Experience
    years_nfl_experience INTEGER DEFAULT 0,
    years_college_experience INTEGER DEFAULT 0,
    previous_positions TEXT,
    
    -- Performance Metrics
    career_wins INTEGER DEFAULT 0,
    career_losses INTEGER DEFAULT 0,
    playoff_appearances INTEGER DEFAULT 0,
    super_bowl_wins INTEGER DEFAULT 0,
    
    -- Specializations
    offensive_scheme VARCHAR(50), -- "West Coast", "Spread", "Power Run"
    defensive_scheme VARCHAR(50), -- "3-4", "4-3", "Multiple"
    coaching_philosophy TEXT,
    
    is_current BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES nfl_teams(id) ON DELETE CASCADE,
    INDEX idx_team_coaching (team_id),
    INDEX idx_coach_position (position),
    INDEX idx_current_staff (is_current)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_nfl_teams_timestamp 
    BEFORE UPDATE ON nfl_teams 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample NFL teams for testing (optional)
INSERT INTO nfl_teams (
    id, name, full_name, city, conference, division, stadium_name,
    wins, losses, head_coach
) VALUES 
('KC', 'Chiefs', 'Kansas City Chiefs', 'Kansas City', 'AFC', 'West', 'Arrowhead Stadium', 14, 3, 'Andy Reid'),
('BUF', 'Bills', 'Buffalo Bills', 'Buffalo', 'AFC', 'East', 'Highmark Stadium', 13, 3, 'Sean McDermott'),
('PHI', 'Eagles', 'Philadelphia Eagles', 'Philadelphia', 'NFC', 'East', 'Lincoln Financial Field', 14, 3, 'Nick Sirianni'),
('SF', '49ers', 'San Francisco 49ers', 'San Francisco', 'NFC', 'West', 'Levi\'s Stadium', 13, 4, 'Kyle Shanahan'),
('NE', 'Patriots', 'New England Patriots', 'Foxborough', 'AFC', 'East', 'Gillette Stadium', 8, 9, 'Bill Belichick')
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample stadium data
INSERT INTO nfl_stadiums (
    team_id, stadium_name, city, capacity, opened_year, surface_type,
    roof_type, altitude, crowd_noise_level
) VALUES 
('KC', 'Arrowhead Stadium', 'Kansas City', 76416, 1972, 'Natural Grass', 'Open', 750, 142.2),
('BUF', 'Highmark Stadium', 'Buffalo', 71608, 1973, 'FieldTurf', 'Open', 590, 135.0),
('PHI', 'Lincoln Financial Field', 'Philadelphia', 69596, 2003, 'FieldTurf', 'Open', 50, 130.0),
('SF', 'Levi\'s Stadium', 'Santa Clara', 68500, 2014, 'Natural Grass', 'Open', 40, 125.0),
('NE', 'Gillette Stadium', 'Foxborough', 65878, 2002, 'FieldTurf', 'Open', 150, 120.0)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample coaching staff
INSERT INTO nfl_coaching_staff (
    team_id, coach_name, position, hire_date, years_nfl_experience
) VALUES 
('KC', 'Andy Reid', 'Head Coach', '2013-01-04', 25),
('KC', 'Eric Bieniemy', 'Offensive Coordinator', '2018-01-01', 10),
('BUF', 'Sean McDermott', 'Head Coach', '2017-01-11', 20),
('PHI', 'Nick Sirianni', 'Head Coach', '2021-01-24', 15),
('SF', 'Kyle Shanahan', 'Head Coach', '2017-02-06', 18)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Commit the changes
COMMIT;