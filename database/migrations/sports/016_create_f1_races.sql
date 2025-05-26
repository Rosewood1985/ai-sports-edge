-- Migration: Create Formula 1 Races table
-- This migration creates the core F1 races table with comprehensive race information

CREATE TABLE IF NOT EXISTS f1_races (
    id VARCHAR(30) PRIMARY KEY,
    season_year INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    race_name VARCHAR(100) NOT NULL,
    circuit_id VARCHAR(20) NOT NULL,
    
    -- Race Weekend Schedule
    practice1_date DATETIME,
    practice2_date DATETIME,
    practice3_date DATETIME, -- may be null for sprint weekends
    sprint_shootout_date DATETIME, -- for sprint weekends
    sprint_race_date DATETIME, -- for sprint weekends
    qualifying_date DATETIME NOT NULL,
    race_date DATETIME NOT NULL,
    
    -- Race Information
    total_laps INTEGER,
    race_distance_km DECIMAL(6,3),
    scheduled_race_duration INTEGER, -- minutes
    actual_race_duration INTEGER, -- actual minutes from start to finish
    
    -- Weather Conditions
    race_weather_temp INTEGER, -- Celsius
    race_weather_humidity INTEGER, -- percentage
    race_weather_wind_speed INTEGER, -- km/h
    race_weather_wind_direction VARCHAR(10), -- "N", "NE", "E", etc.
    race_weather_conditions VARCHAR(50), -- "Sunny", "Overcast", "Rain", "Variable"
    track_temp_start INTEGER, -- Celsius at race start
    track_temp_end INTEGER, -- Celsius at race end
    precipitation_amount DECIMAL(4,1), -- mm during race
    weather_impact_on_race ENUM('Major', 'Moderate', 'Minor', 'None'),
    
    -- Race Results
    pole_position_driver_id VARCHAR(20),
    pole_position_time VARCHAR(10), -- "1:14.260"
    pole_position_gap_to_second DECIMAL(5,3), -- seconds
    fastest_lap_driver_id VARCHAR(20),
    fastest_lap_time VARCHAR(10),
    fastest_lap_lap_number INTEGER,
    race_winner_driver_id VARCHAR(20),
    winning_margin DECIMAL(6,3), -- seconds to second place
    total_race_time VARCHAR(15), -- "1:32:07.986" for winner
    
    -- Race Classification
    race_type ENUM('Standard', 'Sprint Weekend', 'Sprint Shootout') DEFAULT 'Standard',
    race_status ENUM('Scheduled', 'Practice', 'Qualifying', 'Race Day', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    red_flag_periods INTEGER DEFAULT 0,
    red_flag_total_time INTEGER DEFAULT 0, -- minutes under red flag
    safety_car_deployments INTEGER DEFAULT 0,
    safety_car_total_laps INTEGER DEFAULT 0,
    virtual_safety_car_deployments INTEGER DEFAULT 0,
    virtual_safety_car_total_time INTEGER DEFAULT 0, -- minutes under VSC
    
    -- Attendance and Commercial
    attendance INTEGER,
    ticket_sales_revenue DECIMAL(12,2),
    tv_viewership_global INTEGER, -- estimated global TV audience
    tv_viewership_peak INTEGER, -- peak simultaneous viewers
    social_media_engagement INTEGER, -- combined engagement across platforms
    
    -- Technical and Regulatory
    drs_zones_active INTEGER,
    tire_compounds_available JSON, -- ["C1", "C2", "C3"] or similar
    minimum_pit_stops INTEGER DEFAULT 1,
    fuel_flow_limit DECIMAL(4,1), -- kg/h
    technical_infringements INTEGER DEFAULT 0,
    sporting_penalties_issued INTEGER DEFAULT 0,
    
    -- Race Strategy and Performance
    undercuts_successful INTEGER DEFAULT 0,
    overcuts_successful INTEGER DEFAULT 0,
    pit_stop_strategies JSON, -- summary of different strategies used
    tire_strategy_effectiveness JSON, -- analysis of tire strategy success
    
    -- Qualifying Information
    qualifying_format VARCHAR(20), -- "Standard", "Sprint Shootout", "Elimination"
    q1_cutoff_time VARCHAR(10),
    q2_cutoff_time VARCHAR(10),
    q3_pole_time VARCHAR(10),
    qualifying_weather VARCHAR(50),
    qualifying_incidents INTEGER DEFAULT 0,
    
    -- Sprint Race Information (if applicable)
    sprint_race_winner_id VARCHAR(20),
    sprint_race_fastest_lap_id VARCHAR(20),
    sprint_race_incidents INTEGER DEFAULT 0,
    sprint_points_awarded BOOLEAN DEFAULT FALSE,
    
    -- Championship Impact
    championship_leader_after_race VARCHAR(20),
    championship_gap_after_race DECIMAL(3,1),
    constructor_leader_after_race VARCHAR(10),
    constructor_gap_after_race INTEGER,
    title_deciding_race BOOLEAN DEFAULT FALSE,
    
    -- Race Incidents and Drama
    total_incidents INTEGER DEFAULT 0,
    driver_penalties INTEGER DEFAULT 0,
    team_penalties INTEGER DEFAULT 0,
    protests_filed INTEGER DEFAULT 0,
    protests_upheld INTEGER DEFAULT 0,
    dnf_mechanical INTEGER DEFAULT 0,
    dnf_accident INTEGER DEFAULT 0,
    dnf_disqualification INTEGER DEFAULT 0,
    
    -- Performance Analysis
    race_pace_analysis JSON, -- analysis of race pace by stint
    tire_degradation_analysis JSON, -- tire performance analysis
    fuel_consumption_analysis JSON, -- fuel usage patterns
    ers_deployment_analysis JSON, -- energy recovery analysis
    
    -- Historical Significance
    milestone_achievements JSON, -- any records broken or milestones reached
    first_time_events JSON, -- first wins, podiums, points, etc.
    retirement_announcements JSON, -- any retirement announcements during weekend
    debut_drivers JSON, -- any drivers making F1 debut
    
    -- Media and Broadcasting
    tv_production_quality DECIMAL(3,2), -- 1-10 scale
    commentary_team JSON, -- broadcast commentary team
    special_features JSON, -- any special broadcast features
    highlight_moments JSON, -- key moments for highlights
    
    -- Environmental Impact
    carbon_footprint_estimate DECIMAL(10,2), -- tons of CO2
    sustainability_initiatives JSON, -- green initiatives during race weekend
    waste_generated_estimate DECIMAL(8,2), -- tons of waste
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'f1_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (circuit_id) REFERENCES f1_circuits(id) ON DELETE RESTRICT,
    FOREIGN KEY (pole_position_driver_id) REFERENCES f1_drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (fastest_lap_driver_id) REFERENCES f1_drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (race_winner_driver_id) REFERENCES f1_drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (sprint_race_winner_id) REFERENCES f1_drivers(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_season_round (season_year, round_number),
    INDEX idx_race_date (race_date),
    INDEX idx_circuit_id (circuit_id),
    INDEX idx_race_status (race_status),
    INDEX idx_race_type (race_type),
    INDEX idx_pole_winner (pole_position_driver_id, race_winner_driver_id),
    INDEX idx_weather_conditions (race_weather_conditions, weather_impact_on_race),
    INDEX idx_last_updated (last_updated)
);

-- Create F1 race results table for detailed finishing positions
CREATE TABLE IF NOT EXISTS f1_race_results (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    race_id VARCHAR(30) NOT NULL,
    driver_id VARCHAR(20) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Starting Position
    grid_position INTEGER,
    grid_penalties INTEGER DEFAULT 0, -- positions lost due to penalties
    
    -- Finishing Position
    finish_position INTEGER,
    classification_status VARCHAR(50), -- "Finished", "DNF", "DSQ", etc.
    laps_completed INTEGER DEFAULT 0,
    race_time VARCHAR(15), -- time or gap to winner
    gap_to_winner DECIMAL(6,3), -- seconds behind winner
    gap_to_next DECIMAL(6,3), -- seconds to car in front
    
    -- Performance Metrics
    fastest_lap BOOLEAN DEFAULT FALSE,
    fastest_lap_time VARCHAR(10),
    positions_gained INTEGER DEFAULT 0, -- from grid to finish
    laps_led INTEGER DEFAULT 0,
    times_passed INTEGER DEFAULT 0, -- times overtaken
    times_passed_others INTEGER DEFAULT 0, -- successful overtakes
    
    -- Points and Championship
    points_scored DECIMAL(3,1) DEFAULT 0,
    championship_position_after INTEGER,
    championship_points_total DECIMAL(4,1),
    
    -- Pit Stop Strategy
    pit_stops INTEGER DEFAULT 0,
    pit_stop_times JSON, -- array of pit stop times
    tire_strategy JSON, -- tire compounds used and laps
    
    -- Technical Performance
    top_speed_kmh DECIMAL(5,1),
    average_lap_time VARCHAR(10),
    best_sector_1_time VARCHAR(10),
    best_sector_2_time VARCHAR(10),
    best_sector_3_time VARCHAR(10),
    
    -- Incidents and Penalties
    penalties_applied JSON, -- array of penalties
    incidents_involved INTEGER DEFAULT 0,
    warning_flags INTEGER DEFAULT 0, -- yellow flags shown to driver
    
    -- Team Radio and Communication
    radio_message_count INTEGER DEFAULT 0,
    strategic_input_provided BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (race_id) REFERENCES f1_races(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES f1_drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES f1_teams(id) ON DELETE CASCADE,
    INDEX idx_race_results (race_id),
    INDEX idx_driver_results (driver_id),
    INDEX idx_team_results (team_id),
    INDEX idx_finish_position (finish_position),
    INDEX idx_points_scored (points_scored DESC)
);

-- Create F1 race lap times table for detailed lap-by-lap analysis
CREATE TABLE IF NOT EXISTS f1_race_lap_times (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    race_id VARCHAR(30) NOT NULL,
    driver_id VARCHAR(20) NOT NULL,
    lap_number INTEGER NOT NULL,
    
    -- Lap Time Data
    lap_time VARCHAR(10), -- "1:14.260"
    lap_time_seconds DECIMAL(7,3), -- converted to seconds for calculations
    sector_1_time VARCHAR(10),
    sector_2_time VARCHAR(10),
    sector_3_time VARCHAR(10),
    
    -- Lap Context
    position_at_start INTEGER, -- position at start of lap
    position_at_end INTEGER, -- position at end of lap
    gap_to_leader DECIMAL(6,3), -- seconds
    gap_to_next DECIMAL(6,3), -- seconds to car in front
    
    -- Track Conditions
    tire_compound VARCHAR(10), -- "Soft", "Medium", "Hard", "Intermediate", "Wet"
    tire_age INTEGER, -- laps on current tire set
    track_status VARCHAR(20), -- "Green", "Yellow", "Safety Car", "VSC", "Red"
    weather_conditions VARCHAR(50),
    
    -- Performance Indicators
    personal_best BOOLEAN DEFAULT FALSE,
    fastest_lap_overall BOOLEAN DEFAULT FALSE,
    fastest_sector_1 BOOLEAN DEFAULT FALSE,
    fastest_sector_2 BOOLEAN DEFAULT FALSE,
    fastest_sector_3 BOOLEAN DEFAULT FALSE,
    
    -- Strategic Information
    pit_in_lap BOOLEAN DEFAULT FALSE,
    pit_out_lap BOOLEAN DEFAULT FALSE,
    pit_stop_time DECIMAL(4,2), -- if pit stop occurred
    fuel_load_estimate DECIMAL(4,1), -- estimated fuel load in kg
    ers_deployment_percentage DECIMAL(4,1), -- percentage of available ERS used
    
    -- Incidents
    incident_occurred BOOLEAN DEFAULT FALSE,
    incident_type VARCHAR(50), -- "Spin", "Off track", "Contact", etc.
    yellow_flag BOOLEAN DEFAULT FALSE,
    blue_flag BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (race_id) REFERENCES f1_races(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES f1_drivers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_race_driver_lap (race_id, driver_id, lap_number),
    INDEX idx_race_lap_times (race_id),
    INDEX idx_driver_lap_times (driver_id),
    INDEX idx_lap_performance (lap_time_seconds, personal_best),
    INDEX idx_lap_number (lap_number)
);

-- Create F1 race weather tracking table for detailed weather analysis
CREATE TABLE IF NOT EXISTS f1_race_weather_tracking (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    race_id VARCHAR(30) NOT NULL,
    
    -- Time-based Weather Data
    measurement_time DATETIME NOT NULL,
    air_temperature DECIMAL(4,1), -- Celsius
    track_temperature DECIMAL(4,1),
    humidity_percentage DECIMAL(4,1),
    wind_speed_kmh DECIMAL(4,1),
    wind_direction VARCHAR(10),
    barometric_pressure DECIMAL(6,2), -- hPa
    
    -- Precipitation
    precipitation_type VARCHAR(20), -- "None", "Light Rain", "Heavy Rain"
    precipitation_intensity DECIMAL(4,1), -- mm/h
    visibility_km DECIMAL(4,1),
    
    -- Track Impact
    track_grip_level ENUM('Very High', 'High', 'Medium', 'Low', 'Very Low'),
    optimal_tire_compound VARCHAR(20),
    crossover_point_estimate VARCHAR(10), -- when to switch from wet to dry tires
    
    -- Racing Impact
    lap_time_impact_estimate DECIMAL(4,1), -- percentage impact on lap times
    safety_car_probability DECIMAL(4,1), -- percentage chance of safety car
    strategy_impact ENUM('Major', 'Moderate', 'Minor', 'None'),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (race_id) REFERENCES f1_races(id) ON DELETE CASCADE,
    INDEX idx_race_weather_tracking (race_id),
    INDEX idx_measurement_time (measurement_time),
    INDEX idx_precipitation (precipitation_type, precipitation_intensity)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_f1_races_timestamp 
    BEFORE UPDATE ON f1_races 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample F1 races for testing (optional)
INSERT INTO f1_races (
    id, season_year, round_number, race_name, circuit_id,
    race_date, total_laps, race_distance_km, race_status
) VALUES 
('2024_01_bahrain', 2024, 1, 'Bahrain Grand Prix', 'bahrain', '2024-03-02 18:00:00', 57, 308.238, 'Completed'),
('2024_02_saudi', 2024, 2, 'Saudi Arabian Grand Prix', 'jeddah', '2024-03-09 20:00:00', 50, 308.450, 'Completed'),
('2024_03_australia', 2024, 3, 'Australian Grand Prix', 'melbourne', '2024-03-24 15:00:00', 58, 306.124, 'Scheduled')
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample race results
INSERT INTO f1_race_results (
    race_id, driver_id, team_id, grid_position, finish_position,
    points_scored, laps_completed
) VALUES 
('2024_01_bahrain', 'VER', 'RBR', 1, 1, 25, 57),
('2024_01_bahrain', 'LEC', 'FER', 2, 2, 18, 57),
('2024_01_bahrain', 'HAM', 'MER', 3, 3, 15, 57)
ON DUPLICATE KEY UPDATE
    race_id = VALUES(race_id);

-- Commit the changes
COMMIT;