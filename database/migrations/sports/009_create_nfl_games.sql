-- Migration: Create NFL Games table
-- This migration creates the core NFL games table with comprehensive game information and weather analysis

CREATE TABLE IF NOT EXISTS nfl_games (
    id VARCHAR(20) PRIMARY KEY,
    season_year INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    game_date DATETIME NOT NULL,
    
    -- Teams
    home_team_id VARCHAR(10) NOT NULL,
    away_team_id VARCHAR(10) NOT NULL,
    
    -- Game Classification
    game_type ENUM('Preseason', 'Regular', 'Wild Card', 'Divisional', 'Conference Championship', 'Super Bowl') DEFAULT 'Regular',
    playoff_round VARCHAR(50), -- "Wild Card Round", "Divisional Round", etc.
    
    -- Venue Information
    venue VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(30),
    is_neutral_site BOOLEAN DEFAULT FALSE,
    
    -- Weather Conditions (critical for NFL betting and performance)
    weather_temp INTEGER, -- Fahrenheit
    weather_feels_like INTEGER, -- wind chill/heat index
    weather_wind_speed INTEGER, -- mph
    weather_wind_direction VARCHAR(20), -- "N", "NE", "E", "SE", "S", "SW", "W", "NW"
    weather_wind_gusts INTEGER, -- mph
    weather_humidity INTEGER, -- percentage
    weather_barometric_pressure DECIMAL(5,2), -- inches of mercury
    weather_precipitation_chance INTEGER, -- percentage
    weather_precipitation_type VARCHAR(20), -- "None", "Rain", "Snow", "Sleet"
    weather_visibility DECIMAL(4,1), -- miles
    weather_conditions VARCHAR(50), -- "Clear", "Overcast", "Light Rain", "Heavy Snow"
    field_conditions VARCHAR(50), -- "Good", "Fair", "Poor"
    
    -- Game Result
    home_team_score INTEGER,
    away_team_score INTEGER,
    game_status ENUM('Scheduled', 'In Progress', 'Final', 'Final OT', 'Postponed', 'Cancelled') DEFAULT 'Scheduled',
    overtime_periods INTEGER DEFAULT 0,
    game_length_minutes INTEGER, -- total game time including delays
    attendance INTEGER,
    
    -- Scoring Summary
    home_q1_score INTEGER DEFAULT 0,
    home_q2_score INTEGER DEFAULT 0,
    home_q3_score INTEGER DEFAULT 0,
    home_q4_score INTEGER DEFAULT 0,
    home_ot_score INTEGER DEFAULT 0,
    away_q1_score INTEGER DEFAULT 0,
    away_q2_score INTEGER DEFAULT 0,
    away_q3_score INTEGER DEFAULT 0,
    away_q4_score INTEGER DEFAULT 0,
    away_ot_score INTEGER DEFAULT 0,
    
    -- Betting Information
    opening_spread DECIMAL(4,1), -- points
    closing_spread DECIMAL(4,1),
    opening_spread_juice_home INTEGER, -- e.g., -110
    closing_spread_juice_home INTEGER,
    opening_total DECIMAL(4,1), -- over/under points
    closing_total DECIMAL(4,1),
    opening_total_juice_over INTEGER,
    closing_total_juice_over INTEGER,
    opening_moneyline_home INTEGER,
    opening_moneyline_away INTEGER,
    closing_moneyline_home INTEGER,
    closing_moneyline_away INTEGER,
    
    -- Team Performance Statistics
    home_total_yards INTEGER,
    away_total_yards INTEGER,
    home_passing_yards INTEGER,
    away_passing_yards INTEGER,
    home_rushing_yards INTEGER,
    away_rushing_yards INTEGER,
    home_first_downs INTEGER,
    away_first_downs INTEGER,
    home_third_down_conversions INTEGER,
    home_third_down_attempts INTEGER,
    away_third_down_conversions INTEGER,
    away_third_down_attempts INTEGER,
    home_red_zone_conversions INTEGER,
    home_red_zone_attempts INTEGER,
    away_red_zone_conversions INTEGER,
    away_red_zone_attempts INTEGER,
    
    -- Turnovers and Penalties
    home_turnovers INTEGER DEFAULT 0,
    away_turnovers INTEGER DEFAULT 0,
    home_fumbles_lost INTEGER DEFAULT 0,
    away_fumbles_lost INTEGER DEFAULT 0,
    home_interceptions_thrown INTEGER DEFAULT 0,
    away_interceptions_thrown INTEGER DEFAULT 0,
    home_penalties INTEGER DEFAULT 0,
    away_penalties INTEGER DEFAULT 0,
    home_penalty_yards INTEGER DEFAULT 0,
    away_penalty_yards INTEGER DEFAULT 0,
    
    -- Time of Possession
    home_time_of_possession TIME,
    away_time_of_possession TIME,
    
    -- Special Teams
    home_field_goals_made INTEGER DEFAULT 0,
    home_field_goals_attempted INTEGER DEFAULT 0,
    away_field_goals_made INTEGER DEFAULT 0,
    away_field_goals_attempted INTEGER DEFAULT 0,
    home_punt_return_yards INTEGER DEFAULT 0,
    away_punt_return_yards INTEGER DEFAULT 0,
    home_kickoff_return_yards INTEGER DEFAULT 0,
    away_kickoff_return_yards INTEGER DEFAULT 0,
    
    -- Advanced Metrics
    home_expected_points DECIMAL(5,2), -- based on drive starts and field position
    away_expected_points DECIMAL(5,2),
    home_epa_per_play DECIMAL(4,3), -- Expected Points Added per play
    away_epa_per_play DECIMAL(4,3),
    home_success_rate DECIMAL(5,2), -- percentage of successful plays
    away_success_rate DECIMAL(5,2),
    
    -- Officiating Crew
    referee VARCHAR(100),
    umpire VARCHAR(100),
    head_linesman VARCHAR(100),
    line_judge VARCHAR(100),
    field_judge VARCHAR(100),
    side_judge VARCHAR(100),
    back_judge VARCHAR(100),
    
    -- Broadcast Information
    tv_network VARCHAR(50), -- "CBS", "FOX", "NBC", "ESPN", "Amazon"
    national_broadcast BOOLEAN DEFAULT FALSE,
    prime_time BOOLEAN DEFAULT FALSE,
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'nfl_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (home_team_id) REFERENCES nfl_teams(id) ON DELETE RESTRICT,
    FOREIGN KEY (away_team_id) REFERENCES nfl_teams(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_season_week (season_year, week_number),
    INDEX idx_game_date (game_date),
    INDEX idx_teams (home_team_id, away_team_id),
    INDEX idx_game_status (game_status),
    INDEX idx_game_type (game_type),
    INDEX idx_weather (weather_temp, weather_wind_speed),
    INDEX idx_betting_lines (opening_spread, closing_spread, opening_total),
    INDEX idx_prime_time (prime_time, national_broadcast)
);

-- Create NFL weather impact analysis table
CREATE TABLE IF NOT EXISTS nfl_weather_impact_analysis (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(20) NOT NULL,
    
    -- Weather Impact Factors
    temperature_impact_score DECIMAL(4,2), -- -10 to +10 scale
    wind_impact_score DECIMAL(4,2), -- impact on passing game
    precipitation_impact_score DECIMAL(4,2), -- impact on ball handling
    field_condition_impact_score DECIMAL(4,2), -- impact on footing
    overall_weather_impact DECIMAL(4,2), -- combined impact score
    
    -- Predicted Game Impact
    passing_game_difficulty DECIMAL(3,2), -- 1.0 = normal, >1.0 = more difficult
    kicking_game_difficulty DECIMAL(3,2),
    turnover_probability_increase DECIMAL(5,2), -- percentage increase
    total_points_adjustment DECIMAL(4,1), -- expected +/- points from weather
    
    -- Position-Specific Impact
    qb_performance_adjustment DECIMAL(4,2), -- percentage adjustment
    kicker_accuracy_adjustment DECIMAL(4,2),
    wr_production_adjustment DECIMAL(4,2),
    rb_usage_adjustment DECIMAL(4,2),
    
    -- Historical Weather Performance
    home_team_cold_weather_record VARCHAR(10), -- "5-3" for games under 32°F
    away_team_cold_weather_record VARCHAR(10),
    home_team_wind_game_record VARCHAR(10), -- record in games with 15+ mph winds
    away_team_wind_game_record VARCHAR(10),
    home_team_dome_to_outdoor_performance DECIMAL(4,2), -- adjustment factor
    away_team_dome_to_outdoor_performance DECIMAL(4,2),
    
    -- Actual vs Predicted (post-game analysis)
    actual_total_points INTEGER,
    predicted_total_points DECIMAL(4,1),
    weather_prediction_accuracy DECIMAL(5,2), -- how accurate was weather impact prediction
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES nfl_games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_weather_analysis (game_id),
    INDEX idx_weather_impact_scores (overall_weather_impact DESC),
    INDEX idx_temperature_impact (temperature_impact_score)
);

-- Create NFL player game performance table
CREATE TABLE IF NOT EXISTS nfl_player_game_performance (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(20) NOT NULL,
    player_id VARCHAR(20) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Game Context
    started_game BOOLEAN DEFAULT FALSE,
    snap_count INTEGER DEFAULT 0,
    snap_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Position-Specific Performance (JSON for flexibility)
    performance_stats JSON,
    
    -- Efficiency Metrics
    pff_game_grade DECIMAL(4,1),
    epa_contributed DECIMAL(6,2), -- Expected Points Added by player
    success_rate DECIMAL(5,2), -- percentage of successful plays
    
    -- Injury Impact
    injury_limitation BOOLEAN DEFAULT FALSE,
    played_through_injury BOOLEAN DEFAULT FALSE,
    injury_exit_game BOOLEAN DEFAULT FALSE,
    
    -- Weather Impact on Performance
    weather_adjusted_performance DECIMAL(4,2), -- performance relative to weather conditions
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES nfl_games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES nfl_players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES nfl_teams(id) ON DELETE CASCADE,
    INDEX idx_game_player_performance (game_id, player_id),
    INDEX idx_player_game_performance (player_id),
    INDEX idx_team_game_performance (team_id, game_id)
);

-- Create NFL game injuries table for tracking in-game injuries
CREATE TABLE IF NOT EXISTS nfl_game_injuries (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(20) NOT NULL,
    player_id VARCHAR(20) NOT NULL,
    
    -- Injury Details
    quarter INTEGER NOT NULL,
    time_remaining TIME,
    injury_type VARCHAR(100),
    body_part VARCHAR(50),
    
    -- Injury Context
    play_type VARCHAR(50), -- "Passing", "Rushing", "Punt Return", etc.
    injury_mechanism VARCHAR(100), -- "Contact", "Non-contact", "Awkward landing"
    return_to_game BOOLEAN DEFAULT FALSE,
    evaluation_type VARCHAR(50), -- "Concussion Protocol", "X-Ray", "MRI"
    
    -- Immediate Impact
    left_game_immediately BOOLEAN DEFAULT FALSE,
    helped_off_field BOOLEAN DEFAULT FALSE,
    carted_off_field BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES nfl_games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES nfl_players(id) ON DELETE CASCADE,
    INDEX idx_game_injuries (game_id),
    INDEX idx_player_injuries (player_id),
    INDEX idx_quarter_injuries (quarter)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_nfl_games_timestamp 
    BEFORE UPDATE ON nfl_games 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample NFL games for testing (optional)
INSERT INTO nfl_games (
    id, season_year, week_number, game_date, home_team_id, away_team_id,
    home_team_score, away_team_score, game_status, weather_temp, weather_wind_speed
) VALUES 
('KC_BUF_20240121', 2024, 21, '2024-01-21 18:30:00', 'BUF', 'KC', 24, 27, 'Final', 2, 8),
('PHI_SF_20240129', 2024, 22, '2024-01-29 15:00:00', 'PHI', 'SF', 31, 7, 'Final', 45, 5),
('KC_PHI_20240212', 2024, 23, '2024-02-12 18:30:00', 'PHI', 'KC', 35, 38, 'Final', 72, 12)
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample weather impact analysis
INSERT INTO nfl_weather_impact_analysis (
    game_id, temperature_impact_score, wind_impact_score, overall_weather_impact,
    passing_game_difficulty, total_points_adjustment
) VALUES 
('KC_BUF_20240121', -8.5, -3.2, -6.8, 1.4, -7.5),
('PHI_SF_20240129', 0.0, 0.0, 0.0, 1.0, 0.0),
('KC_PHI_20240212', 2.1, -1.5, 0.8, 1.1, 2.3)
ON DUPLICATE KEY UPDATE
    game_id = VALUES(game_id);

-- Commit the changes
COMMIT;