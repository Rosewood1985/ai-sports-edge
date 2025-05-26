-- Migration: Create MLB Games table
-- This migration creates the core MLB games table with comprehensive game information and analytics

CREATE TABLE IF NOT EXISTS mlb_games (
    id VARCHAR(20) PRIMARY KEY,
    season_year INTEGER NOT NULL,
    game_date DATE NOT NULL,
    game_time TIME,
    
    -- Teams
    home_team_id VARCHAR(10) NOT NULL,
    away_team_id VARCHAR(10) NOT NULL,
    
    -- Venue and Environmental Conditions
    venue VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(30),
    
    -- Weather Conditions (crucial for MLB betting)
    weather_temp INTEGER, -- Fahrenheit
    weather_wind_speed INTEGER, -- mph
    weather_wind_direction VARCHAR(20), -- "Out to RF", "In from LF", "Cross", "Variable"
    weather_humidity INTEGER, -- percentage
    weather_barometric_pressure DECIMAL(5,2), -- inches of mercury
    weather_conditions VARCHAR(50), -- "Clear", "Overcast", "Light Rain", "Heavy Rain"
    precipitation_chance INTEGER, -- percentage
    field_conditions VARCHAR(50), -- "Dry", "Wet", "Muddy"
    
    -- Game Information
    game_type VARCHAR(20) DEFAULT 'Regular Season', -- "Regular Season", "Playoff", "World Series"
    double_header BOOLEAN DEFAULT FALSE,
    game_number_in_series INTEGER, -- 1, 2, or 3 for double headers
    day_night ENUM('Day', 'Night') DEFAULT 'Night',
    attendance INTEGER,
    
    -- Game Result
    home_team_runs INTEGER,
    away_team_runs INTEGER,
    total_innings INTEGER DEFAULT 9,
    extra_innings BOOLEAN DEFAULT FALSE,
    game_status ENUM('Scheduled', 'Delayed', 'In Progress', 'Final', 'Postponed', 'Cancelled') DEFAULT 'Scheduled',
    game_length_minutes INTEGER, -- total game time
    
    -- Pitching Matchup
    home_starting_pitcher_id VARCHAR(20),
    away_starting_pitcher_id VARCHAR(20),
    home_winning_pitcher_id VARCHAR(20),
    away_winning_pitcher_id VARCHAR(20),
    losing_pitcher_id VARCHAR(20),
    save_pitcher_id VARCHAR(20),
    
    -- Betting Information
    opening_spread DECIMAL(4,1), -- run line (usually -1.5/+1.5)
    closing_spread DECIMAL(4,1),
    opening_spread_juice_home INTEGER, -- e.g., -110
    closing_spread_juice_home INTEGER,
    opening_total DECIMAL(4,1), -- over/under total runs
    closing_total DECIMAL(4,1),
    opening_total_juice_over INTEGER,
    closing_total_juice_over INTEGER,
    opening_moneyline_home INTEGER,
    opening_moneyline_away INTEGER,
    closing_moneyline_home INTEGER,
    closing_moneyline_away INTEGER,
    
    -- Game Statistics Summary
    total_hits_home INTEGER,
    total_hits_away INTEGER,
    total_errors_home INTEGER,
    total_errors_away INTEGER,
    left_on_base_home INTEGER,
    left_on_base_away INTEGER,
    
    -- Advanced Game Metrics
    home_team_expected_runs DECIMAL(4,2), -- based on baserunners and outs
    away_team_expected_runs DECIMAL(4,2),
    home_team_leverage_index DECIMAL(4,2), -- average leverage throughout game
    away_team_leverage_index DECIMAL(4,2),
    win_probability_added_home DECIMAL(4,2),
    win_probability_added_away DECIMAL(4,2),
    
    -- Umpire Information
    home_plate_umpire VARCHAR(100),
    first_base_umpire VARCHAR(100),
    second_base_umpire VARCHAR(100),
    third_base_umpire VARCHAR(100),
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'mlb_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (home_team_id) REFERENCES mlb_teams(id) ON DELETE RESTRICT,
    FOREIGN KEY (away_team_id) REFERENCES mlb_teams(id) ON DELETE RESTRICT,
    FOREIGN KEY (home_starting_pitcher_id) REFERENCES mlb_players(id) ON DELETE SET NULL,
    FOREIGN KEY (away_starting_pitcher_id) REFERENCES mlb_players(id) ON DELETE SET NULL,
    FOREIGN KEY (home_winning_pitcher_id) REFERENCES mlb_players(id) ON DELETE SET NULL,
    FOREIGN KEY (away_winning_pitcher_id) REFERENCES mlb_players(id) ON DELETE SET NULL,
    FOREIGN KEY (losing_pitcher_id) REFERENCES mlb_players(id) ON DELETE SET NULL,
    FOREIGN KEY (save_pitcher_id) REFERENCES mlb_players(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_game_date (game_date),
    INDEX idx_teams (home_team_id, away_team_id),
    INDEX idx_game_status (game_status),
    INDEX idx_season_year (season_year),
    INDEX idx_pitching_matchup (home_starting_pitcher_id, away_starting_pitcher_id),
    INDEX idx_weather (weather_temp, weather_wind_speed),
    INDEX idx_betting_lines (opening_total, closing_total)
);

-- Create MLB game line score table for inning-by-inning tracking
CREATE TABLE IF NOT EXISTS mlb_game_line_scores (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(20) NOT NULL,
    
    -- Inning-by-inning runs
    inning_1_home INTEGER DEFAULT 0,
    inning_1_away INTEGER DEFAULT 0,
    inning_2_home INTEGER DEFAULT 0,
    inning_2_away INTEGER DEFAULT 0,
    inning_3_home INTEGER DEFAULT 0,
    inning_3_away INTEGER DEFAULT 0,
    inning_4_home INTEGER DEFAULT 0,
    inning_4_away INTEGER DEFAULT 0,
    inning_5_home INTEGER DEFAULT 0,
    inning_5_away INTEGER DEFAULT 0,
    inning_6_home INTEGER DEFAULT 0,
    inning_6_away INTEGER DEFAULT 0,
    inning_7_home INTEGER DEFAULT 0,
    inning_7_away INTEGER DEFAULT 0,
    inning_8_home INTEGER DEFAULT 0,
    inning_8_away INTEGER DEFAULT 0,
    inning_9_home INTEGER DEFAULT 0,
    inning_9_away INTEGER DEFAULT 0,
    
    -- Extra innings (as JSON for flexibility)
    extra_innings_scores JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES mlb_games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_line_score (game_id),
    INDEX idx_game_line_scores (game_id)
);

-- Create MLB player game stats table for individual game performance
CREATE TABLE IF NOT EXISTS mlb_player_game_stats (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(20) NOT NULL,
    player_id VARCHAR(20) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Batting Performance
    at_bats INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    rbi INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    
    -- Pitching Performance (if applicable)
    innings_pitched DECIMAL(4,1) DEFAULT 0.0,
    hits_allowed INTEGER DEFAULT 0,
    runs_allowed INTEGER DEFAULT 0,
    earned_runs DECIMAL(4,1) DEFAULT 0.0,
    walks_allowed INTEGER DEFAULT 0,
    strikeouts_pitching INTEGER DEFAULT 0,
    
    -- Game Context
    batting_order_position INTEGER, -- 1-9
    fielding_position VARCHAR(10),
    starter BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES mlb_games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES mlb_players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES mlb_teams(id) ON DELETE CASCADE,
    INDEX idx_game_player_stats (game_id, player_id),
    INDEX idx_player_game_stats (player_id),
    INDEX idx_team_game_stats (team_id, game_id)
);

-- Create MLB weather impact analysis table
CREATE TABLE IF NOT EXISTS mlb_weather_impact (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(20) NOT NULL,
    
    -- Weather Factor Analysis
    wind_factor DECIMAL(4,2), -- multiplier for home run probability
    temperature_factor DECIMAL(4,2), -- effect on ball carry
    humidity_factor DECIMAL(4,2), -- effect on ball movement
    barometric_pressure_factor DECIMAL(4,2), -- effect on ball flight
    
    -- Predicted Impact
    expected_total_runs_adjustment DECIMAL(4,2), -- +/- runs from weather
    home_run_probability_adjustment DECIMAL(4,2), -- +/- percentage
    pitcher_advantage_score DECIMAL(4,2), -- higher = more pitcher friendly
    
    -- Actual vs Expected
    actual_impact_runs DECIMAL(4,2), -- calculated post-game
    weather_prediction_accuracy DECIMAL(4,2), -- how accurate was the prediction
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES mlb_games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_weather_impact (game_id),
    INDEX idx_weather_factors (wind_factor, temperature_factor)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_mlb_games_timestamp 
    BEFORE UPDATE ON mlb_games 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample MLB games for testing (optional)
INSERT INTO mlb_games (
    id, season_year, game_date, home_team_id, away_team_id, 
    home_team_runs, away_team_runs, game_status, attendance
) VALUES 
('NYY_BOS_20240515', 2024, '2024-05-15', 'NYY', 'BOS', 8, 4, 'Final', 47309),
('LAD_SF_20240516', 2024, '2024-05-16', 'LAD', 'SF', 6, 3, 'Final', 52000),
('HOU_SEA_20240517', 2024, '2024-05-17', 'HOU', 'SEA', 5, 7, 'Final', 41168)
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample line scores
INSERT INTO mlb_game_line_scores (
    game_id, inning_1_home, inning_1_away, inning_2_home, inning_2_away,
    inning_3_home, inning_3_away, inning_4_home, inning_4_away,
    inning_5_home, inning_5_away, inning_6_home, inning_6_away,
    inning_7_home, inning_7_away, inning_8_home, inning_8_away,
    inning_9_home, inning_9_away
) VALUES 
('NYY_BOS_20240515', 2, 0, 1, 2, 0, 1, 3, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0),
('LAD_SF_20240516', 0, 1, 2, 0, 1, 1, 1, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0)
ON DUPLICATE KEY UPDATE
    game_id = VALUES(game_id);

-- Commit the changes
COMMIT;