-- Migration: Create MLB Players table
-- This migration creates the core MLB players table with comprehensive player information and statistics

CREATE TABLE IF NOT EXISTS mlb_players (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Basic Information
    position VARCHAR(10) NOT NULL, -- "P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"
    jersey_number INTEGER,
    bats ENUM('R', 'L', 'S') NOT NULL, -- Right, Left, Switch
    throws ENUM('R', 'L') NOT NULL,
    
    -- Physical Statistics
    height VARCHAR(10), -- "6'2""
    weight INTEGER, -- pounds
    birth_date DATE,
    age INTEGER,
    birth_city VARCHAR(100),
    birth_state VARCHAR(50),
    birth_country VARCHAR(50),
    
    -- Career Information
    mlb_debut DATE,
    years_of_service DECIMAL(3,1), -- includes partial years
    college VARCHAR(100),
    high_school VARCHAR(100),
    
    -- Draft Information
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    draft_team VARCHAR(10),
    
    -- Contract Information
    salary DECIMAL(12,2),
    contract_years_remaining INTEGER,
    contract_type VARCHAR(50), -- "Major League", "Minor League", "Pre-Arbitration"
    arbitration_eligible BOOLEAN DEFAULT FALSE,
    free_agent_year INTEGER,
    
    -- Current Season Batting Statistics (for position players)
    games_played INTEGER DEFAULT 0,
    plate_appearances INTEGER DEFAULT 0,
    at_bats INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    doubles INTEGER DEFAULT 0,
    triples INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    rbi INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    caught_stealing INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    hit_by_pitch INTEGER DEFAULT 0,
    sacrifice_flies INTEGER DEFAULT 0,
    sacrifice_hits INTEGER DEFAULT 0,
    
    -- Advanced Batting Statistics
    batting_average DECIMAL(4,3) DEFAULT 0.000,
    on_base_percentage DECIMAL(4,3) DEFAULT 0.000,
    slugging_percentage DECIMAL(4,3) DEFAULT 0.000,
    ops DECIMAL(4,3) DEFAULT 0.000,
    war DECIMAL(4,1) DEFAULT 0.0, -- Wins Above Replacement
    wrc_plus INTEGER DEFAULT 100, -- Weighted Runs Created Plus (100 = league average)
    babip DECIMAL(4,3) DEFAULT 0.000, -- Batting Average on Balls in Play
    iso DECIMAL(4,3) DEFAULT 0.000, -- Isolated Power
    
    -- Plate Discipline Statistics
    bb_percentage DECIMAL(5,2) DEFAULT 0.00, -- Walk rate
    k_percentage DECIMAL(5,2) DEFAULT 0.00, -- Strikeout rate
    bb_k_ratio DECIMAL(4,2) DEFAULT 0.00,
    
    -- Current Season Pitching Statistics (for pitchers)
    games_started INTEGER DEFAULT 0,
    games_finished INTEGER DEFAULT 0,
    wins_pitching INTEGER DEFAULT 0,
    losses_pitching INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    blown_saves INTEGER DEFAULT 0,
    holds INTEGER DEFAULT 0,
    era DECIMAL(4,2) DEFAULT 0.00,
    innings_pitched DECIMAL(5,1) DEFAULT 0.0,
    hits_allowed INTEGER DEFAULT 0,
    runs_allowed INTEGER DEFAULT 0,
    earned_runs_allowed INTEGER DEFAULT 0,
    walks_allowed INTEGER DEFAULT 0,
    strikeouts_pitching INTEGER DEFAULT 0,
    home_runs_allowed INTEGER DEFAULT 0,
    
    -- Advanced Pitching Statistics
    whip DECIMAL(4,3) DEFAULT 0.000, -- Walks + Hits per Inning Pitched
    fip DECIMAL(4,2) DEFAULT 0.00, -- Fielding Independent Pitching
    xfip DECIMAL(4,2) DEFAULT 0.00, -- Expected Fielding Independent Pitching
    war_pitching DECIMAL(4,1) DEFAULT 0.0,
    babip_against DECIMAL(4,3) DEFAULT 0.000,
    
    -- Pitcher Velocity and Stuff
    avg_fastball_velocity DECIMAL(4,1), -- mph
    max_fastball_velocity DECIMAL(4,1),
    avg_breaking_ball_velocity DECIMAL(4,1),
    avg_changeup_velocity DECIMAL(4,1),
    
    -- Fielding Statistics
    games_at_position INTEGER DEFAULT 0,
    innings_at_position DECIMAL(5,1) DEFAULT 0.0,
    putouts INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    fielding_percentage DECIMAL(4,3) DEFAULT 0.000,
    range_factor DECIMAL(4,2) DEFAULT 0.00,
    defensive_runs_saved INTEGER DEFAULT 0,
    
    -- Base Running
    stolen_base_percentage DECIMAL(4,3) DEFAULT 0.000,
    base_running_runs DECIMAL(4,1) DEFAULT 0.0,
    
    -- Injury and Health Status
    injury_status ENUM('Active', 'Day-to-Day', '10-Day IL', '15-Day IL', '60-Day IL', 'Bereavement', 'Suspended') DEFAULT 'Active',
    injury_description VARCHAR(200),
    injury_date DATE,
    expected_return_date DATE,
    days_on_il INTEGER DEFAULT 0,
    
    -- Performance Trends
    last_30_days_ops DECIMAL(4,3),
    last_15_days_ops DECIMAL(4,3),
    last_7_days_ops DECIMAL(4,3),
    home_ops DECIMAL(4,3),
    away_ops DECIMAL(4,3),
    vs_rhp_ops DECIMAL(4,3),
    vs_lhp_ops DECIMAL(4,3),
    
    -- Clutch Performance
    risp_batting_average DECIMAL(4,3), -- Runners In Scoring Position
    clutch_hits INTEGER DEFAULT 0,
    walk_off_hits INTEGER DEFAULT 0,
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'mlb_official_api',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (team_id) REFERENCES mlb_teams(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_team_id (team_id),
    INDEX idx_position (position),
    INDEX idx_injury_status (injury_status),
    INDEX idx_war (war DESC, war_pitching DESC),
    INDEX idx_batting_performance (batting_average DESC, ops DESC),
    INDEX idx_pitching_performance (era ASC, whip ASC),
    INDEX idx_last_updated (last_updated)
);

-- Create MLB player career statistics table for historical tracking
CREATE TABLE IF NOT EXISTS mlb_player_career_stats (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    season_year INTEGER NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    
    -- Season Totals
    games_played INTEGER DEFAULT 0,
    plate_appearances INTEGER DEFAULT 0,
    at_bats INTEGER DEFAULT 0,
    
    -- Batting Stats
    runs INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    doubles INTEGER DEFAULT 0,
    triples INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    rbi INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    
    -- Pitching Stats (if applicable)
    wins_pitching INTEGER DEFAULT 0,
    losses_pitching INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    era DECIMAL(4,2),
    innings_pitched DECIMAL(5,1),
    strikeouts_pitching INTEGER DEFAULT 0,
    
    -- Advanced Metrics
    war DECIMAL(4,1) DEFAULT 0.0,
    war_pitching DECIMAL(4,1) DEFAULT 0.0,
    
    -- Awards and Recognition
    all_star_selection BOOLEAN DEFAULT FALSE,
    mvp_votes INTEGER DEFAULT 0,
    cy_young_votes INTEGER DEFAULT 0,
    rookie_of_year_votes INTEGER DEFAULT 0,
    gold_glove BOOLEAN DEFAULT FALSE,
    silver_slugger BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES mlb_players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES mlb_teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_season (player_id, season_year),
    INDEX idx_player_career (player_id),
    INDEX idx_season_year (season_year),
    INDEX idx_awards (all_star_selection, mvp_votes, cy_young_votes)
);

-- Create MLB player minor league statistics table
CREATE TABLE IF NOT EXISTS mlb_player_minor_league_stats (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    season_year INTEGER NOT NULL,
    level VARCHAR(10) NOT NULL, -- "AAA", "AA", "A+", "A", "Rookie"
    team_name VARCHAR(100),
    
    -- Performance Statistics
    games_played INTEGER DEFAULT 0,
    batting_average DECIMAL(4,3) DEFAULT 0.000,
    on_base_percentage DECIMAL(4,3) DEFAULT 0.000,
    slugging_percentage DECIMAL(4,3) DEFAULT 0.000,
    home_runs INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    
    -- Pitching Stats (if applicable)
    era DECIMAL(4,2),
    innings_pitched DECIMAL(5,1),
    strikeouts_pitching INTEGER DEFAULT 0,
    walks_allowed INTEGER DEFAULT 0,
    
    -- Prospect Rankings
    prospect_ranking INTEGER, -- within organization
    ba_ranking INTEGER, -- Baseball America ranking
    mlb_pipeline_ranking INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES mlb_players(id) ON DELETE CASCADE,
    INDEX idx_player_minors (player_id),
    INDEX idx_level_season (level, season_year),
    INDEX idx_prospect_rankings (prospect_ranking, ba_ranking)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_mlb_players_timestamp 
    BEFORE UPDATE ON mlb_players 
    FOR EACH ROW 
BEGIN
    SET NEW.last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample MLB players for testing (optional)
INSERT INTO mlb_players (
    id, name, team_id, position, jersey_number, bats, throws, 
    batting_average, home_runs, rbi, war
) VALUES 
('aaron_judge', 'Aaron Judge', 'NYY', 'RF', 99, 'R', 'R', 0.311, 62, 131, 11.5),
('mookie_betts', 'Mookie Betts', 'LAD', 'RF', 50, 'R', 'R', 0.269, 35, 82, 8.3),
('jose_altuve', 'Jose Altuve', 'HOU', '2B', 27, 'R', 'R', 0.300, 28, 57, 5.7),
('jacob_degrom', 'Jacob deGrom', 'NYM', 'P', 48, 'L', 'R', 0.000, 0, 0, 0.0),
('shohei_ohtani', 'Shohei Ohtani', 'LAA', 'DH', 17, 'L', 'R', 0.273, 34, 95, 9.6)
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Commit the changes
COMMIT;