-- Migration: Create Formula 1 Drivers table
-- This migration creates the core F1 drivers table with comprehensive driver information and career statistics

CREATE TABLE IF NOT EXISTS f1_drivers (
    id VARCHAR(20) PRIMARY KEY, -- "HAM", "VER", "LEC", "RUS", etc.
    name VARCHAR(100) NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    permanent_number INTEGER UNIQUE, -- each driver has a unique career number
    
    -- Personal Information
    birth_date DATE,
    birth_place VARCHAR(100),
    age INTEGER,
    
    -- Physical Characteristics (important for F1)
    height INTEGER, -- centimeters
    weight INTEGER, -- kilograms
    helmet_design_description TEXT,
    
    -- Career Timeline
    f1_debut_date DATE,
    years_in_f1 INTEGER DEFAULT 0,
    seasons_completed INTEGER DEFAULT 0,
    current_season_active BOOLEAN DEFAULT TRUE,
    retirement_announced BOOLEAN DEFAULT FALSE,
    retirement_date DATE,
    
    -- Career Race Statistics
    total_races INTEGER DEFAULT 0,
    race_starts INTEGER DEFAULT 0, -- may be different from total_races due to DNS
    race_finishes INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    podiums INTEGER DEFAULT 0,
    poles INTEGER DEFAULT 0,
    fastest_laps INTEGER DEFAULT 0,
    dnfs INTEGER DEFAULT 0, -- Did Not Finish
    dsqs INTEGER DEFAULT 0, -- Disqualifications
    
    -- Championship Statistics
    championships INTEGER DEFAULT 0,
    championship_years JSON, -- array of years won
    runner_up_finishes INTEGER DEFAULT 0,
    top_3_championship_finishes INTEGER DEFAULT 0,
    
    -- Current Season Performance
    current_season_points INTEGER DEFAULT 0,
    current_season_position INTEGER,
    current_season_wins INTEGER DEFAULT 0,
    current_season_podiums INTEGER DEFAULT 0,
    current_season_poles INTEGER DEFAULT 0,
    current_season_fastest_laps INTEGER DEFAULT 0,
    current_season_dnfs INTEGER DEFAULT 0,
    
    -- Performance Metrics
    average_finish_position DECIMAL(4,2),
    points_per_race DECIMAL(4,2),
    podium_percentage DECIMAL(5,2), -- percentage of races resulting in podium
    win_percentage DECIMAL(5,2),
    dnf_percentage DECIMAL(5,2),
    pole_percentage DECIMAL(5,2),
    
    -- Qualifying Performance
    average_qualifying_position DECIMAL(4,2),
    front_row_starts INTEGER DEFAULT 0, -- P1 or P2 starts
    top_10_qualifying_percentage DECIMAL(5,2),
    q3_appearances INTEGER DEFAULT 0, -- made it to Q3
    
    -- Race Performance Analysis
    overtakes_made INTEGER DEFAULT 0,
    overtakes_suffered INTEGER DEFAULT 0,
    positions_gained_at_start INTEGER DEFAULT 0, -- avg positions gained on lap 1
    positions_lost_at_start INTEGER DEFAULT 0,
    
    -- Wet Weather Performance
    wet_weather_wins INTEGER DEFAULT 0,
    wet_weather_podiums INTEGER DEFAULT 0,
    wet_weather_performance_rating DECIMAL(3,2), -- 1-10 scale
    
    -- Technical and Strategic
    tire_management_rating DECIMAL(3,2), -- 1-10 scale
    fuel_management_rating DECIMAL(3,2),
    setup_feedback_quality DECIMAL(3,2), -- how good at car development
    race_strategy_execution DECIMAL(3,2),
    
    -- Physical and Mental Attributes
    fitness_level DECIMAL(3,2), -- 1-10 scale
    g_force_tolerance DECIMAL(3,2), -- ability to handle high g-forces
    concentration_endurance DECIMAL(3,2), -- mental stamina during long races
    pressure_performance DECIMAL(3,2), -- performance under pressure
    
    -- Team Relationships
    engineer_relationship_quality DECIMAL(3,2), -- 1-10 scale
    team_loyalty_score DECIMAL(3,2),
    mechanic_rapport DECIMAL(3,2),
    
    -- Contract and Financial Information
    current_contract_start_year INTEGER,
    current_contract_end_year INTEGER,
    estimated_annual_salary DECIMAL(12,2), -- in USD
    performance_bonuses DECIMAL(10,2),
    championship_bonuses DECIMAL(10,2),
    
    -- Penalty Points and Incidents
    current_penalty_points INTEGER DEFAULT 0, -- on super license (resets annually)
    career_penalty_points INTEGER DEFAULT 0,
    major_incidents INTEGER DEFAULT 0, -- significant crashes/penalties
    safety_car_incidents INTEGER DEFAULT 0, -- incidents causing safety cars
    
    -- Media and Commercial Value
    social_media_following INTEGER DEFAULT 0,
    marketability_rating DECIMAL(3,2), -- 1-10 scale
    sponsorship_value DECIMAL(10,2), -- estimated personal sponsorship value
    fan_favorite_rating DECIMAL(3,2), -- based on fan surveys
    
    -- Rookie and Development
    is_rookie BOOLEAN DEFAULT FALSE,
    reserve_driver_experience BOOLEAN DEFAULT FALSE,
    feeder_series_champion BOOLEAN DEFAULT FALSE, -- F2, F3, etc.
    rookie_of_year_awards INTEGER DEFAULT 0,
    
    -- International Experience
    nationality_changes JSON, -- if driver changed nationality
    multiple_passports BOOLEAN DEFAULT FALSE,
    languages_spoken JSON, -- array of languages
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'f1_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_team_id (team_id),
    INDEX idx_championship_position (current_season_position),
    INDEX idx_permanent_number (permanent_number),
    INDEX idx_nationality (nationality),
    INDEX idx_performance_metrics (current_season_points DESC, wins DESC),
    INDEX idx_contract_status (current_contract_end_year),
    INDEX idx_last_updated (last_updated)
);

-- Create F1 driver season statistics table for historical tracking
CREATE TABLE IF NOT EXISTS f1_driver_season_stats (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    driver_id VARCHAR(20) NOT NULL,
    season_year INTEGER NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Season Context
    teammate_driver_id VARCHAR(20), -- who was their teammate
    car_competitiveness_rating DECIMAL(3,2), -- 1-10 scale of car quality
    team_reliability_rating DECIMAL(3,2), -- how reliable was the car
    
    -- Championship Standing
    final_championship_position INTEGER,
    total_points INTEGER DEFAULT 0,
    points_behind_leader INTEGER DEFAULT 0,
    points_ahead_next_driver INTEGER DEFAULT 0,
    
    -- Race Results
    races_entered INTEGER DEFAULT 0,
    races_started INTEGER DEFAULT 0,
    races_finished INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    podiums INTEGER DEFAULT 0,
    poles INTEGER DEFAULT 0,
    fastest_laps INTEGER DEFAULT 0,
    dnfs INTEGER DEFAULT 0,
    
    -- Performance vs Teammate
    teammate_head_to_head_races INTEGER DEFAULT 0, -- races where both finished
    teammate_head_to_head_wins INTEGER DEFAULT 0, -- times beat teammate
    qualifying_head_to_head_wins INTEGER DEFAULT 0,
    average_gap_to_teammate DECIMAL(5,3), -- seconds per lap on average
    
    -- Qualifying Performance
    average_qualifying_position DECIMAL(4,2),
    q3_appearances INTEGER DEFAULT 0,
    front_row_starts INTEGER DEFAULT 0,
    
    -- Race Performance
    average_race_position DECIMAL(4,2),
    positions_gained_overall INTEGER DEFAULT 0, -- from qualifying to finish
    laps_led INTEGER DEFAULT 0,
    races_led INTEGER DEFAULT 0,
    
    -- Reliability and Incidents
    mechanical_dnfs INTEGER DEFAULT 0,
    crash_dnfs INTEGER DEFAULT 0,
    penalty_points_accumulated INTEGER DEFAULT 0,
    grid_penalties_served INTEGER DEFAULT 0,
    
    -- Special Achievements
    driver_of_day_awards INTEGER DEFAULT 0, -- fan-voted award
    rookie_season BOOLEAN DEFAULT FALSE,
    season_highlights TEXT, -- notable achievements or moments
    
    -- Contract and Team Changes
    mid_season_team_change BOOLEAN DEFAULT FALSE,
    contract_extension_signed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES f1_drivers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_driver_season (driver_id, season_year),
    INDEX idx_driver_season_stats (driver_id),
    INDEX idx_season_year (season_year),
    INDEX idx_championship_position (final_championship_position),
    INDEX idx_teammate_comparison (teammate_head_to_head_wins, qualifying_head_to_head_wins)
);

-- Create F1 driver race performance table for individual race tracking
CREATE TABLE IF NOT EXISTS f1_driver_race_performance (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    driver_id VARCHAR(20) NOT NULL,
    race_id VARCHAR(30) NOT NULL,
    
    -- Pre-Race
    qualifying_position INTEGER,
    qualifying_time VARCHAR(10), -- "1:14.260"
    grid_position INTEGER, -- may differ from qualifying due to penalties
    grid_penalties INTEGER DEFAULT 0, -- positions penalized
    
    -- Race Result
    finish_position INTEGER,
    race_time VARCHAR(15), -- "+1:32.456" or race time for winner
    laps_completed INTEGER,
    status VARCHAR(50), -- "Finished", "DNF - Engine", "DNF - Crash", etc.
    
    -- Performance Metrics
    positions_gained INTEGER DEFAULT 0, -- from grid to finish
    fastest_lap BOOLEAN DEFAULT FALSE,
    fastest_lap_time VARCHAR(10),
    laps_led INTEGER DEFAULT 0,
    
    -- Points and Championship
    points_scored DECIMAL(3,1) DEFAULT 0, -- including half points for short races
    championship_position_after_race INTEGER,
    points_gap_to_leader DECIMAL(3,1),
    
    -- Race Strategy
    pit_stops INTEGER DEFAULT 0,
    tire_compounds_used JSON, -- ["Soft", "Medium", "Hard"]
    pit_stop_strategy VARCHAR(100), -- brief description
    fuel_strategy VARCHAR(50), -- "Conservative", "Aggressive", "Standard"
    
    -- Performance Analysis
    sector_1_best_time VARCHAR(10),
    sector_2_best_time VARCHAR(10),
    sector_3_best_time VARCHAR(10),
    top_speed_kmh DECIMAL(5,1), -- highest speed reached
    average_lap_time VARCHAR(10),
    
    -- Incidents and Penalties
    penalties_applied JSON, -- array of penalties received
    incidents_involved INTEGER DEFAULT 0,
    safety_car_periods_during_race INTEGER DEFAULT 0,
    virtual_safety_car_periods INTEGER DEFAULT 0,
    
    -- Team Radio and Communication
    notable_radio_messages TEXT,
    strategy_calls_made INTEGER DEFAULT 0, -- driver input on strategy
    
    -- Weather Impact
    weather_conditions VARCHAR(50),
    tire_strategy_weather_impact BOOLEAN DEFAULT FALSE,
    wet_weather_performance_rating DECIMAL(3,2), -- if wet conditions
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES f1_drivers(id) ON DELETE CASCADE,
    INDEX idx_driver_race_performance (driver_id),
    INDEX idx_race_performance (race_id),
    INDEX idx_finish_position (finish_position),
    INDEX idx_points_scored (points_scored DESC)
);

-- Create F1 driver career milestones table
CREATE TABLE IF NOT EXISTS f1_driver_career_milestones (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    driver_id VARCHAR(20) NOT NULL,
    
    -- Milestone Type and Details
    milestone_type VARCHAR(50) NOT NULL, -- "First Win", "100th Race", "Championship"
    milestone_date DATE NOT NULL,
    race_id VARCHAR(30), -- which race it happened at (if applicable)
    season_year INTEGER NOT NULL,
    
    -- Milestone Context
    age_at_milestone DECIMAL(4,1), -- years.months
    races_to_achieve INTEGER, -- how many races it took to reach this milestone
    comparison_to_average INTEGER, -- how this compares to typical achievement time
    
    -- Significance Rating
    milestone_importance DECIMAL(3,2), -- 1-10 scale of career significance
    media_coverage_level VARCHAR(20), -- "High", "Medium", "Low"
    fan_reaction_score DECIMAL(3,2), -- based on social media/fan reaction
    
    -- Historical Context
    ranking_among_all_drivers INTEGER, -- where this ranks historically
    youngest_to_achieve BOOLEAN DEFAULT FALSE,
    oldest_to_achieve BOOLEAN DEFAULT FALSE,
    fastest_to_achieve BOOLEAN DEFAULT FALSE, -- in terms of races/time
    
    -- Description and Details
    milestone_description TEXT,
    celebration_details TEXT,
    team_reaction TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES f1_drivers(id) ON DELETE CASCADE,
    INDEX idx_driver_milestones (driver_id),
    INDEX idx_milestone_type (milestone_type),
    INDEX idx_milestone_date (milestone_date),
    INDEX idx_season_year (season_year)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_f1_drivers_timestamp 
    BEFORE UPDATE ON f1_drivers 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample F1 drivers for testing (optional)
INSERT INTO f1_drivers (
    id, name, nationality, team_id, permanent_number, birth_date,
    years_in_f1, total_races, wins, championships, current_season_points
) VALUES 
('HAM', 'Lewis Hamilton', 'British', 'MER', 44, '1985-01-07', 17, 308, 103, 7, 234),
('VER', 'Max Verstappen', 'Dutch', 'RBR', 1, '1997-09-30', 9, 163, 50, 3, 575),
('LEC', 'Charles Leclerc', 'Monégasque', 'FER', 16, '1997-10-16', 6, 118, 5, 0, 206),
('RUS', 'George Russell', 'British', 'MER', 63, '1998-02-15', 5, 101, 1, 0, 175),
('NOR', 'Lando Norris', 'British', 'MCL', 4, '1999-11-13', 5, 101, 0, 0, 113)
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample season statistics
INSERT INTO f1_driver_season_stats (
    driver_id, season_year, team_id, final_championship_position, total_points,
    races_entered, wins, podiums, poles
) VALUES 
('VER', 2023, 'RBR', 1, 575, 22, 19, 21, 9),
('HAM', 2023, 'MER', 3, 234, 22, 0, 1, 0),
('LEC', 2023, 'FER', 5, 206, 22, 0, 1, 1)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample career milestones
INSERT INTO f1_driver_career_milestones (
    driver_id, milestone_type, milestone_date, season_year, age_at_milestone,
    milestone_description
) VALUES 
('VER', 'First Championship', '2021-12-12', 2021, 24.2, 'Won first F1 World Championship at Abu Dhabi GP'),
('HAM', '100th Win', '2021-07-18', 2021, 36.5, 'Achieved 100th career victory at British GP'),
('LEC', 'First Win', '2019-09-08', 2019, 21.8, 'First F1 victory at Belgian Grand Prix')
ON DUPLICATE KEY UPDATE
    driver_id = VALUES(driver_id);

-- Commit the changes
COMMIT;