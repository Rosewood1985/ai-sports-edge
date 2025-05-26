-- Migration: Create NFL Players table
-- This migration creates the core NFL players table with comprehensive player information and advanced injury tracking

CREATE TABLE IF NOT EXISTS nfl_players (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Basic Information
    position VARCHAR(5) NOT NULL, -- "QB", "RB", "WR", "TE", "OL", "DE", "DT", "LB", "CB", "S", "K", "P"
    jersey_number INTEGER,
    depth_chart_order INTEGER, -- 1 = starter, 2 = backup, etc.
    position_group VARCHAR(20), -- "Offense", "Defense", "Special Teams"
    
    -- Physical Statistics
    height VARCHAR(10), -- "6'4""
    weight INTEGER, -- pounds
    age INTEGER,
    birth_date DATE,
    birth_city VARCHAR(100),
    birth_state VARCHAR(50),
    birth_country VARCHAR(50) DEFAULT 'United States',
    
    -- Educational Background
    college VARCHAR(100),
    college_conference VARCHAR(50),
    high_school VARCHAR(100),
    
    -- NFL Career Information
    nfl_experience INTEGER DEFAULT 0, -- years in NFL
    seasons_with_current_team INTEGER DEFAULT 0,
    
    -- Draft Information
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    draft_overall_pick INTEGER,
    drafted_by_team VARCHAR(10), -- team that originally drafted
    undrafted_free_agent BOOLEAN DEFAULT FALSE,
    
    -- Contract Information
    salary DECIMAL(12,2), -- annual salary
    cap_hit DECIMAL(12,2), -- salary cap impact
    contract_years_remaining INTEGER,
    guaranteed_money DECIMAL(12,2),
    signing_bonus DECIMAL(12,2),
    contract_type VARCHAR(50), -- "Rookie", "Veteran", "Franchise Tag", "Transition Tag"
    
    -- Performance Metrics (varies by position)
    pff_grade DECIMAL(4,1), -- Pro Football Focus overall grade (0-100)
    pff_offense_grade DECIMAL(4,1),
    pff_defense_grade DECIMAL(4,1),
    pff_special_teams_grade DECIMAL(4,1),
    
    -- Snap Counts and Usage
    offensive_snaps INTEGER DEFAULT 0,
    defensive_snaps INTEGER DEFAULT 0,
    special_teams_snaps INTEGER DEFAULT 0,
    total_snaps INTEGER DEFAULT 0,
    snap_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Position-Specific Statistics (JSON for flexibility across positions)
    season_stats JSON, -- Current season stats specific to position
    career_stats JSON, -- Career totals
    advanced_metrics JSON, -- Position-specific advanced analytics
    
    -- Injury Status and History
    injury_status ENUM('Healthy', 'Questionable', 'Doubtful', 'Out', 'IR', 'PUP', 'NFI', 'Suspended') DEFAULT 'Healthy',
    injury_description VARCHAR(200),
    injury_date DATE,
    injury_severity VARCHAR(20), -- "Minor", "Moderate", "Serious", "Season-Ending"
    expected_return_date DATE,
    games_missed_current_season INTEGER DEFAULT 0,
    career_games_missed INTEGER DEFAULT 0,
    
    -- Injury Risk Assessment
    injury_prone_rating DECIMAL(3,2), -- 0.00 to 10.00 scale
    concussion_history INTEGER DEFAULT 0, -- number of documented concussions
    major_surgeries INTEGER DEFAULT 0,
    last_major_injury_date DATE,
    recovery_timeline_days INTEGER,
    
    -- Performance Impact
    performance_decline_percentage DECIMAL(5,2), -- % decline when returning from injury
    missed_practice_percentage DECIMAL(5,2), -- % of practices missed due to injury
    
    -- Fantasy and Betting Relevance
    fantasy_points_season DECIMAL(6,2) DEFAULT 0.00,
    fantasy_points_per_game DECIMAL(5,2) DEFAULT 0.00,
    target_share DECIMAL(5,2), -- for skill position players
    red_zone_usage INTEGER DEFAULT 0,
    goal_line_usage INTEGER DEFAULT 0,
    
    -- Character and Leadership
    team_captain BOOLEAN DEFAULT FALSE,
    leadership_rating VARCHAR(20), -- "High", "Medium", "Low"
    locker_room_presence VARCHAR(20), -- "Positive", "Neutral", "Negative"
    
    -- Awards and Recognition
    pro_bowl_selections INTEGER DEFAULT 0,
    all_pro_selections INTEGER DEFAULT 0,
    rookie_of_year BOOLEAN DEFAULT FALSE,
    mvp_votes INTEGER DEFAULT 0,
    defensive_player_of_year_votes INTEGER DEFAULT 0,
    
    -- Social Media and Marketing Value
    social_media_following INTEGER DEFAULT 0,
    endorsement_deals INTEGER DEFAULT 0,
    marketability_rating VARCHAR(20), -- "High", "Medium", "Low"
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'nfl_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (team_id) REFERENCES nfl_teams(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_team_position (team_id, position),
    INDEX idx_injury_status (injury_status),
    INDEX idx_depth_chart (team_id, position, depth_chart_order),
    INDEX idx_contract_value (salary DESC, cap_hit DESC),
    INDEX idx_performance_grades (pff_grade DESC),
    INDEX idx_injury_history (injury_prone_rating DESC, concussion_history DESC),
    INDEX idx_last_updated (last_updated)
);

-- Create NFL player injury history table for detailed tracking
CREATE TABLE IF NOT EXISTS nfl_player_injury_history (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    
    -- Injury Details
    injury_type VARCHAR(100) NOT NULL, -- "Concussion", "ACL Tear", "Hamstring Strain"
    body_part VARCHAR(50) NOT NULL, -- "Head", "Knee", "Shoulder", "Ankle"
    injury_severity VARCHAR(20) NOT NULL, -- "Minor", "Moderate", "Serious", "Career-Threatening"
    
    -- Timeline
    injury_date DATE NOT NULL,
    diagnosis_date DATE,
    surgery_date DATE,
    initial_return_estimate DATE,
    actual_return_date DATE,
    full_recovery_date DATE,
    
    -- Impact Assessment
    games_missed INTEGER DEFAULT 0,
    practices_missed INTEGER DEFAULT 0,
    playoff_impact BOOLEAN DEFAULT FALSE, -- did injury affect playoffs
    season_ending BOOLEAN DEFAULT FALSE,
    career_threatening BOOLEAN DEFAULT FALSE,
    
    -- Medical Information
    medical_professional VARCHAR(100), -- doctor/surgeon name
    surgery_required BOOLEAN DEFAULT FALSE,
    surgery_type VARCHAR(100),
    rehabilitation_facility VARCHAR(100),
    second_opinion_sought BOOLEAN DEFAULT FALSE,
    
    -- Performance Impact
    performance_before_injury DECIMAL(4,1), -- PFF grade before injury
    performance_after_return DECIMAL(4,1), -- PFF grade after return
    performance_decline DECIMAL(5,2), -- percentage decline
    full_performance_recovery_games INTEGER, -- games to return to form
    
    -- Recurrence Risk
    recurrence_risk VARCHAR(20), -- "High", "Medium", "Low"
    related_to_previous_injury BOOLEAN DEFAULT FALSE,
    previous_injury_id INTEGER, -- self-referential to related injury
    
    -- Context
    injury_mechanism VARCHAR(100), -- "Contact", "Non-contact", "Overuse"
    field_conditions VARCHAR(50), -- "Dry", "Wet", "Frozen"
    weather_conditions VARCHAR(50),
    opponent_team VARCHAR(10),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES nfl_players(id) ON DELETE CASCADE,
    INDEX idx_player_injury_history (player_id),
    INDEX idx_injury_type_severity (injury_type, injury_severity),
    INDEX idx_injury_date (injury_date),
    INDEX idx_body_part (body_part),
    INDEX idx_recurrence_risk (recurrence_risk)
);

-- Create NFL player contract details table
CREATE TABLE IF NOT EXISTS nfl_player_contracts (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    
    -- Contract Basics
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    guaranteed_money DECIMAL(15,2) DEFAULT 0,
    signing_bonus DECIMAL(12,2) DEFAULT 0,
    
    -- Annual Breakdown
    year_1_salary DECIMAL(12,2),
    year_2_salary DECIMAL(12,2),
    year_3_salary DECIMAL(12,2),
    year_4_salary DECIMAL(12,2),
    year_5_salary DECIMAL(12,2),
    
    -- Incentives and Bonuses
    performance_incentives DECIMAL(12,2) DEFAULT 0,
    playoff_bonuses DECIMAL(8,2) DEFAULT 0,
    award_bonuses DECIMAL(8,2) DEFAULT 0,
    workout_bonuses DECIMAL(6,2) DEFAULT 0,
    
    -- Cap Implications
    dead_money_current_year DECIMAL(12,2) DEFAULT 0,
    dead_money_future_years DECIMAL(12,2) DEFAULT 0,
    cap_savings_if_released DECIMAL(12,2) DEFAULT 0,
    
    -- Contract Structure
    frontloaded BOOLEAN DEFAULT FALSE,
    backloaded BOOLEAN DEFAULT FALSE,
    restructurable BOOLEAN DEFAULT FALSE,
    trade_clause BOOLEAN DEFAULT FALSE,
    no_franchise_tag_clause BOOLEAN DEFAULT FALSE,
    
    -- Market Context
    contract_rank_at_position INTEGER, -- ranking among position players at signing
    percentage_of_cap DECIMAL(5,2), -- percentage of team's cap at signing
    market_value_vs_contract DECIMAL(12,2), -- over/under market value
    
    is_current BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES nfl_players(id) ON DELETE CASCADE,
    INDEX idx_player_contracts (player_id),
    INDEX idx_contract_value (total_value DESC),
    INDEX idx_contract_dates (contract_start_date, contract_end_date),
    INDEX idx_current_contracts (is_current)
);

-- Create NFL player performance analytics table
CREATE TABLE IF NOT EXISTS nfl_player_performance_analytics (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    week_number INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    
    -- Game Context
    opponent_team VARCHAR(10),
    home_away ENUM('Home', 'Away'),
    weather_conditions VARCHAR(50),
    field_surface VARCHAR(50),
    
    -- Performance Metrics (position-specific, stored as JSON for flexibility)
    performance_metrics JSON,
    
    -- Efficiency Ratings
    efficiency_rating DECIMAL(5,2), -- position-specific efficiency
    pressure_performance DECIMAL(5,2), -- performance under pressure
    clutch_performance DECIMAL(5,2), -- performance in critical situations
    
    -- Physical Condition Indicators
    snap_count INTEGER DEFAULT 0,
    target_share DECIMAL(5,2), -- for skill positions
    usage_rate DECIMAL(5,2), -- percentage of team's plays
    fatigue_factor DECIMAL(3,2), -- 1.0 = normal, >1.0 = fatigued
    
    -- Injury Impact
    injury_limitation_factor DECIMAL(3,2), -- 1.0 = no limitation
    missed_practice_time INTEGER, -- minutes missed during week
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES nfl_players(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_week_season (player_id, week_number, season_year),
    INDEX idx_player_performance (player_id),
    INDEX idx_week_season (week_number, season_year),
    INDEX idx_efficiency_ratings (efficiency_rating DESC)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_nfl_players_timestamp 
    BEFORE UPDATE ON nfl_players 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample NFL players for testing (optional)
INSERT INTO nfl_players (
    id, name, team_id, position, jersey_number, height, weight, age,
    college, salary, pff_grade
) VALUES 
('patrick_mahomes', 'Patrick Mahomes', 'KC', 'QB', 15, '6\'3"', 230, 28, 'Texas Tech', 45000000, 90.5),
('josh_allen', 'Josh Allen', 'BUF', 'QB', 17, '6\'5"', 237, 27, 'Wyoming', 43000000, 88.2),
('jalen_hurts', 'Jalen Hurts', 'PHI', 'QB', 1, '6\'1"', 223, 25, 'Oklahoma', 51000000, 87.8),
('travis_kelce', 'Travis Kelce', 'KC', 'TE', 87, '6\'5"', 250, 34, 'Cincinnati', 14000000, 92.1),
('stefon_diggs', 'Stefon Diggs', 'BUF', 'WR', 14, '6\'0"', 191, 30, 'Maryland', 24000000, 89.3)
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample injury history
INSERT INTO nfl_player_injury_history (
    player_id, injury_type, body_part, injury_severity, injury_date,
    games_missed, surgery_required
) VALUES 
('patrick_mahomes', 'High Ankle Sprain', 'Ankle', 'Moderate', '2023-01-21', 0, FALSE),
('josh_allen', 'Shoulder Strain', 'Shoulder', 'Minor', '2023-11-05', 0, FALSE),
('travis_kelce', 'Knee Hyperextension', 'Knee', 'Minor', '2023-09-17', 1, FALSE)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Commit the changes
COMMIT;