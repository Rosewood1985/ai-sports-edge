-- Migration: Create Formula 1 Teams table
-- This migration creates the core F1 teams table with comprehensive constructor information

CREATE TABLE IF NOT EXISTS f1_teams (
    id VARCHAR(10) PRIMARY KEY, -- "RBR", "MER", "FER", "MCL", etc.
    name VARCHAR(100) NOT NULL, -- "Red Bull Racing"
    full_name VARCHAR(150), -- "Oracle Red Bull Racing"
    base_location VARCHAR(100),
    country VARCHAR(50),
    team_principal VARCHAR(100),
    
    -- Team Structure
    technical_director VARCHAR(100),
    chief_engineer VARCHAR(100),
    head_of_aerodynamics VARCHAR(100),
    sporting_director VARCHAR(100),
    
    -- Current Season Information
    current_season_points INTEGER DEFAULT 0,
    constructor_position INTEGER,
    current_season_wins INTEGER DEFAULT 0,
    current_season_podiums INTEGER DEFAULT 0,
    current_season_poles INTEGER DEFAULT 0,
    current_season_fastest_laps INTEGER DEFAULT 0,
    
    -- Car Information
    current_car_name VARCHAR(50), -- "RB19", "W14", "SF-23", etc.
    engine_supplier VARCHAR(50), -- "Honda RBPT", "Mercedes", "Ferrari", "Renault"
    engine_designation VARCHAR(50), -- specific engine model
    gearbox_supplier VARCHAR(50),
    
    -- Technical Specifications
    chassis_designation VARCHAR(50),
    aerodynamics_philosophy VARCHAR(100), -- brief description of aero approach
    suspension_type VARCHAR(50),
    brake_supplier VARCHAR(50),
    tire_supplier VARCHAR(50) DEFAULT 'Pirelli', -- all teams use Pirelli
    fuel_supplier VARCHAR(50),
    lubricant_supplier VARCHAR(50),
    
    -- Team Performance Metrics
    average_car_performance_rating DECIMAL(3,2), -- 1-10 scale
    reliability_rating DECIMAL(3,2), -- 1-10 scale
    development_rate DECIMAL(3,2), -- how quickly they improve the car
    strategy_execution_rating DECIMAL(3,2), -- quality of race strategy
    pit_stop_performance_rating DECIMAL(3,2), -- pit stop speed and reliability
    
    -- Historical Information
    team_founded_year INTEGER,
    f1_entry_year INTEGER,
    constructor_championships INTEGER DEFAULT 0,
    constructor_championship_years JSON, -- array of years won
    total_wins INTEGER DEFAULT 0,
    total_podiums INTEGER DEFAULT 0,
    total_poles INTEGER DEFAULT 0,
    total_fastest_laps INTEGER DEFAULT 0,
    total_races INTEGER DEFAULT 0,
    
    -- Financial and Commercial
    estimated_annual_budget DECIMAL(15,2), -- USD, important with budget cap
    budget_cap_compliance BOOLEAN DEFAULT TRUE,
    title_sponsor VARCHAR(100),
    major_sponsors JSON, -- array of major sponsor names
    estimated_team_value DECIMAL(15,2), -- USD
    
    -- Facilities and Infrastructure
    factory_size_sqm INTEGER, -- square meters
    wind_tunnel_type VARCHAR(50), -- "50% Scale", "60% Scale", etc.
    cfd_computational_power INTEGER, -- teraflops or similar metric
    simulator_technology VARCHAR(100),
    number_of_employees INTEGER,
    
    -- Technical Regulations Compliance
    cost_cap_penalties DECIMAL(10,2) DEFAULT 0, -- any penalties for overspending
    technical_regulations_breaches INTEGER DEFAULT 0,
    sporting_regulations_penalties INTEGER DEFAULT 0,
    
    -- Team Colors and Branding
    primary_color VARCHAR(7), -- hex color
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    logo_url VARCHAR(200),
    livery_description TEXT,
    
    -- Driver Lineup
    driver_1_id VARCHAR(20), -- current primary driver
    driver_2_id VARCHAR(20), -- current secondary driver
    reserve_drivers JSON, -- array of reserve driver IDs
    test_drivers JSON, -- array of test driver IDs
    
    -- Performance Analysis
    qualifying_performance_rating DECIMAL(3,2), -- 1-10 scale
    race_performance_rating DECIMAL(3,2),
    wet_weather_performance_rating DECIMAL(3,2),
    tire_management_rating DECIMAL(3,2),
    fuel_efficiency_rating DECIMAL(3,2),
    
    -- Team Dynamics
    team_morale_rating DECIMAL(3,2), -- 1-10 scale
    driver_satisfaction_rating DECIMAL(3,2),
    staff_turnover_rate DECIMAL(5,2), -- annual percentage
    internal_politics_level VARCHAR(20), -- "Low", "Medium", "High"
    
    -- Innovation and Development
    innovation_rating DECIMAL(3,2), -- 1-10 scale for technical innovation
    r_and_d_investment_percentage DECIMAL(4,1), -- percentage of budget on R&D
    patent_applications_annual INTEGER DEFAULT 0,
    technology_partnerships JSON, -- array of tech partners
    
    -- Regulatory and Legal
    current_legal_issues INTEGER DEFAULT 0, -- number of ongoing legal matters
    regulatory_penalties_current_season INTEGER DEFAULT 0,
    appeal_cases_pending INTEGER DEFAULT 0,
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'f1_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_constructor_position (constructor_position),
    INDEX idx_current_season_points (current_season_points DESC),
    INDEX idx_team_principal (team_principal),
    INDEX idx_engine_supplier (engine_supplier),
    INDEX idx_country (country),
    INDEX idx_last_updated (last_updated)
);

-- Create F1 team season statistics table for historical tracking
CREATE TABLE IF NOT EXISTS f1_team_season_stats (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    season_year INTEGER NOT NULL,
    
    -- Championship Results
    final_constructor_position INTEGER,
    total_points INTEGER DEFAULT 0,
    points_behind_leader INTEGER DEFAULT 0,
    points_ahead_next_team INTEGER DEFAULT 0,
    
    -- Performance Statistics
    races_entered INTEGER DEFAULT 0, -- should be consistent across teams
    wins INTEGER DEFAULT 0,
    podiums INTEGER DEFAULT 0,
    poles INTEGER DEFAULT 0,
    fastest_laps INTEGER DEFAULT 0,
    front_row_lockouts INTEGER DEFAULT 0, -- both cars P1 and P2
    double_podiums INTEGER DEFAULT 0, -- both cars on podium
    
    -- Car Development and Reliability
    car_name VARCHAR(50),
    major_updates INTEGER DEFAULT 0, -- number of significant car updates
    reliability_rating DECIMAL(3,2), -- 1-10 scale
    mechanical_dnfs INTEGER DEFAULT 0,
    power_unit_penalties INTEGER DEFAULT 0, -- grid penalties for PU changes
    
    -- Team Performance Analysis
    average_qualifying_position DECIMAL(4,2),
    average_race_position DECIMAL(4,2),
    championship_competitiveness VARCHAR(20), -- "Title Contender", "Midfield", etc.
    development_trajectory VARCHAR(20), -- "Improving", "Declining", "Stable"
    
    -- Driver Pairing Performance
    driver_1_id VARCHAR(20),
    driver_2_id VARCHAR(20),
    driver_1_points INTEGER DEFAULT 0,
    driver_2_points INTEGER DEFAULT 0,
    driver_pairing_effectiveness DECIMAL(3,2), -- 1-10 scale
    inter_team_incidents INTEGER DEFAULT 0, -- teammates crashing into each other
    
    -- Financial and Regulatory
    budget_cap_spending DECIMAL(15,2), -- how much of budget cap used
    budget_cap_breach BOOLEAN DEFAULT FALSE,
    regulatory_penalties INTEGER DEFAULT 0,
    cost_cap_penalty_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Innovation and Technical
    innovative_solutions_introduced INTEGER DEFAULT 0,
    technical_breakthroughs TEXT, -- description of major innovations
    wind_tunnel_efficiency_improvements DECIMAL(4,2), -- percentage improvement
    
    -- Staff and Structure Changes
    key_personnel_changes INTEGER DEFAULT 0, -- major hires/departures
    team_principal_changes BOOLEAN DEFAULT FALSE,
    technical_director_changes BOOLEAN DEFAULT FALSE,
    organizational_restructuring BOOLEAN DEFAULT FALSE,
    
    -- Commercial Success
    sponsorship_revenue DECIMAL(15,2),
    merchandise_sales DECIMAL(10,2),
    fan_engagement_score DECIMAL(3,2), -- 1-10 scale
    social_media_growth_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES f1_teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_season (team_id, season_year),
    INDEX idx_team_season_stats (team_id),
    INDEX idx_season_year (season_year),
    INDEX idx_constructor_position (final_constructor_position),
    INDEX idx_championship_competitiveness (championship_competitiveness)
);

-- Create F1 team technical specifications table for detailed car information
CREATE TABLE IF NOT EXISTS f1_team_technical_specs (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    season_year INTEGER NOT NULL,
    specification_version VARCHAR(20), -- "Launch Spec", "Bahrain Update", etc.
    
    -- Aerodynamics
    front_wing_philosophy VARCHAR(100),
    rear_wing_design VARCHAR(100),
    floor_design_approach VARCHAR(100),
    sidepod_configuration VARCHAR(100),
    cooling_solution VARCHAR(100),
    
    -- Chassis and Suspension
    chassis_construction VARCHAR(100), -- materials and construction method
    front_suspension_type VARCHAR(50),
    rear_suspension_type VARCHAR(50),
    weight_distribution DECIMAL(4,1), -- percentage front/rear
    center_of_gravity_height DECIMAL(4,1), -- mm from ground
    
    -- Power Unit Integration
    power_unit_installation VARCHAR(100),
    energy_recovery_efficiency DECIMAL(4,1), -- percentage
    fuel_efficiency_rating DECIMAL(3,2), -- 1-10 scale
    cooling_efficiency DECIMAL(3,2), -- 1-10 scale
    packaging_efficiency DECIMAL(3,2), -- how well components are packaged
    
    -- Performance Characteristics
    straight_line_speed_rating DECIMAL(3,2), -- 1-10 scale
    cornering_speed_rating DECIMAL(3,2),
    braking_performance_rating DECIMAL(3,2),
    tire_degradation_management DECIMAL(3,2),
    adaptability_to_tracks DECIMAL(3,2), -- how well car adapts to different circuits
    
    -- Development Potential
    development_potential_rating DECIMAL(3,2), -- 1-10 scale
    upgrade_pathways JSON, -- planned areas for development
    wind_tunnel_correlation DECIMAL(4,1), -- percentage correlation between WT and track
    cfd_accuracy DECIMAL(4,1), -- computational fluid dynamics accuracy
    
    -- Regulatory Compliance
    weight_distribution_compliance BOOLEAN DEFAULT TRUE,
    crash_test_results VARCHAR(50), -- "Passed", "Failed", "Marginal"
    scrutineering_issues INTEGER DEFAULT 0,
    technical_directive_compliance BOOLEAN DEFAULT TRUE,
    
    -- Innovation Features
    innovative_solutions JSON, -- array of innovative features
    patent_pending_technologies JSON,
    collaboration_technologies JSON, -- tech developed with partners
    
    -- Performance Data
    lap_time_simulation_accuracy DECIMAL(4,1), -- percentage accuracy of sim to reality
    race_strategy_optimization_level DECIMAL(3,2), -- 1-10 scale
    real_time_adjustment_capability DECIMAL(3,2), -- ability to adjust during race
    
    introduction_date DATE,
    retirement_date DATE, -- when this spec was retired
    is_current_spec BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES f1_teams(id) ON DELETE CASCADE,
    INDEX idx_team_technical_specs (team_id),
    INDEX idx_season_spec (season_year, specification_version),
    INDEX idx_current_specs (is_current_spec),
    INDEX idx_performance_ratings (straight_line_speed_rating, cornering_speed_rating)
);

-- Create F1 team personnel table for tracking staff changes
CREATE TABLE IF NOT EXISTS f1_team_personnel (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    person_name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(50), -- "Engineering", "Aerodynamics", "Strategy", etc.
    
    -- Employment Details
    hire_date DATE,
    departure_date DATE,
    is_current_employee BOOLEAN DEFAULT TRUE,
    employment_type VARCHAR(20), -- "Full-time", "Consultant", "Contract"
    
    -- Background and Experience
    previous_teams JSON, -- array of previous F1 teams
    years_f1_experience INTEGER DEFAULT 0,
    years_automotive_experience INTEGER DEFAULT 0,
    education_background VARCHAR(200),
    specializations JSON, -- array of technical specializations
    
    -- Performance and Impact
    performance_rating DECIMAL(3,2), -- 1-10 scale
    innovation_contributions INTEGER DEFAULT 0, -- number of innovations contributed to
    team_impact_score DECIMAL(3,2), -- 1-10 scale of impact on team performance
    leadership_role BOOLEAN DEFAULT FALSE,
    
    -- Compensation and Contract
    salary_range VARCHAR(50), -- "100k-200k", "200k-500k", etc.
    contract_expiration_date DATE,
    performance_bonuses BOOLEAN DEFAULT FALSE,
    equity_participation BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES f1_teams(id) ON DELETE CASCADE,
    INDEX idx_team_personnel (team_id),
    INDEX idx_position_department (position, department),
    INDEX idx_current_employees (is_current_employee),
    INDEX idx_hire_departure_dates (hire_date, departure_date)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_f1_teams_timestamp 
    BEFORE UPDATE ON f1_teams 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample F1 teams for testing (optional)
INSERT INTO f1_teams (
    id, name, full_name, base_location, country, team_principal,
    current_season_points, constructor_position, current_car_name, engine_supplier
) VALUES 
('RBR', 'Red Bull Racing', 'Oracle Red Bull Racing', 'Milton Keynes', 'United Kingdom', 'Christian Horner', 860, 1, 'RB19', 'Honda RBPT'),
('MER', 'Mercedes', 'Mercedes-AMG Petronas F1 Team', 'Brackley', 'United Kingdom', 'Toto Wolff', 409, 2, 'W14', 'Mercedes'),
('FER', 'Ferrari', 'Scuderia Ferrari', 'Maranello', 'Italy', 'Frédéric Vasseur', 406, 3, 'SF-23', 'Ferrari'),
('MCL', 'McLaren', 'McLaren F1 Team', 'Woking', 'United Kingdom', 'Andrea Stella', 302, 4, 'MCL60', 'Mercedes'),
('AM', 'Aston Martin', 'Aston Martin Aramco Cognizant F1 Team', 'Silverstone', 'United Kingdom', 'Mike Krack', 280, 5, 'AMR23', 'Mercedes')
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample season statistics
INSERT INTO f1_team_season_stats (
    team_id, season_year, final_constructor_position, total_points,
    wins, podiums, poles, car_name
) VALUES 
('RBR', 2023, 1, 860, 21, 35, 12, 'RB19'),
('MER', 2023, 2, 409, 1, 8, 1, 'W14'),
('FER', 2023, 3, 406, 1, 7, 3, 'SF-23')
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample technical specifications
INSERT INTO f1_team_technical_specs (
    team_id, season_year, specification_version, front_wing_philosophy,
    straight_line_speed_rating, cornering_speed_rating, is_current_spec
) VALUES 
('RBR', 2024, 'RB20 Launch Spec', 'High downforce with efficient outwash', 9.2, 9.8, TRUE),
('MER', 2024, 'W15 Launch Spec', 'Zero sidepod concept evolution', 8.5, 8.7, TRUE),
('FER', 2024, 'SF-24 Launch Spec', 'Traditional sidepod with optimized floor', 9.0, 9.1, TRUE)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Commit the changes
COMMIT;