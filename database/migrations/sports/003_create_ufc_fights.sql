-- Migration: Create UFC Fights table
-- This migration creates the fights table with comprehensive fight information

CREATE TABLE IF NOT EXISTS ufc_fights (
    id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    fighter1_id VARCHAR(50) NOT NULL,
    fighter2_id VARCHAR(50) NOT NULL,
    
    -- Fight Details
    fight_order INTEGER NOT NULL, -- 1 for main event, 2 for co-main, etc.
    card_type VARCHAR(50) NOT NULL, -- main_card, preliminary, early_prelims
    title_fight BOOLEAN DEFAULT false,
    interim_title_fight BOOLEAN DEFAULT false,
    weight_class VARCHAR(50) NOT NULL,
    scheduled_rounds INTEGER DEFAULT 3,
    scheduled_duration_minutes INTEGER DEFAULT 15, -- 3 rounds = 15 minutes, 5 rounds = 25 minutes
    
    -- Fight Status and Timing
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled, postponed
    actual_rounds INTEGER,
    fight_duration TIME, -- Actual duration in MM:SS format
    start_time DATETIME,
    end_time DATETIME,
    
    -- Fight Result
    result VARCHAR(50), -- win, loss, draw, no_contest, cancelled
    result_method VARCHAR(50), -- KO, TKO, submission, decision, DQ, etc.
    result_details TEXT, -- Specific submission type, injury details, etc.
    finish_round INTEGER,
    finish_time TIME,
    referee VARCHAR(100),
    judges JSON, -- Array of judge names and their scorecards
    
    -- Performance Bonuses
    fight_of_the_night BOOLEAN DEFAULT false,
    performance_of_the_night_fighter1 BOOLEAN DEFAULT false,
    performance_of_the_night_fighter2 BOOLEAN DEFAULT false,
    bonus_amount DECIMAL(10,2),
    
    -- Fight Analytics
    significant_strikes_fighter1 INTEGER DEFAULT 0,
    significant_strikes_fighter2 INTEGER DEFAULT 0,
    total_strikes_fighter1 INTEGER DEFAULT 0,
    total_strikes_fighter2 INTEGER DEFAULT 0,
    takedowns_fighter1 INTEGER DEFAULT 0,
    takedowns_fighter2 INTEGER DEFAULT 0,
    submission_attempts_fighter1 INTEGER DEFAULT 0,
    submission_attempts_fighter2 INTEGER DEFAULT 0,
    control_time_fighter1_seconds INTEGER DEFAULT 0,
    control_time_fighter2_seconds INTEGER DEFAULT 0,
    knockdowns_fighter1 INTEGER DEFAULT 0,
    knockdowns_fighter2 INTEGER DEFAULT 0,
    
    -- Fight Notes
    referee_notes TEXT,
    controversy_notes TEXT,
    injuries_during_fight TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (event_id) REFERENCES ufc_events(id) ON DELETE CASCADE,
    FOREIGN KEY (fighter1_id) REFERENCES ufc_fighters(id) ON DELETE RESTRICT,
    FOREIGN KEY (fighter2_id) REFERENCES ufc_fighters(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_event_fights (event_id),
    INDEX idx_fighter1 (fighter1_id),
    INDEX idx_fighter2 (fighter2_id),
    INDEX idx_status (status),
    INDEX idx_result (result),
    INDEX idx_weight_class (weight_class),
    INDEX idx_title_fight (title_fight),
    INDEX idx_fight_order (fight_order),
    INDEX idx_fight_date (start_time)
);

-- Create detailed round-by-round statistics table
CREATE TABLE IF NOT EXISTS ufc_fight_round_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fight_id VARCHAR(50) NOT NULL,
    round_number INTEGER NOT NULL,
    
    -- Fighter 1 Round Stats
    f1_significant_strikes INTEGER DEFAULT 0,
    f1_significant_strikes_attempted INTEGER DEFAULT 0,
    f1_total_strikes INTEGER DEFAULT 0,
    f1_total_strikes_attempted INTEGER DEFAULT 0,
    f1_takedowns INTEGER DEFAULT 0,
    f1_takedown_attempts INTEGER DEFAULT 0,
    f1_submission_attempts INTEGER DEFAULT 0,
    f1_control_time_seconds INTEGER DEFAULT 0,
    f1_knockdowns INTEGER DEFAULT 0,
    f1_cage_time_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Fighter 2 Round Stats
    f2_significant_strikes INTEGER DEFAULT 0,
    f2_significant_strikes_attempted INTEGER DEFAULT 0,
    f2_total_strikes INTEGER DEFAULT 0,
    f2_total_strikes_attempted INTEGER DEFAULT 0,
    f2_takedowns INTEGER DEFAULT 0,
    f2_takedown_attempts INTEGER DEFAULT 0,
    f2_submission_attempts INTEGER DEFAULT 0,
    f2_control_time_seconds INTEGER DEFAULT 0,
    f2_knockdowns INTEGER DEFAULT 0,
    f2_cage_time_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Round Control and Judging
    round_winner VARCHAR(50), -- fighter1, fighter2, draw
    judge_scores JSON, -- Individual judge scores for the round
    significant_moments TEXT, -- Key events in the round
    round_pace VARCHAR(20), -- slow, moderate, fast, frantic
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fight_id) REFERENCES ufc_fights(id) ON DELETE CASCADE,
    UNIQUE KEY unique_fight_round (fight_id, round_number),
    INDEX idx_fight_round_stats (fight_id),
    INDEX idx_round_number (round_number)
);

-- Create striking details table for granular striking data
CREATE TABLE IF NOT EXISTS ufc_fight_striking_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fight_id VARCHAR(50) NOT NULL,
    fighter_id VARCHAR(50) NOT NULL,
    round_number INTEGER,
    
    -- Striking Locations
    head_strikes INTEGER DEFAULT 0,
    head_strikes_attempted INTEGER DEFAULT 0,
    body_strikes INTEGER DEFAULT 0,
    body_strikes_attempted INTEGER DEFAULT 0,
    leg_strikes INTEGER DEFAULT 0,
    leg_strikes_attempted INTEGER DEFAULT 0,
    
    -- Striking Positions
    distance_strikes INTEGER DEFAULT 0,
    distance_strikes_attempted INTEGER DEFAULT 0,
    clinch_strikes INTEGER DEFAULT 0,
    clinch_strikes_attempted INTEGER DEFAULT 0,
    ground_strikes INTEGER DEFAULT 0,
    ground_strikes_attempted INTEGER DEFAULT 0,
    
    -- Strike Types
    jabs INTEGER DEFAULT 0,
    crosses INTEGER DEFAULT 0,
    hooks INTEGER DEFAULT 0,
    uppercuts INTEGER DEFAULT 0,
    kicks INTEGER DEFAULT 0,
    knees INTEGER DEFAULT 0,
    elbows INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fight_id) REFERENCES ufc_fights(id) ON DELETE CASCADE,
    FOREIGN KEY (fighter_id) REFERENCES ufc_fighters(id) ON DELETE CASCADE,
    INDEX idx_fight_striking (fight_id),
    INDEX idx_fighter_striking (fighter_id),
    INDEX idx_round_striking (round_number)
);

-- Create grappling details table
CREATE TABLE IF NOT EXISTS ufc_fight_grappling_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fight_id VARCHAR(50) NOT NULL,
    fighter_id VARCHAR(50) NOT NULL,
    round_number INTEGER,
    
    -- Takedown Details
    single_leg_attempts INTEGER DEFAULT 0,
    single_leg_successful INTEGER DEFAULT 0,
    double_leg_attempts INTEGER DEFAULT 0,
    double_leg_successful INTEGER DEFAULT 0,
    hip_toss_attempts INTEGER DEFAULT 0,
    hip_toss_successful INTEGER DEFAULT 0,
    slam_attempts INTEGER DEFAULT 0,
    slam_successful INTEGER DEFAULT 0,
    
    -- Ground Positions
    full_guard_time_seconds INTEGER DEFAULT 0,
    half_guard_time_seconds INTEGER DEFAULT 0,
    side_control_time_seconds INTEGER DEFAULT 0,
    mount_time_seconds INTEGER DEFAULT 0,
    back_control_time_seconds INTEGER DEFAULT 0,
    
    -- Submission Attempts by Type
    rear_naked_choke_attempts INTEGER DEFAULT 0,
    triangle_choke_attempts INTEGER DEFAULT 0,
    armbar_attempts INTEGER DEFAULT 0,
    kimura_attempts INTEGER DEFAULT 0,
    guillotine_attempts INTEGER DEFAULT 0,
    other_submission_attempts INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fight_id) REFERENCES ufc_fights(id) ON DELETE CASCADE,
    FOREIGN KEY (fighter_id) REFERENCES ufc_fighters(id) ON DELETE CASCADE,
    INDEX idx_fight_grappling (fight_id),
    INDEX idx_fighter_grappling (fighter_id),
    INDEX idx_round_grappling (round_number)
);

-- Create fight odds tracking table
CREATE TABLE IF NOT EXISTS ufc_fight_odds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fight_id VARCHAR(50) NOT NULL,
    bookmaker VARCHAR(100) NOT NULL,
    
    -- Moneyline Odds
    fighter1_odds DECIMAL(8,2),
    fighter2_odds DECIMAL(8,2),
    
    -- Method of Victory Odds
    fighter1_ko_tko_odds DECIMAL(8,2),
    fighter1_submission_odds DECIMAL(8,2),
    fighter1_decision_odds DECIMAL(8,2),
    fighter2_ko_tko_odds DECIMAL(8,2),
    fighter2_submission_odds DECIMAL(8,2),
    fighter2_decision_odds DECIMAL(8,2),
    
    -- Round Betting
    over_under_rounds DECIMAL(3,1),
    over_odds DECIMAL(8,2),
    under_odds DECIMAL(8,2),
    
    -- Prop Bets
    fight_goes_distance_yes_odds DECIMAL(8,2),
    fight_goes_distance_no_odds DECIMAL(8,2),
    
    -- Odds Metadata
    odds_timestamp DATETIME NOT NULL,
    opening_odds BOOLEAN DEFAULT false,
    closing_odds BOOLEAN DEFAULT false,
    line_movement DECIMAL(6,2), -- Percentage change from opening
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fight_id) REFERENCES ufc_fights(id) ON DELETE CASCADE,
    INDEX idx_fight_odds (fight_id),
    INDEX idx_bookmaker (bookmaker),
    INDEX idx_odds_timestamp (odds_timestamp),
    INDEX idx_opening_closing (opening_odds, closing_odds)
);

-- Create fight predictions table for ML model predictions
CREATE TABLE IF NOT EXISTS ufc_fight_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fight_id VARCHAR(50) NOT NULL,
    
    -- Model Information
    model_version VARCHAR(50) NOT NULL,
    prediction_confidence DECIMAL(5,2),
    
    -- Win Probability
    fighter1_win_probability DECIMAL(5,2),
    fighter2_win_probability DECIMAL(5,2),
    
    -- Method Predictions
    ko_tko_probability DECIMAL(5,2),
    submission_probability DECIMAL(5,2),
    decision_probability DECIMAL(5,2),
    
    -- Round Predictions
    round1_finish_probability DECIMAL(5,2),
    round2_finish_probability DECIMAL(5,2),
    round3_finish_probability DECIMAL(5,2),
    goes_distance_probability DECIMAL(5,2),
    
    -- Feature Importance
    model_features JSON,
    key_factors TEXT,
    
    -- Betting Intelligence
    recommended_bets JSON,
    expected_value DECIMAL(6,2),
    risk_assessment VARCHAR(20),
    
    prediction_timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fight_id) REFERENCES ufc_fights(id) ON DELETE CASCADE,
    INDEX idx_fight_predictions (fight_id),
    INDEX idx_model_version (model_version),
    INDEX idx_prediction_timestamp (prediction_timestamp),
    INDEX idx_confidence (prediction_confidence)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_ufc_fights_timestamp 
    BEFORE UPDATE ON ufc_fights 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample fights for testing (optional)
INSERT INTO ufc_fights (
    id, event_id, fighter1_id, fighter2_id, fight_order, card_type, 
    weight_class, title_fight, scheduled_rounds
) VALUES 
('fight_001', 'ufc_300', 'fighter_001', 'fighter_002', 1, 'main_card', 'Heavyweight', true, 5),
('fight_002', 'ufc_300', 'fighter_003', 'fighter_001', 2, 'main_card', 'Welterweight', false, 3),
('fight_003', 'ufc_301', 'fighter_002', 'fighter_003', 1, 'main_card', 'Lightweight', true, 5)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample odds for testing
INSERT INTO ufc_fight_odds (
    fight_id, bookmaker, fighter1_odds, fighter2_odds, odds_timestamp, opening_odds
) VALUES 
('fight_001', 'DraftKings', -150, 130, '2024-04-01 10:00:00', true),
('fight_001', 'FanDuel', -145, 125, '2024-04-01 10:15:00', true),
('fight_002', 'DraftKings', 180, -220, '2024-04-01 10:00:00', true)
ON DUPLICATE KEY UPDATE
    odds_timestamp = VALUES(odds_timestamp);

-- Commit the changes
COMMIT;