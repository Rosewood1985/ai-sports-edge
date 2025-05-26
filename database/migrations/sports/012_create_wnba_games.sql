-- Migration: Create WNBA Games table
-- This migration creates the core WNBA games table with comprehensive game information and performance analytics

CREATE TABLE IF NOT EXISTS wnba_games (
    id VARCHAR(20) PRIMARY KEY,
    season_year INTEGER NOT NULL,
    game_date DATE NOT NULL,
    game_time TIME,
    
    -- Teams
    home_team_id VARCHAR(10) NOT NULL,
    away_team_id VARCHAR(10) NOT NULL,
    
    -- Game Information
    venue VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(30),
    
    -- Game Type and Context
    game_type VARCHAR(20) DEFAULT 'Regular Season', -- "Regular Season", "Playoff", "Finals", "All-Star"
    playoff_round VARCHAR(30), -- "First Round", "Semifinals", "Finals"
    playoff_game_number INTEGER, -- 1, 2, 3 for playoff series
    commissioner_cup_game BOOLEAN DEFAULT FALSE, -- special mid-season tournament
    
    -- Schedule Context (important for WNBA due to condensed schedule)
    days_rest_home_team INTEGER, -- days since last game
    days_rest_away_team INTEGER,
    back_to_back_home BOOLEAN DEFAULT FALSE,
    back_to_back_away BOOLEAN DEFAULT FALSE,
    part_of_road_trip BOOLEAN DEFAULT FALSE, -- for away team
    road_trip_game_number INTEGER, -- which game in road trip
    
    -- Game Result
    home_team_score INTEGER,
    away_team_score INTEGER,
    total_score INTEGER GENERATED ALWAYS AS (home_team_score + away_team_score) STORED,
    game_status ENUM('Scheduled', 'In Progress', 'Final', 'Final OT', 'Postponed', 'Cancelled') DEFAULT 'Scheduled',
    overtime_periods INTEGER DEFAULT 0,
    attendance INTEGER,
    sellout BOOLEAN DEFAULT FALSE,
    
    -- Quarter Scoring
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
    
    -- Team Performance Statistics
    home_field_goals_made INTEGER DEFAULT 0,
    home_field_goals_attempted INTEGER DEFAULT 0,
    home_three_pointers_made INTEGER DEFAULT 0,
    home_three_pointers_attempted INTEGER DEFAULT 0,
    home_free_throws_made INTEGER DEFAULT 0,
    home_free_throws_attempted INTEGER DEFAULT 0,
    home_offensive_rebounds INTEGER DEFAULT 0,
    home_defensive_rebounds INTEGER DEFAULT 0,
    home_total_rebounds INTEGER DEFAULT 0,
    home_assists INTEGER DEFAULT 0,
    home_steals INTEGER DEFAULT 0,
    home_blocks INTEGER DEFAULT 0,
    home_turnovers INTEGER DEFAULT 0,
    home_personal_fouls INTEGER DEFAULT 0,
    
    away_field_goals_made INTEGER DEFAULT 0,
    away_field_goals_attempted INTEGER DEFAULT 0,
    away_three_pointers_made INTEGER DEFAULT 0,
    away_three_pointers_attempted INTEGER DEFAULT 0,
    away_free_throws_made INTEGER DEFAULT 0,
    away_free_throws_attempted INTEGER DEFAULT 0,
    away_offensive_rebounds INTEGER DEFAULT 0,
    away_defensive_rebounds INTEGER DEFAULT 0,
    away_total_rebounds INTEGER DEFAULT 0,
    away_assists INTEGER DEFAULT 0,
    away_steals INTEGER DEFAULT 0,
    away_blocks INTEGER DEFAULT 0,
    away_turnovers INTEGER DEFAULT 0,
    away_personal_fouls INTEGER DEFAULT 0,
    
    -- Advanced Team Statistics
    home_field_goal_percentage DECIMAL(4,3) GENERATED ALWAYS AS (
        CASE WHEN home_field_goals_attempted > 0 
        THEN home_field_goals_made / home_field_goals_attempted 
        ELSE 0 END
    ) STORED,
    away_field_goal_percentage DECIMAL(4,3) GENERATED ALWAYS AS (
        CASE WHEN away_field_goals_attempted > 0 
        THEN away_field_goals_made / away_field_goals_attempted 
        ELSE 0 END
    ) STORED,
    
    home_three_point_percentage DECIMAL(4,3) GENERATED ALWAYS AS (
        CASE WHEN home_three_pointers_attempted > 0 
        THEN home_three_pointers_made / home_three_pointers_attempted 
        ELSE 0 END
    ) STORED,
    away_three_point_percentage DECIMAL(4,3) GENERATED ALWAYS AS (
        CASE WHEN away_three_pointers_attempted > 0 
        THEN away_three_pointers_made / away_three_pointers_attempted 
        ELSE 0 END
    ) STORED,
    
    -- Pace and Efficiency Metrics
    total_possessions INTEGER, -- estimated possessions for both teams
    home_offensive_rating DECIMAL(5,2), -- points per 100 possessions
    away_offensive_rating DECIMAL(5,2),
    home_defensive_rating DECIMAL(5,2), -- opponent points per 100 possessions
    away_defensive_rating DECIMAL(5,2),
    pace DECIMAL(4,1), -- possessions per 40 minutes
    
    -- Key Player Impact
    home_leading_scorer VARCHAR(100),
    home_leading_scorer_points INTEGER,
    away_leading_scorer VARCHAR(100),
    away_leading_scorer_points INTEGER,
    home_leading_rebounder VARCHAR(100),
    home_leading_rebounder_rebounds INTEGER,
    away_leading_rebounder VARCHAR(100),
    away_leading_rebounder_rebounds INTEGER,
    
    -- International Player Impact (key for WNBA)
    home_international_players_minutes INTEGER DEFAULT 0, -- total minutes by international players
    away_international_players_minutes INTEGER DEFAULT 0,
    home_players_back_from_overseas INTEGER DEFAULT 0, -- players recently returned
    away_players_back_from_overseas INTEGER DEFAULT 0,
    
    -- Betting Information
    opening_spread DECIMAL(4,1), -- points
    closing_spread DECIMAL(4,1),
    opening_total DECIMAL(4,1), -- over/under points
    closing_total DECIMAL(4,1),
    opening_moneyline_home INTEGER,
    opening_moneyline_away INTEGER,
    closing_moneyline_home INTEGER,
    closing_moneyline_away INTEGER,
    
    -- Broadcast and Media
    tv_network VARCHAR(50), -- "ESPN", "CBS Sports Network", "Local"
    national_broadcast BOOLEAN DEFAULT FALSE,
    streaming_platform VARCHAR(50), -- "League Pass", "Prime Video"
    broadcast_crew VARCHAR(200),
    
    -- Game Flow and Momentum
    largest_lead_home INTEGER DEFAULT 0,
    largest_lead_away INTEGER DEFAULT 0,
    lead_changes INTEGER DEFAULT 0,
    times_tied INTEGER DEFAULT 0,
    
    -- Officiating
    referee_1 VARCHAR(100),
    referee_2 VARCHAR(100),
    referee_3 VARCHAR(100),
    technical_fouls_home INTEGER DEFAULT 0,
    technical_fouls_away INTEGER DEFAULT 0,
    flagrant_fouls INTEGER DEFAULT 0,
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'wnba_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (home_team_id) REFERENCES wnba_teams(id) ON DELETE RESTRICT,
    FOREIGN KEY (away_team_id) REFERENCES wnba_teams(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_season_year (season_year),
    INDEX idx_game_date (game_date),
    INDEX idx_teams (home_team_id, away_team_id),
    INDEX idx_game_status (game_status),
    INDEX idx_game_type (game_type),
    INDEX idx_total_score (total_score),
    INDEX idx_attendance (attendance DESC),
    INDEX idx_back_to_back (back_to_back_home, back_to_back_away)
);

-- Create WNBA player game performance table for individual game statistics
CREATE TABLE IF NOT EXISTS wnba_player_game_performance (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(20) NOT NULL,
    player_id VARCHAR(20) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Game Context
    started_game BOOLEAN DEFAULT FALSE,
    minutes_played DECIMAL(4,1) DEFAULT 0.0,
    
    -- Basic Statistics
    points INTEGER DEFAULT 0,
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    three_pointers_made INTEGER DEFAULT 0,
    three_pointers_attempted INTEGER DEFAULT 0,
    free_throws_made INTEGER DEFAULT 0,
    free_throws_attempted INTEGER DEFAULT 0,
    offensive_rebounds INTEGER DEFAULT 0,
    defensive_rebounds INTEGER DEFAULT 0,
    total_rebounds INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    personal_fouls INTEGER DEFAULT 0,
    
    -- Advanced Performance Metrics
    plus_minus INTEGER DEFAULT 0, -- team's point differential while player was on court
    usage_rate DECIMAL(4,1) DEFAULT 0.0, -- percentage of team possessions used
    efficiency_rating DECIMAL(4,1) DEFAULT 0.0, -- (PTS + REB + AST + STL + BLK - TO - missed FG - missed FT) / MIN
    
    -- Shooting Efficiency
    field_goal_percentage DECIMAL(4,3) GENERATED ALWAYS AS (
        CASE WHEN field_goals_attempted > 0 
        THEN field_goals_made / field_goals_attempted 
        ELSE 0 END
    ) STORED,
    three_point_percentage DECIMAL(4,3) GENERATED ALWAYS AS (
        CASE WHEN three_pointers_attempted > 0 
        THEN three_pointers_made / three_pointers_attempted 
        ELSE 0 END
    ) STORED,
    true_shooting_percentage DECIMAL(4,3) DEFAULT 0.000,
    
    -- Situational Performance
    first_quarter_points INTEGER DEFAULT 0,
    fourth_quarter_points INTEGER DEFAULT 0,
    clutch_performance BOOLEAN DEFAULT FALSE, -- significant contribution in final 5 minutes
    
    -- International Context (for players recently returned from overseas)
    days_since_overseas_return INTEGER, -- if recently returned from international play
    jet_lag_factor BOOLEAN DEFAULT FALSE, -- if affected by recent travel
    
    -- Game Impact Assessment
    game_high_scorer BOOLEAN DEFAULT FALSE,
    game_high_rebounder BOOLEAN DEFAULT FALSE,
    game_high_assists BOOLEAN DEFAULT FALSE,
    double_double BOOLEAN DEFAULT FALSE,
    triple_double BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES wnba_games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES wnba_players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES wnba_teams(id) ON DELETE CASCADE,
    INDEX idx_game_player_performance (game_id, player_id),
    INDEX idx_player_game_performance (player_id),
    INDEX idx_team_game_performance (team_id, game_id),
    INDEX idx_performance_ratings (efficiency_rating DESC, plus_minus DESC)
);

-- Create WNBA game analytics table for advanced game analysis
CREATE TABLE IF NOT EXISTS wnba_game_analytics (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(20) NOT NULL,
    
    -- Pace and Style Analysis
    game_pace_rating VARCHAR(20), -- "Fast", "Average", "Slow"
    offensive_style_home VARCHAR(30), -- "Perimeter-oriented", "Inside game", "Balanced"
    offensive_style_away VARCHAR(30),
    defensive_style_home VARCHAR(30), -- "Pressure defense", "Half-court", "Zone heavy"
    defensive_style_away VARCHAR(30),
    
    -- International Player Impact Analysis
    overseas_players_impact_home DECIMAL(4,2), -- percentage of team's production from international players
    overseas_players_impact_away DECIMAL(4,2),
    cultural_adjustment_factor DECIMAL(3,2), -- impact of players adjusting to WNBA style
    
    -- Competitive Balance Analysis
    competitive_balance_score DECIMAL(3,2), -- 1-10 scale of how competitive the game was
    momentum_swings INTEGER DEFAULT 0, -- number of significant momentum changes
    game_flow_rating VARCHAR(20), -- "Back-and-forth", "Dominant", "Comeback"
    
    -- Fatigue and Schedule Impact
    home_team_fatigue_factor DECIMAL(3,2), -- 1-5 scale based on recent schedule
    away_team_fatigue_factor DECIMAL(3,2),
    travel_impact_away_team DECIMAL(3,2), -- impact of travel on away team performance
    
    -- Performance Relative to Season Averages
    home_performance_vs_season DECIMAL(4,2), -- percentage above/below season average
    away_performance_vs_season DECIMAL(4,2),
    shooting_variance_home DECIMAL(4,2), -- how much shooting differed from season average
    shooting_variance_away DECIMAL(4,2),
    
    -- Clutch Performance Analysis
    clutch_plays_executed INTEGER DEFAULT 0, -- successful plays in final 5 minutes of close games
    clutch_plays_failed INTEGER DEFAULT 0,
    clutch_time_efficiency_home DECIMAL(4,2),
    clutch_time_efficiency_away DECIMAL(4,2),
    
    -- Coaching Impact
    timeout_effectiveness_home DECIMAL(3,2), -- 1-10 scale
    timeout_effectiveness_away DECIMAL(3,2),
    strategic_adjustments_home INTEGER DEFAULT 0, -- number of successful adjustments
    strategic_adjustments_away INTEGER DEFAULT 0,
    
    -- Referee Impact Analysis
    foul_calling_consistency DECIMAL(3,2), -- 1-10 scale
    home_team_foul_advantage INTEGER DEFAULT 0, -- differential in foul calls
    technical_foul_impact BOOLEAN DEFAULT FALSE, -- if technical fouls affected game flow
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES wnba_games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_analytics (game_id),
    INDEX idx_game_analytics_factors (competitive_balance_score DESC, game_pace_rating)
);

-- Create WNBA schedule impact analysis table
CREATE TABLE IF NOT EXISTS wnba_schedule_impact_analysis (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(20) NOT NULL,
    
    -- Rest and Recovery Analysis
    home_team_rest_advantage INTEGER, -- days of rest advantage over opponent
    away_team_travel_distance INTEGER, -- miles traveled for this game
    cumulative_travel_away_team INTEGER, -- total miles in last 10 days
    
    -- Schedule Density Impact
    games_in_last_week_home INTEGER,
    games_in_last_week_away INTEGER,
    practice_days_home INTEGER, -- practice days since last game
    practice_days_away INTEGER,
    
    -- International Player Schedule Factors
    players_with_overseas_fatigue_home INTEGER, -- players recently returned from overseas
    players_with_overseas_fatigue_away INTEGER,
    average_jet_lag_adjustment_home DECIMAL(3,1), -- average days since return
    average_jet_lag_adjustment_away DECIMAL(3,1),
    
    -- Performance Prediction Factors
    expected_fatigue_impact_home DECIMAL(4,2), -- predicted performance decrease due to fatigue
    expected_fatigue_impact_away DECIMAL(4,2),
    schedule_strength_recent_home DECIMAL(4,2), -- difficulty of recent opponents
    schedule_strength_recent_away DECIMAL(4,2),
    
    -- Actual vs Expected Performance
    actual_performance_impact_home DECIMAL(4,2), -- actual performance relative to prediction
    actual_performance_impact_away DECIMAL(4,2),
    schedule_prediction_accuracy DECIMAL(4,2), -- how accurate were the fatigue predictions
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES wnba_games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_schedule_analysis (game_id),
    INDEX idx_travel_analysis (away_team_travel_distance DESC, cumulative_travel_away_team DESC),
    INDEX idx_rest_analysis (home_team_rest_advantage, practice_days_home, practice_days_away)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_wnba_games_timestamp 
    BEFORE UPDATE ON wnba_games 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample WNBA games for testing (optional)
INSERT INTO wnba_games (
    id, season_year, game_date, home_team_id, away_team_id,
    home_team_score, away_team_score, game_status, attendance
) VALUES 
('LAS_SEA_20240515', 2024, '2024-05-15', 'LAS', 'SEA', 89, 81, 'Final', 11500),
('CHI_CON_20240516', 2024, '2024-05-16', 'CHI', 'CON', 78, 85, 'Final', 9800),
('NY_LAS_20240618', 2024, '2024-06-18', 'NY', 'LAS', 95, 92, 'Final', 17500)
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample player game performance
INSERT INTO wnba_player_game_performance (
    game_id, player_id, team_id, started_game, minutes_played,
    points, total_rebounds, assists, double_double
) VALUES 
('LAS_SEA_20240515', 'aja_wilson', 'LAS', TRUE, 35.2, 28, 12, 4, TRUE),
('NY_LAS_20240618', 'breanna_stewart', 'NY', TRUE, 38.5, 32, 11, 6, TRUE)
ON DUPLICATE KEY UPDATE
    game_id = VALUES(game_id);

-- Commit the changes
COMMIT;