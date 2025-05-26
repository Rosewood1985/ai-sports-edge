-- Migration: Create WNBA Players table
-- This migration creates the core WNBA players table with comprehensive player information and international play tracking

CREATE TABLE IF NOT EXISTS wnba_players (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Basic Information
    position VARCHAR(5) NOT NULL, -- "PG", "SG", "SF", "PF", "C"
    jersey_number INTEGER,
    primary_position VARCHAR(5), -- main position
    secondary_position VARCHAR(5), -- backup position capability
    
    -- Physical Statistics
    height VARCHAR(10), -- "5'9""
    weight INTEGER, -- pounds
    wingspan VARCHAR(10), -- "6'1""
    birth_date DATE,
    age INTEGER,
    birth_city VARCHAR(100),
    birth_state VARCHAR(50),
    birth_country VARCHAR(50),
    
    -- Educational Background
    college VARCHAR(100),
    college_conference VARCHAR(50),
    high_school VARCHAR(100),
    college_major VARCHAR(100),
    
    -- WNBA Career Information
    wnba_experience INTEGER DEFAULT 0, -- years in WNBA
    seasons_with_current_team INTEGER DEFAULT 0,
    
    -- Draft Information
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    drafted_by_team VARCHAR(10),
    undrafted_free_agent BOOLEAN DEFAULT FALSE,
    
    -- International Basketball Experience (Critical for WNBA)
    plays_overseas BOOLEAN DEFAULT FALSE,
    current_overseas_team VARCHAR(100),
    overseas_league VARCHAR(50), -- "EuroLeague", "Chinese League", "Australian WNBL"
    overseas_country VARCHAR(50),
    overseas_season_salary DECIMAL(10,2), -- often higher than WNBA salary
    overseas_contract_start DATE,
    overseas_contract_end DATE,
    overseas_return_date DATE, -- when returning to WNBA
    
    -- International Performance Tracking
    overseas_games_played INTEGER DEFAULT 0,
    overseas_points_per_game DECIMAL(4,1),
    overseas_rebounds_per_game DECIMAL(4,1),
    overseas_assists_per_game DECIMAL(4,1),
    overseas_performance_rating DECIMAL(3,2), -- 1-10 scale
    fitness_level_overseas ENUM('Excellent', 'Good', 'Concerning', 'Unknown') DEFAULT 'Good',
    
    -- Current Season WNBA Statistics
    games_played INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,
    minutes_per_game DECIMAL(4,1) DEFAULT 0.0,
    points_per_game DECIMAL(4,1) DEFAULT 0.0,
    rebounds_per_game DECIMAL(4,1) DEFAULT 0.0,
    assists_per_game DECIMAL(4,1) DEFAULT 0.0,
    steals_per_game DECIMAL(4,1) DEFAULT 0.0,
    blocks_per_game DECIMAL(4,1) DEFAULT 0.0,
    turnovers_per_game DECIMAL(4,1) DEFAULT 0.0,
    
    -- Shooting Statistics
    field_goal_percentage DECIMAL(4,3) DEFAULT 0.000,
    three_point_percentage DECIMAL(4,3) DEFAULT 0.000,
    free_throw_percentage DECIMAL(4,3) DEFAULT 0.000,
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    three_pointers_made INTEGER DEFAULT 0,
    three_pointers_attempted INTEGER DEFAULT 0,
    free_throws_made INTEGER DEFAULT 0,
    free_throws_attempted INTEGER DEFAULT 0,
    
    -- Advanced Statistics
    player_efficiency_rating DECIMAL(4,1) DEFAULT 0.0,
    true_shooting_percentage DECIMAL(4,3) DEFAULT 0.000,
    effective_field_goal_percentage DECIMAL(4,3) DEFAULT 0.000,
    usage_rate DECIMAL(4,1) DEFAULT 0.0, -- percentage of team possessions used
    assist_to_turnover_ratio DECIMAL(4,2) DEFAULT 0.00,
    win_shares DECIMAL(4,1) DEFAULT 0.0,
    value_over_replacement_player DECIMAL(4,1) DEFAULT 0.0,
    
    -- Defensive Statistics
    defensive_rating DECIMAL(5,2) DEFAULT 0.00,
    defensive_win_shares DECIMAL(4,1) DEFAULT 0.0,
    steal_percentage DECIMAL(4,1) DEFAULT 0.0,
    block_percentage DECIMAL(4,1) DEFAULT 0.0,
    defensive_rebounds_per_game DECIMAL(4,1) DEFAULT 0.0,
    
    -- Contract and Financial Information
    wnba_salary DECIMAL(8,2), -- WNBA salaries are much lower than overseas
    contract_type VARCHAR(50), -- "Rookie Scale", "Veteran", "Supermax", "Hardship"
    contract_years_remaining INTEGER,
    
    -- Performance Trends and Splits
    home_vs_away_performance DECIMAL(4,2), -- ratio of home to away performance
    vs_top_teams_performance DECIMAL(4,2), -- performance against winning teams
    clutch_performance_rating DECIMAL(3,2), -- 1-10 scale in close games
    fourth_quarter_performance DECIMAL(4,2), -- performance in final quarter
    
    -- Health and Conditioning
    injury_status ENUM('Active', 'Day-to-Day', 'Out', 'International Leave') DEFAULT 'Active',
    injury_description VARCHAR(200),
    injury_date DATE,
    expected_return_date DATE,
    conditioning_level VARCHAR(20), -- "Excellent", "Good", "Poor" (important for overseas returns)
    weight_change_overseas DECIMAL(4,1), -- pounds gained/lost overseas
    
    -- Travel and Adaptation Factors
    jet_lag_adjustment_days INTEGER, -- typical days to adjust from overseas
    cultural_adaptation_score DECIMAL(3,2), -- 1-10 for adjusting between leagues
    language_barriers BOOLEAN DEFAULT FALSE,
    family_situation VARCHAR(100), -- affects overseas decisions
    
    -- Leadership and Team Dynamics
    team_captain BOOLEAN DEFAULT FALSE,
    veteran_leadership_role BOOLEAN DEFAULT FALSE,
    mentor_to_rookies BOOLEAN DEFAULT FALSE,
    locker_room_presence VARCHAR(20), -- "Positive", "Neutral", "Challenging"
    
    -- Awards and Recognition
    all_star_selections INTEGER DEFAULT 0,
    all_wnba_first_team INTEGER DEFAULT 0,
    all_wnba_second_team INTEGER DEFAULT 0,
    rookie_of_year BOOLEAN DEFAULT FALSE,
    mvp_votes INTEGER DEFAULT 0,
    defensive_player_of_year_votes INTEGER DEFAULT 0,
    sixth_woman_of_year_votes INTEGER DEFAULT 0,
    most_improved_player_votes INTEGER DEFAULT 0,
    
    -- International Achievements
    olympic_appearances INTEGER DEFAULT 0,
    world_cup_appearances INTEGER DEFAULT 0,
    overseas_league_championships INTEGER DEFAULT 0,
    overseas_individual_awards INTEGER DEFAULT 0,
    
    -- Social Impact and Marketing
    social_media_following INTEGER DEFAULT 0,
    community_involvement_score DECIMAL(3,2), -- 1-10 scale
    endorsement_deals INTEGER DEFAULT 0,
    media_availability VARCHAR(20), -- "High", "Medium", "Low"
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'wnba_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (team_id) REFERENCES wnba_teams(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_team_id (team_id),
    INDEX idx_position (position),
    INDEX idx_overseas_status (plays_overseas),
    INDEX idx_overseas_return (overseas_return_date),
    INDEX idx_injury_status (injury_status),
    INDEX idx_performance_rating (player_efficiency_rating DESC),
    INDEX idx_international_experience (overseas_games_played DESC),
    INDEX idx_last_updated (last_updated)
);

-- Create WNBA player overseas history table for detailed international tracking
CREATE TABLE IF NOT EXISTS wnba_player_overseas_history (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    
    -- Overseas Contract Details
    season_year INTEGER NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    league_name VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    
    -- Contract Information
    contract_start_date DATE,
    contract_end_date DATE,
    salary_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    contract_bonuses DECIMAL(8,2) DEFAULT 0,
    
    -- Performance Statistics
    games_played INTEGER DEFAULT 0,
    minutes_per_game DECIMAL(4,1) DEFAULT 0.0,
    points_per_game DECIMAL(4,1) DEFAULT 0.0,
    rebounds_per_game DECIMAL(4,1) DEFAULT 0.0,
    assists_per_game DECIMAL(4,1) DEFAULT 0.0,
    field_goal_percentage DECIMAL(4,3) DEFAULT 0.000,
    three_point_percentage DECIMAL(4,3) DEFAULT 0.000,
    
    -- Team Success
    team_record VARCHAR(20), -- "22-8" or similar
    playoff_appearance BOOLEAN DEFAULT FALSE,
    championship_won BOOLEAN DEFAULT FALSE,
    individual_awards VARCHAR(200), -- any awards won
    
    -- Physical and Mental Impact
    weight_change DECIMAL(4,1), -- pounds gained/lost during season
    injury_occurrences INTEGER DEFAULT 0,
    stress_level VARCHAR(20), -- "Low", "Medium", "High"
    adaptation_difficulty VARCHAR(20), -- "Easy", "Moderate", "Difficult"
    
    -- Cultural and Personal Factors
    language_of_communication VARCHAR(50),
    cultural_adjustment_rating DECIMAL(3,2), -- 1-10 scale
    family_accompaniment BOOLEAN DEFAULT FALSE,
    housing_quality VARCHAR(20), -- "Excellent", "Good", "Poor"
    team_support_quality VARCHAR(20),
    
    -- Return Impact Assessment
    wnba_return_fitness_level VARCHAR(20), -- condition upon return
    wnba_performance_change DECIMAL(5,2), -- percentage change in performance
    adjustment_period_games INTEGER, -- games needed to readjust to WNBA
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES wnba_players(id) ON DELETE CASCADE,
    INDEX idx_player_overseas_history (player_id),
    INDEX idx_season_year (season_year),
    INDEX idx_league_country (league_name, country),
    INDEX idx_performance_overseas (points_per_game DESC, rebounds_per_game DESC)
);

-- Create WNBA player career statistics table for historical tracking
CREATE TABLE IF NOT EXISTS wnba_player_career_stats (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    season_year INTEGER NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Season Context
    was_overseas_previous_season BOOLEAN DEFAULT FALSE,
    games_missed_due_to_overseas INTEGER DEFAULT 0,
    
    -- Season Totals
    games_played INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    total_rebounds INTEGER DEFAULT 0,
    total_assists INTEGER DEFAULT 0,
    total_steals INTEGER DEFAULT 0,
    total_blocks INTEGER DEFAULT 0,
    total_turnovers INTEGER DEFAULT 0,
    
    -- Shooting Totals
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    three_pointers_made INTEGER DEFAULT 0,
    three_pointers_attempted INTEGER DEFAULT 0,
    free_throws_made INTEGER DEFAULT 0,
    free_throws_attempted INTEGER DEFAULT 0,
    
    -- Advanced Metrics
    player_efficiency_rating DECIMAL(4,1) DEFAULT 0.0,
    win_shares DECIMAL(4,1) DEFAULT 0.0,
    usage_rate DECIMAL(4,1) DEFAULT 0.0,
    
    -- Awards and Recognition for Season
    all_star_selection BOOLEAN DEFAULT FALSE,
    all_wnba_team VARCHAR(10), -- "First", "Second", or NULL
    rookie_of_year BOOLEAN DEFAULT FALSE,
    mvp_votes INTEGER DEFAULT 0,
    other_award_votes INTEGER DEFAULT 0,
    
    -- Playoff Performance (if applicable)
    playoff_games_played INTEGER DEFAULT 0,
    playoff_points_per_game DECIMAL(4,1) DEFAULT 0.0,
    playoff_rebounds_per_game DECIMAL(4,1) DEFAULT 0.0,
    playoff_assists_per_game DECIMAL(4,1) DEFAULT 0.0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES wnba_players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES wnba_teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_season (player_id, season_year),
    INDEX idx_player_career (player_id),
    INDEX idx_season_year (season_year),
    INDEX idx_awards (all_star_selection, all_wnba_team)
);

-- Create WNBA player performance analytics table for advanced metrics
CREATE TABLE IF NOT EXISTS wnba_player_performance_analytics (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    analysis_date DATE NOT NULL,
    
    -- Performance Trend Analysis
    recent_form_rating DECIMAL(3,2), -- 1-10 based on last 10 games
    season_trajectory VARCHAR(20), -- "Improving", "Declining", "Stable"
    consistency_score DECIMAL(3,2), -- 1-10 based on game-to-game variance
    
    -- Situational Performance
    clutch_time_performance DECIMAL(4,3), -- shooting percentage in final 5 minutes
    vs_winning_teams_performance DECIMAL(4,3), -- performance against top teams
    home_court_advantage_factor DECIMAL(4,2), -- home vs away performance ratio
    back_to_back_performance DECIMAL(4,2), -- performance on consecutive nights
    
    -- International Impact Metrics
    overseas_fatigue_factor DECIMAL(3,2), -- impact of overseas play on current performance
    jet_lag_recovery_score DECIMAL(3,2), -- how well player adapts to time changes
    cultural_adaptation_impact DECIMAL(3,2), -- effect of moving between leagues
    
    -- Physical and Mental Condition
    conditioning_level_score DECIMAL(3,2), -- 1-10 based on various factors
    injury_risk_assessment DECIMAL(3,2), -- 1-10 scale
    mental_fatigue_score DECIMAL(3,2), -- based on travel, pressure, etc.
    
    -- Team Chemistry and Role
    team_chemistry_rating DECIMAL(3,2), -- how well player fits with current team
    role_satisfaction_score DECIMAL(3,2), -- comfort with current role
    leadership_effectiveness DECIMAL(3,2), -- impact as leader if applicable
    
    -- Future Projection
    overseas_departure_likelihood DECIMAL(3,2), -- probability of playing overseas next season
    performance_projection_next_season DECIMAL(4,1), -- projected PER
    contract_negotiation_leverage DECIMAL(3,2), -- 1-10 scale
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES wnba_players(id) ON DELETE CASCADE,
    INDEX idx_player_analytics (player_id),
    INDEX idx_analysis_date (analysis_date),
    INDEX idx_performance_ratings (recent_form_rating DESC, consistency_score DESC)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_wnba_players_timestamp 
    BEFORE UPDATE ON wnba_players 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample WNBA players for testing (optional)
INSERT INTO wnba_players (
    id, name, team_id, position, jersey_number, height, weight,
    college, points_per_game, rebounds_per_game, assists_per_game, plays_overseas
) VALUES 
('aja_wilson', 'A\'ja Wilson', 'LAS', 'PF', 22, '6\'4"', 195, 'South Carolina', 22.8, 9.4, 2.3, FALSE),
('breanna_stewart', 'Breanna Stewart', 'NY', 'PF', 30, '6\'4"', 170, 'Connecticut', 23.0, 9.3, 3.8, TRUE),
('sue_bird', 'Sue Bird', 'SEA', 'PG', 10, '5\'9"', 150, 'Connecticut', 5.2, 2.5, 5.3, FALSE),
('diana_taurasi', 'Diana Taurasi', 'PHX', 'SG', 3, '6\'0"', 163, 'Connecticut', 16.7, 4.1, 3.4, TRUE),
('candace_parker', 'Candace Parker', 'CHI', 'PF', 3, '6\'4"', 175, 'Tennessee', 13.2, 8.6, 4.5, FALSE)
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample overseas history
INSERT INTO wnba_player_overseas_history (
    player_id, season_year, team_name, league_name, country,
    games_played, points_per_game, rebounds_per_game
) VALUES 
('breanna_stewart', 2019, 'Dynamo Kursk', 'Russian Premier League', 'Russia', 28, 18.7, 8.2),
('diana_taurasi', 2020, 'UMMC Ekaterinburg', 'Russian Premier League', 'Russia', 22, 15.3, 4.8)
ON DUPLICATE KEY UPDATE
    player_id = VALUES(player_id);

-- Commit the changes
COMMIT;