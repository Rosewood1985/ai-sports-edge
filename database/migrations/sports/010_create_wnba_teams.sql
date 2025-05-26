-- Migration: Create WNBA Teams table
-- This migration creates the core WNBA teams table with comprehensive team information

CREATE TABLE IF NOT EXISTS wnba_teams (
    id VARCHAR(10) PRIMARY KEY, -- "LAS", "SEA", "CHI", "CON", etc.
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL, -- "Las Vegas Aces"
    city VARCHAR(50) NOT NULL,
    conference VARCHAR(10) NOT NULL, -- "Eastern", "Western"
    
    -- Arena Information
    arena_name VARCHAR(100),
    arena_capacity INTEGER,
    arena_opened_year INTEGER,
    court_surface VARCHAR(50), -- type of court surface
    
    -- Current Season Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    winning_percentage DECIMAL(4,3) DEFAULT 0.000,
    conference_rank INTEGER,
    league_rank INTEGER,
    
    -- Season Statistics
    points_per_game DECIMAL(5,2) DEFAULT 0.00,
    points_allowed_per_game DECIMAL(5,2) DEFAULT 0.00,
    point_differential DECIMAL(5,2) DEFAULT 0.00,
    field_goal_percentage DECIMAL(4,3) DEFAULT 0.000,
    three_point_percentage DECIMAL(4,3) DEFAULT 0.000,
    free_throw_percentage DECIMAL(4,3) DEFAULT 0.000,
    rebounds_per_game DECIMAL(4,1) DEFAULT 0.0,
    assists_per_game DECIMAL(4,1) DEFAULT 0.0,
    steals_per_game DECIMAL(4,1) DEFAULT 0.0,
    blocks_per_game DECIMAL(4,1) DEFAULT 0.0,
    turnovers_per_game DECIMAL(4,1) DEFAULT 0.0,
    
    -- Advanced Team Metrics
    offensive_rating DECIMAL(5,2) DEFAULT 0.00, -- points per 100 possessions
    defensive_rating DECIMAL(5,2) DEFAULT 0.00, -- opponent points per 100 possessions
    net_rating DECIMAL(5,2) DEFAULT 0.00, -- offensive - defensive rating
    pace DECIMAL(4,1) DEFAULT 0.0, -- possessions per 40 minutes
    effective_field_goal_percentage DECIMAL(4,3) DEFAULT 0.000,
    true_shooting_percentage DECIMAL(4,3) DEFAULT 0.000,
    
    -- Team Management
    head_coach VARCHAR(100),
    general_manager VARCHAR(100),
    owner VARCHAR(100),
    
    -- Franchise History
    franchise_established_year INTEGER,
    championships INTEGER DEFAULT 0,
    playoff_appearances INTEGER DEFAULT 0,
    conference_championships INTEGER DEFAULT 0,
    retired_numbers JSON, -- array of retired jersey numbers and names
    
    -- Home Court Advantage
    home_record VARCHAR(10), -- "14-6"
    away_record VARCHAR(10), -- "12-8"
    home_court_win_percentage DECIMAL(4,3),
    
    -- Financial and Attendance
    average_attendance INTEGER,
    season_attendance INTEGER,
    ticket_revenue DECIMAL(12,2),
    merchandise_revenue DECIMAL(12,2),
    
    -- Team Colors and Branding
    primary_color VARCHAR(7), -- hex color
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    logo_url VARCHAR(200),
    
    -- International and Development
    international_players INTEGER DEFAULT 0,
    rookie_players INTEGER DEFAULT 0,
    veteran_leadership_score DECIMAL(3,2), -- 1-10 scale
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'wnba_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_conference (conference),
    INDEX idx_winning_percentage (winning_percentage DESC),
    INDEX idx_net_rating (net_rating DESC),
    INDEX idx_last_updated (last_updated)
);

-- Create WNBA team season statistics table for historical tracking
CREATE TABLE IF NOT EXISTS wnba_team_season_stats (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    season_year INTEGER NOT NULL,
    
    -- Season Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    winning_percentage DECIMAL(4,3) DEFAULT 0.000,
    conference_rank INTEGER,
    league_rank INTEGER,
    playoff_seed INTEGER,
    playoff_result VARCHAR(50), -- "WNBA Champions", "Finals", "Semifinals", etc.
    
    -- Offensive Statistics
    games_played INTEGER DEFAULT 0,
    points_scored INTEGER DEFAULT 0,
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    three_pointers_made INTEGER DEFAULT 0,
    three_pointers_attempted INTEGER DEFAULT 0,
    free_throws_made INTEGER DEFAULT 0,
    free_throws_attempted INTEGER DEFAULT 0,
    offensive_rebounds INTEGER DEFAULT 0,
    total_rebounds INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    
    -- Defensive Statistics
    points_allowed INTEGER DEFAULT 0,
    opponent_field_goals_made INTEGER DEFAULT 0,
    opponent_field_goals_attempted INTEGER DEFAULT 0,
    defensive_rebounds INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    opponent_turnovers INTEGER DEFAULT 0,
    
    -- Advanced Metrics
    offensive_rating DECIMAL(5,2),
    defensive_rating DECIMAL(5,2),
    net_rating DECIMAL(5,2),
    pace DECIMAL(4,1),
    effective_field_goal_percentage DECIMAL(4,3),
    true_shooting_percentage DECIMAL(4,3),
    assist_to_turnover_ratio DECIMAL(4,2),
    
    -- Team Awards and Recognition
    coach_of_year BOOLEAN DEFAULT FALSE,
    executive_of_year BOOLEAN DEFAULT FALSE,
    all_star_selections INTEGER DEFAULT 0,
    all_wnba_selections INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES wnba_teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_season (team_id, season_year),
    INDEX idx_team_season_stats (team_id),
    INDEX idx_season_year (season_year),
    INDEX idx_playoff_teams (playoff_seed, season_year)
);

-- Create WNBA arenas table for detailed venue information
CREATE TABLE IF NOT EXISTS wnba_arenas (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    arena_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(30),
    country VARCHAR(50) DEFAULT 'United States',
    
    -- Physical Characteristics
    capacity INTEGER,
    opened_year INTEGER,
    renovation_year INTEGER,
    court_dimensions VARCHAR(50), -- typically standard but some variations
    
    -- Environmental Factors
    altitude INTEGER, -- feet above sea level
    climate_control_quality VARCHAR(20), -- "Excellent", "Good", "Average"
    lighting_quality VARCHAR(20),
    acoustics_rating VARCHAR(20), -- impact on crowd noise
    
    -- Fan Experience
    luxury_suites INTEGER,
    club_seats INTEGER,
    concession_variety_score DECIMAL(3,1), -- 1-10 scale
    parking_capacity INTEGER,
    public_transportation_access VARCHAR(20), -- "Excellent", "Good", "Limited"
    
    -- Basketball-Specific Features
    court_surface_brand VARCHAR(50),
    rim_height DECIMAL(4,2) DEFAULT 10.00, -- feet (standard is 10)
    backboard_type VARCHAR(50), -- "Tempered Glass", "Acrylic"
    shot_clock_type VARCHAR(50),
    
    -- Media and Technology
    video_board_size INTEGER, -- square feet
    sound_system_quality VARCHAR(20),
    wifi_quality VARCHAR(20),
    camera_positions INTEGER, -- for broadcasts
    
    -- Home Court Factors
    crowd_noise_average DECIMAL(4,1), -- decibels during games
    home_court_advantage_rating DECIMAL(3,2), -- 1-10 scale
    visitor_locker_room_quality VARCHAR(20), -- can impact visiting teams
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES wnba_teams(id) ON DELETE CASCADE,
    INDEX idx_team_arena (team_id),
    INDEX idx_arena_name (arena_name),
    INDEX idx_capacity (capacity DESC)
);

-- Create WNBA coaching staff table
CREATE TABLE IF NOT EXISTS wnba_coaching_staff (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    coach_name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL, -- "Head Coach", "Assistant Coach", "Player Development"
    hire_date DATE,
    contract_expiration DATE,
    
    -- Coaching Background
    years_wnba_coaching INTEGER DEFAULT 0,
    years_college_coaching INTEGER DEFAULT 0,
    years_international_coaching INTEGER DEFAULT 0,
    playing_career VARCHAR(200), -- summary of playing background
    
    -- Coaching Philosophy and Style
    coaching_style VARCHAR(50), -- "Defensive-minded", "Offensive innovator", "Player development"
    offensive_system VARCHAR(50), -- "Motion offense", "Pick and roll heavy", etc.
    defensive_system VARCHAR(50), -- "Man-to-man", "Zone", "Switching"
    
    -- Performance Record
    career_wins INTEGER DEFAULT 0,
    career_losses INTEGER DEFAULT 0,
    playoff_appearances INTEGER DEFAULT 0,
    championships INTEGER DEFAULT 0,
    coach_of_year_awards INTEGER DEFAULT 0,
    
    -- Specializations
    player_development_focus VARCHAR(100), -- "Young players", "International players", etc.
    known_for TEXT, -- key strengths and innovations
    
    is_current BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES wnba_teams(id) ON DELETE CASCADE,
    INDEX idx_team_coaching (team_id),
    INDEX idx_coach_position (position),
    INDEX idx_current_staff (is_current),
    INDEX idx_performance (career_wins DESC, career_losses ASC)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_wnba_teams_timestamp 
    BEFORE UPDATE ON wnba_teams 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample WNBA teams for testing (optional)
INSERT INTO wnba_teams (
    id, name, full_name, city, conference, arena_name,
    wins, losses, head_coach
) VALUES 
('LAS', 'Aces', 'Las Vegas Aces', 'Las Vegas', 'Western', 'Michelob ULTRA Arena', 34, 6, 'Becky Hammon'),
('SEA', 'Storm', 'Seattle Storm', 'Seattle', 'Western', 'Climate Pledge Arena', 22, 18, 'Noelle Quinn'),
('CHI', 'Sky', 'Chicago Sky', 'Chicago', 'Eastern', 'Wintrust Arena', 18, 22, 'James Wade'),
('CON', 'Sun', 'Connecticut Sun', 'Uncasville', 'Eastern', 'Mohegan Sun Arena', 27, 13, 'Stephanie White'),
('NY', 'Liberty', 'New York Liberty', 'New York', 'Eastern', 'Barclays Center', 32, 8, 'Sandy Brondello')
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample arena data
INSERT INTO wnba_arenas (
    team_id, arena_name, city, capacity, opened_year,
    court_surface_brand, home_court_advantage_rating
) VALUES 
('LAS', 'Michelob ULTRA Arena', 'Las Vegas', 12000, 2016, 'Connor Sports', 8.5),
('SEA', 'Climate Pledge Arena', 'Seattle', 18100, 2021, 'Connor Sports', 7.8),
('CHI', 'Wintrust Arena', 'Chicago', 10387, 2017, 'Robbins Sports', 7.2),
('CON', 'Mohegan Sun Arena', 'Uncasville', 10000, 1999, 'Connor Sports', 8.0),
('NY', 'Barclays Center', 'Brooklyn', 17732, 2012, 'Connor Sports', 6.5)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample coaching staff
INSERT INTO wnba_coaching_staff (
    team_id, coach_name, position, hire_date, years_wnba_coaching,
    coaching_style, career_wins, career_losses
) VALUES 
('LAS', 'Becky Hammon', 'Head Coach', '2021-12-31', 3, 'Player development', 68, 22),
('SEA', 'Noelle Quinn', 'Head Coach', '2021-01-01', 4, 'Defensive-minded', 45, 35),
('CHI', 'James Wade', 'Head Coach', '2019-12-19', 5, 'Offensive innovator', 52, 58),
('CON', 'Stephanie White', 'Head Coach', '2023-01-10', 8, 'System-oriented', 89, 71),
('NY', 'Sandy Brondello', 'Head Coach', '2021-01-08', 3, 'International experience', 58, 32)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Commit the changes
COMMIT;