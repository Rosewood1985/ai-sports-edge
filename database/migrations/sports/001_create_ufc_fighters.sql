-- Migration: Create UFC Fighters table
-- This migration creates the core fighters table with comprehensive fighter information

CREATE TABLE IF NOT EXISTS ufc_fighters (
    id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    weight_class VARCHAR(50) NOT NULL,
    height_inches INTEGER,
    weight_lbs INTEGER,
    reach_inches INTEGER,
    stance VARCHAR(20),
    age INTEGER,
    birth_date DATE,
    birth_location VARCHAR(200),
    fighting_style VARCHAR(100),
    team VARCHAR(200),
    record_wins INTEGER DEFAULT 0,
    record_losses INTEGER DEFAULT 0,
    record_draws INTEGER DEFAULT 0,
    record_no_contests INTEGER DEFAULT 0,
    ufc_debut_date DATE,
    total_ufc_fights INTEGER DEFAULT 0,
    current_ranking INTEGER,
    pound_for_pound_ranking INTEGER,
    is_active BOOLEAN DEFAULT true,
    is_champion BOOLEAN DEFAULT false,
    championship_belt VARCHAR(100),
    profile_image_url TEXT,
    bio TEXT,
    social_media_handles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_weight_class (weight_class),
    INDEX idx_ranking (current_ranking),
    INDEX idx_active (is_active),
    INDEX idx_champion (is_champion),
    INDEX idx_name (last_name, first_name)
);

-- Create fighters statistics table for detailed performance metrics
CREATE TABLE IF NOT EXISTS ufc_fighter_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fighter_id VARCHAR(50) NOT NULL,
    
    -- Striking Statistics
    striking_accuracy DECIMAL(5,2),
    strikes_landed_per_minute DECIMAL(6,2),
    strikes_absorbed_per_minute DECIMAL(6,2),
    striking_defense DECIMAL(5,2),
    knockdown_average DECIMAL(6,2),
    
    -- Grappling Statistics
    takedown_accuracy DECIMAL(5,2),
    takedown_average DECIMAL(6,2),
    takedown_defense DECIMAL(5,2),
    submission_average DECIMAL(6,2),
    
    -- Control Statistics
    average_fight_time TIME,
    control_time_percentage DECIMAL(5,2),
    
    -- Performance Metrics
    finish_rate DECIMAL(5,2),
    ko_tko_percentage DECIMAL(5,2),
    submission_percentage DECIMAL(5,2),
    decision_percentage DECIMAL(5,2),
    
    -- Advanced Analytics
    pressure_score DECIMAL(5,2),
    cage_control_score DECIMAL(5,2),
    adaptability_score DECIMAL(5,2),
    cardio_score DECIMAL(5,2),
    
    stats_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fighter_id) REFERENCES ufc_fighters(id) ON DELETE CASCADE,
    UNIQUE KEY unique_fighter_stats_date (fighter_id, stats_date),
    INDEX idx_fighter_stats (fighter_id),
    INDEX idx_stats_date (stats_date)
);

-- Create fighters injury history table
CREATE TABLE IF NOT EXISTS ufc_fighter_injuries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fighter_id VARCHAR(50) NOT NULL,
    injury_type VARCHAR(100) NOT NULL,
    body_part VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- minor, moderate, severe, career-threatening
    injury_date DATE NOT NULL,
    recovery_date DATE,
    fights_missed INTEGER DEFAULT 0,
    impact_on_performance DECIMAL(3,2), -- 0.0 to 1.0 scale
    medical_notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fighter_id) REFERENCES ufc_fighters(id) ON DELETE CASCADE,
    INDEX idx_fighter_injuries (fighter_id),
    INDEX idx_injury_date (injury_date),
    INDEX idx_severity (severity)
);

-- Create fighters training camps table
CREATE TABLE IF NOT EXISTS ufc_fighter_training_camps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fighter_id VARCHAR(50) NOT NULL,
    camp_name VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    head_coach VARCHAR(100),
    specialization VARCHAR(100), -- striking, grappling, wrestling, etc.
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    camp_quality_rating DECIMAL(3,2), -- 0.0 to 5.0 scale
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fighter_id) REFERENCES ufc_fighters(id) ON DELETE CASCADE,
    INDEX idx_fighter_camps (fighter_id),
    INDEX idx_current_camp (is_current),
    INDEX idx_camp_dates (start_date, end_date)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_ufc_fighters_timestamp 
    BEFORE UPDATE ON ufc_fighters 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample data for testing (optional)
INSERT INTO ufc_fighters (
    id, first_name, last_name, nickname, weight_class, height_inches, weight_lbs, 
    reach_inches, stance, record_wins, record_losses, is_active, is_champion
) VALUES 
('fighter_001', 'Jon', 'Jones', 'Bones', 'Heavyweight', 76, 248, 84, 'Orthodox', 27, 1, true, true),
('fighter_002', 'Islam', 'Makhachev', '', 'Lightweight', 70, 155, 70, 'Orthodox', 25, 1, true, true),
('fighter_003', 'Leon', 'Edwards', 'Rocky', 'Welterweight', 72, 170, 74, 'Orthodox', 22, 3, true, true)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Commit the changes
COMMIT;