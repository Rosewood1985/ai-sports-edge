-- Migration: Create Formula 1 Circuits table
-- This migration creates the core F1 circuits table with comprehensive track information

CREATE TABLE IF NOT EXISTS f1_circuits (
    id VARCHAR(20) PRIMARY KEY, -- "monaco", "silverstone", "spa", etc.
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(150), -- "Circuit de Monaco", "Silverstone Circuit"
    country VARCHAR(50) NOT NULL,
    city VARCHAR(50),
    
    -- Circuit Physical Characteristics
    length_km DECIMAL(6,3), -- kilometers (e.g., 5.412 for Spa)
    turns INTEGER,
    direction ENUM('Clockwise', 'Anticlockwise', 'Mixed') DEFAULT 'Clockwise',
    circuit_type ENUM('Street', 'Permanent', 'Temporary', 'Semi-Permanent'),
    surface_type VARCHAR(50) DEFAULT 'Asphalt',
    
    -- Elevation and Geography
    elevation_change_m INTEGER, -- total elevation change in meters
    highest_point_m INTEGER, -- meters above sea level
    lowest_point_m INTEGER,
    average_elevation_m INTEGER,
    geographical_features TEXT, -- notable geographical features
    
    -- Track Records
    lap_record_time VARCHAR(10), -- "1:14.260"
    lap_record_driver VARCHAR(100),
    lap_record_team VARCHAR(100),
    lap_record_year INTEGER,
    lap_record_session VARCHAR(20), -- "Race", "Qualifying", "Practice"
    qualifying_record_time VARCHAR(10),
    qualifying_record_driver VARCHAR(100),
    qualifying_record_year INTEGER,
    
    -- Circuit Difficulty and Characteristics
    difficulty_rating DECIMAL(3,2), -- 1-10 scale
    overtaking_difficulty DECIMAL(3,2), -- 1-10 scale (10 = very difficult)
    overtaking_opportunities INTEGER, -- number of good overtaking spots
    drs_zones INTEGER, -- number of DRS zones
    detection_zones INTEGER, -- number of DRS detection points
    
    -- Tire and Car Setup Impact
    tire_degradation_level ENUM('Very High', 'High', 'Medium', 'Low', 'Very Low'),
    tire_compounds_typically_used JSON, -- typical tire strategy
    brake_wear_severity ENUM('Very High', 'High', 'Medium', 'Low'),
    energy_recovery_potential ENUM('Very High', 'High', 'Medium', 'Low'), -- for ERS
    fuel_consumption_level ENUM('Very High', 'High', 'Medium', 'Low'),
    
    -- Setup Requirements
    downforce_requirement ENUM('Very High', 'High', 'Medium', 'Low'),
    suspension_setup_criticality ENUM('Very High', 'High', 'Medium', 'Low'),
    aerodynamic_efficiency_importance ENUM('Very High', 'High', 'Medium', 'Low'),
    mechanical_grip_importance ENUM('Very High', 'High', 'Medium', 'Low'),
    
    -- Safety Features
    safety_rating DECIMAL(3,2), -- 1-10 scale
    fia_grade INTEGER, -- FIA circuit grade (1 is highest)
    safety_car_probability DECIMAL(4,1), -- percentage chance per race
    virtual_safety_car_probability DECIMAL(4,1),
    red_flag_probability DECIMAL(4,1),
    barrier_types JSON, -- types of barriers used
    runoff_areas_quality ENUM('Excellent', 'Good', 'Adequate', 'Limited'),
    
    -- Weather Characteristics
    average_temperature_celsius INTEGER,
    temperature_variation_celsius INTEGER, -- typical range during race weekend
    average_rainfall_mm INTEGER, -- annual rainfall
    wind_factor_impact ENUM('Very High', 'High', 'Medium', 'Low', 'Minimal'),
    weather_variability ENUM('Very High', 'High', 'Medium', 'Low'),
    
    -- Historical Information
    first_f1_race_year INTEGER,
    total_f1_races_held INTEGER,
    most_successful_driver VARCHAR(100), -- driver with most wins at this circuit
    most_successful_driver_wins INTEGER,
    most_successful_team VARCHAR(100),
    most_successful_team_wins INTEGER,
    
    -- Circuit Layout Details
    longest_straight_m INTEGER, -- length of longest straight in meters
    shortest_straight_m INTEGER,
    tightest_corner_radius_m INTEGER, -- radius of tightest corner
    fastest_corner_speed_kmh INTEGER, -- typical speed through fastest corner
    slowest_corner_speed_kmh INTEGER,
    
    -- Spectator and Facilities
    spectator_capacity INTEGER,
    grandstands INTEGER,
    premium_hospitality_facilities INTEGER,
    accessibility_rating ENUM('Excellent', 'Good', 'Fair', 'Limited'),
    
    -- Technical Facilities
    pit_lane_length_m INTEGER,
    pit_boxes INTEGER, -- number of pit boxes
    pit_lane_speed_limit_kmh INTEGER,
    scrutineering_facilities_quality ENUM('Excellent', 'Good', 'Adequate'),
    paddock_size_sqm INTEGER,
    
    -- Commercial and Media
    hosting_fee_usd DECIMAL(12,2), -- what country/promoter pays to host
    tv_production_complexity ENUM('Very High', 'High', 'Medium', 'Low'),
    camera_car_accessibility ENUM('Excellent', 'Good', 'Limited', 'None'),
    helicopter_shot_opportunities ENUM('Excellent', 'Good', 'Limited', 'None'),
    
    -- Environmental and Sustainability
    carbon_footprint_rating VARCHAR(20), -- relative environmental impact
    sustainability_initiatives JSON, -- array of green initiatives
    renewable_energy_usage_percentage DECIMAL(4,1),
    waste_management_quality ENUM('Excellent', 'Good', 'Fair', 'Poor'),
    
    -- Future and Development
    planned_modifications JSON, -- upcoming changes or upgrades
    contract_expiration_year INTEGER, -- when current F1 contract expires
    contract_renewal_likelihood ENUM('Very High', 'High', 'Medium', 'Low', 'Very Low'),
    facility_investment_needed DECIMAL(10,2), -- estimated investment for improvements
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'f1_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_country (country),
    INDEX idx_circuit_type (circuit_type),
    INDEX idx_difficulty_rating (difficulty_rating DESC),
    INDEX idx_safety_rating (safety_rating DESC),
    INDEX idx_lap_record (lap_record_time),
    INDEX idx_overtaking_difficulty (overtaking_difficulty),
    INDEX idx_last_updated (last_updated)
);

-- Create F1 circuit sector times table for detailed lap analysis
CREATE TABLE IF NOT EXISTS f1_circuit_sector_times (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    circuit_id VARCHAR(20) NOT NULL,
    
    -- Sector Definitions
    sector_1_start_turn INTEGER, -- which turn sector 1 starts
    sector_1_end_turn INTEGER,
    sector_2_start_turn INTEGER,
    sector_2_end_turn INTEGER,
    sector_3_start_turn INTEGER,
    sector_3_end_turn INTEGER,
    
    -- Sector Characteristics
    sector_1_length_km DECIMAL(5,3),
    sector_2_length_km DECIMAL(5,3),
    sector_3_length_km DECIMAL(5,3),
    sector_1_type VARCHAR(50), -- "Power-sensitive", "Downforce-critical", "Balanced"
    sector_2_type VARCHAR(50),
    sector_3_type VARCHAR(50),
    
    -- Sector Records
    sector_1_record_time VARCHAR(10), -- "23.456"
    sector_1_record_driver VARCHAR(100),
    sector_1_record_year INTEGER,
    sector_2_record_time VARCHAR(10),
    sector_2_record_driver VARCHAR(100),
    sector_2_record_year INTEGER,
    sector_3_record_time VARCHAR(10),
    sector_3_record_driver VARCHAR(100),
    sector_3_record_year INTEGER,
    
    -- Sector Difficulty Analysis
    sector_1_difficulty DECIMAL(3,2), -- 1-10 scale
    sector_2_difficulty DECIMAL(3,2),
    sector_3_difficulty DECIMAL(3,2),
    sector_1_overtaking_opportunities INTEGER DEFAULT 0,
    sector_2_overtaking_opportunities INTEGER DEFAULT 0,
    sector_3_overtaking_opportunities INTEGER DEFAULT 0,
    
    -- Performance Impact
    sector_1_time_importance DECIMAL(4,1), -- percentage impact on overall lap time
    sector_2_time_importance DECIMAL(4,1),
    sector_3_time_importance DECIMAL(4,1),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (circuit_id) REFERENCES f1_circuits(id) ON DELETE CASCADE,
    UNIQUE KEY unique_circuit_sectors (circuit_id),
    INDEX idx_circuit_sector_times (circuit_id),
    INDEX idx_sector_records (sector_1_record_time, sector_2_record_time, sector_3_record_time)
);

-- Create F1 circuit weather history table for weather pattern analysis
CREATE TABLE IF NOT EXISTS f1_circuit_weather_history (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    circuit_id VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    
    -- Weekend Weather Summary
    friday_weather VARCHAR(50),
    saturday_weather VARCHAR(50),
    sunday_weather VARCHAR(50),
    
    -- Temperature Data
    friday_temp_high INTEGER, -- Celsius
    friday_temp_low INTEGER,
    saturday_temp_high INTEGER,
    saturday_temp_low INTEGER,
    sunday_temp_high INTEGER,
    sunday_temp_low INTEGER,
    race_start_temperature INTEGER,
    
    -- Precipitation
    friday_precipitation_mm DECIMAL(4,1),
    saturday_precipitation_mm DECIMAL(4,1),
    sunday_precipitation_mm DECIMAL(4,1),
    rain_during_race BOOLEAN DEFAULT FALSE,
    rain_intensity VARCHAR(20), -- "Light", "Moderate", "Heavy"
    
    -- Wind Conditions
    average_wind_speed_kmh DECIMAL(4,1),
    wind_direction VARCHAR(10), -- "N", "NE", "E", etc.
    wind_impact_on_racing ENUM('Significant', 'Moderate', 'Minimal', 'None'),
    
    -- Track Conditions
    track_temperature_race_start INTEGER, -- Celsius
    track_grip_level ENUM('Very High', 'High', 'Medium', 'Low', 'Very Low'),
    track_evolution_during_race ENUM('Significant', 'Moderate', 'Minimal'),
    
    -- Weather Impact on Race
    safety_car_deployments_weather INTEGER DEFAULT 0,
    red_flag_weather BOOLEAN DEFAULT FALSE,
    race_delay_minutes INTEGER DEFAULT 0,
    tire_strategy_impact ENUM('Major', 'Moderate', 'Minor', 'None'),
    
    -- Performance Impact
    lap_time_impact_percentage DECIMAL(4,1), -- how much weather affected lap times
    overtaking_impact ENUM('Increased', 'Decreased', 'No Change'),
    dnf_rate_weather_related DECIMAL(4,1), -- percentage of DNFs due to weather
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (circuit_id) REFERENCES f1_circuits(id) ON DELETE CASCADE,
    UNIQUE KEY unique_circuit_year_weather (circuit_id, year),
    INDEX idx_circuit_weather_history (circuit_id),
    INDEX idx_year_weather (year),
    INDEX idx_race_weather (sunday_weather, rain_during_race)
);

-- Create F1 circuit performance analysis table for car setup insights
CREATE TABLE IF NOT EXISTS f1_circuit_performance_analysis (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    circuit_id VARCHAR(20) NOT NULL,
    analysis_year INTEGER NOT NULL,
    
    -- Car Setup Requirements Analysis
    optimal_downforce_level VARCHAR(20), -- "Maximum", "High", "Medium", "Low"
    wing_angle_recommendations TEXT,
    suspension_stiffness_recommendation VARCHAR(20),
    gear_ratio_optimization_importance ENUM('Critical', 'Important', 'Moderate', 'Minor'),
    
    -- Tire Strategy Analysis
    optimal_tire_strategy VARCHAR(100), -- "Medium-Hard", "Soft-Medium-Hard", etc.
    tire_degradation_pattern VARCHAR(100),
    undercut_overcut_potential ENUM('High Undercut', 'High Overcut', 'Balanced', 'Limited'),
    pit_window_flexibility ENUM('Very High', 'High', 'Medium', 'Low'),
    
    -- Power Unit Usage
    ers_deployment_strategy VARCHAR(100),
    fuel_saving_requirements ENUM('Critical', 'Important', 'Moderate', 'Minimal'),
    battery_management_importance ENUM('Critical', 'Important', 'Moderate', 'Minimal'),
    engine_mode_recommendations TEXT,
    
    -- Driving Style Requirements
    required_driving_style VARCHAR(100), -- "Aggressive", "Smooth", "Adaptive", etc.
    braking_technique_importance ENUM('Critical', 'Important', 'Moderate', 'Minor'),
    corner_entry_criticality ENUM('Critical', 'Important', 'Moderate', 'Minor'),
    corner_exit_criticality ENUM('Critical', 'Important', 'Moderate', 'Minor'),
    
    -- Team Performance Patterns
    mercedes_historical_performance DECIMAL(3,2), -- 1-10 scale
    red_bull_historical_performance DECIMAL(3,2),
    ferrari_historical_performance DECIMAL(3,2),
    mclaren_historical_performance DECIMAL(3,2),
    
    -- Innovation Opportunities
    development_focus_areas JSON, -- areas where teams typically focus development
    aerodynamic_sensitivity ENUM('Very High', 'High', 'Medium', 'Low'),
    mechanical_grip_sensitivity ENUM('Very High', 'High', 'Medium', 'Low'),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (circuit_id) REFERENCES f1_circuits(id) ON DELETE CASCADE,
    UNIQUE KEY unique_circuit_analysis_year (circuit_id, analysis_year),
    INDEX idx_circuit_performance_analysis (circuit_id),
    INDEX idx_analysis_year (analysis_year)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_f1_circuits_timestamp 
    BEFORE UPDATE ON f1_circuits 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample F1 circuits for testing (optional)
INSERT INTO f1_circuits (
    id, name, full_name, country, city, length_km, turns,
    circuit_type, difficulty_rating, overtaking_difficulty
) VALUES 
('monaco', 'Monaco', 'Circuit de Monaco', 'Monaco', 'Monte Carlo', 3.337, 19, 'Street', 9.8, 9.5),
('silverstone', 'Silverstone', 'Silverstone Circuit', 'United Kingdom', 'Silverstone', 5.891, 18, 'Permanent', 7.2, 6.8),
('spa', 'Spa-Francorchamps', 'Circuit de Spa-Francorchamps', 'Belgium', 'Spa', 7.004, 19, 'Permanent', 8.5, 7.2),
('monza', 'Monza', 'Autodromo Nazionale di Monza', 'Italy', 'Monza', 5.793, 11, 'Permanent', 6.8, 8.5),
('suzuka', 'Suzuka', 'Suzuka International Racing Course', 'Japan', 'Suzuka', 5.807, 18, 'Permanent', 8.8, 7.5)
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample sector times
INSERT INTO f1_circuit_sector_times (
    circuit_id, sector_1_length_km, sector_2_length_km, sector_3_length_km,
    sector_1_type, sector_2_type, sector_3_type
) VALUES 
('monaco', 1.247, 1.256, 0.834, 'Downforce-critical', 'Downforce-critical', 'Power-sensitive'),
('silverstone', 2.127, 2.456, 1.308, 'Power-sensitive', 'Balanced', 'Downforce-critical'),
('spa', 2.789, 2.512, 1.703, 'Power-sensitive', 'Downforce-critical', 'Balanced')
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample weather history
INSERT INTO f1_circuit_weather_history (
    circuit_id, year, sunday_weather, race_start_temperature,
    rain_during_race, wind_impact_on_racing
) VALUES 
('silverstone', 2023, 'Sunny', 22, FALSE, 'Moderate'),
('spa', 2023, 'Variable', 18, TRUE, 'Minimal'),
('monaco', 2023, 'Overcast', 24, FALSE, 'Minimal')
ON DUPLICATE KEY UPDATE
    circuit_id = VALUES(circuit_id);

-- Commit the changes
COMMIT;