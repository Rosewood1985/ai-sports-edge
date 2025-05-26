-- Migration: Create Cross-Sport Betting Opportunities table
-- This migration creates the unified betting opportunities table for all sports

CREATE TABLE IF NOT EXISTS betting_opportunities (
    id VARCHAR(50) PRIMARY KEY,
    sport VARCHAR(20) NOT NULL,
    event_id VARCHAR(50) NOT NULL,
    bet_type VARCHAR(50) NOT NULL, -- "moneyline", "spread", "total", "prop", "futures"
    
    -- Opportunity Classification
    opportunity_type VARCHAR(50) NOT NULL, -- "value_bet", "arbitrage", "line_movement", "public_fade", "sharp_action"
    opportunity_tier VARCHAR(20) NOT NULL, -- "Elite", "High", "Medium", "Low"
    opportunity_subtype VARCHAR(50), -- specific subcategory within type
    
    -- Betting Market Information
    sportsbook VARCHAR(50) NOT NULL,
    bet_description TEXT NOT NULL, -- detailed description of the bet
    betting_line VARCHAR(100), -- the actual line/odds being bet
    
    -- Probability Analysis
    predicted_probability DECIMAL(5,3) NOT NULL,
    market_implied_probability DECIMAL(5,3) NOT NULL,
    edge DECIMAL(5,3) NOT NULL, -- predicted - implied (positive = value)
    true_probability_estimate DECIMAL(5,3), -- our best estimate of true probability
    
    -- Odds and Pricing
    current_odds INTEGER NOT NULL, -- American odds format
    opening_odds INTEGER, -- what the odds opened at
    best_available_odds INTEGER, -- best odds across all books
    worst_available_odds INTEGER, -- worst odds across all books
    odds_movement_percentage DECIMAL(5,2), -- percentage change from opening
    
    -- Value Assessment
    expected_value DECIMAL(6,3) NOT NULL, -- expected value of the bet
    expected_value_percentage DECIMAL(5,2), -- EV as percentage of stake
    kelly_criterion_percentage DECIMAL(5,2), -- Kelly Criterion recommended stake
    recommended_stake DECIMAL(5,3), -- Kelly Criterion percentage
    max_recommended_stake DECIMAL(5,3), -- maximum recommended stake percentage
    
    -- Risk Assessment
    confidence_level DECIMAL(5,3) NOT NULL,
    risk_rating VARCHAR(20), -- "Very Low", "Low", "Medium", "High", "Very High"
    risk_factors JSON, -- ["injury_concern", "weather_risk", "line_trap"]
    variance_estimate DECIMAL(6,3), -- estimated variance of outcome
    worst_case_scenario DECIMAL(6,3), -- worst possible outcome probability
    
    -- Market Context
    market_efficiency_score DECIMAL(5,3), -- how efficient this market typically is
    public_betting_percentage DECIMAL(5,2), -- percentage of public on this side
    sharp_money_percentage DECIMAL(5,2), -- percentage of sharp money
    betting_volume_estimate INTEGER, -- estimated betting volume
    line_shopping_advantage DECIMAL(5,3), -- advantage from shopping lines
    
    -- Historical Performance
    similar_bets_historical_roi DECIMAL(6,3), -- ROI of similar bets historically
    sportsbook_historical_edge DECIMAL(5,3), -- historical edge at this sportsbook
    bet_type_success_rate DECIMAL(5,3), -- success rate for this type of bet
    
    -- Timing and Urgency
    time_sensitivity VARCHAR(20), -- "Critical", "High", "Medium", "Low"
    optimal_betting_window_start DATETIME, -- when to start considering this bet
    optimal_betting_window_end DATETIME, -- when opportunity likely expires
    line_movement_prediction VARCHAR(50), -- predicted direction of line movement
    
    -- Cross-Sport Intelligence
    cross_sport_correlation DECIMAL(5,3), -- correlation with similar bets in other sports
    pattern_match_confidence DECIMAL(5,3), -- confidence in pattern matching
    similar_opportunities JSON, -- similar opportunities in other sports
    
    -- Outcome Tracking
    actual_outcome VARCHAR(20), -- "win", "loss", "push", "cancelled"
    actual_odds_at_bet INTEGER, -- odds when bet was actually placed (if tracked)
    profit_loss DECIMAL(10,2), -- actual P&L if bet was placed
    outcome_date DATETIME, -- when outcome was determined
    
    -- Performance Metrics
    roi_if_hit DECIMAL(6,3), -- ROI if bet wins
    units_risked DECIMAL(5,2), -- units risked (if bet was made)
    units_won_lost DECIMAL(6,2), -- actual units won/lost
    contribution_to_overall_roi DECIMAL(6,3), -- contribution to overall portfolio ROI
    
    -- Model and Analysis Source
    model_version VARCHAR(20), -- ML model version that identified opportunity
    analysis_confidence DECIMAL(5,3), -- confidence in the analysis
    human_expert_validation BOOLEAN DEFAULT FALSE, -- if validated by human expert
    automated_bet_eligible BOOLEAN DEFAULT FALSE, -- if eligible for automated betting
    
    -- Market Dynamics
    opening_market_maker VARCHAR(50), -- who set the opening line
    line_originator VARCHAR(50), -- who originated this specific line
    follower_books JSON, -- books that followed this line movement
    steam_move BOOLEAN DEFAULT FALSE, -- if this represents a steam move
    reverse_line_movement BOOLEAN DEFAULT FALSE, -- line moved against public money
    
    -- External Factors
    weather_impact DECIMAL(5,3), -- weather impact on this bet
    injury_impact DECIMAL(5,3), -- injury impact
    news_impact DECIMAL(5,3), -- impact of recent news
    social_sentiment_impact DECIMAL(5,3), -- social media sentiment impact
    
    -- Regulatory and Compliance
    legal_in_jurisdiction BOOLEAN DEFAULT TRUE,
    minimum_age_verified BOOLEAN DEFAULT TRUE,
    responsible_gambling_flagged BOOLEAN DEFAULT FALSE,
    betting_limit_applicable DECIMAL(10,2), -- any betting limits
    
    -- Technology and Execution
    api_available BOOLEAN DEFAULT FALSE, -- if bet can be placed via API
    mobile_app_available BOOLEAN DEFAULT TRUE,
    live_betting BOOLEAN DEFAULT FALSE, -- if this is a live/in-game bet
    early_cashout_available BOOLEAN DEFAULT FALSE,
    
    -- Social and Community
    community_consensus DECIMAL(5,3), -- what the betting community thinks
    expert_picks_alignment DECIMAL(5,3), -- alignment with expert picks
    contrarian_indicator DECIMAL(5,3), -- how contrarian this bet is
    social_media_buzz DECIMAL(5,3), -- social media attention level
    
    -- Business Intelligence
    customer_acquisition_potential DECIMAL(5,3), -- potential to acquire new customers
    customer_retention_impact DECIMAL(5,3), -- impact on customer retention
    brand_alignment_score DECIMAL(5,3), -- alignment with brand values
    promotional_opportunity BOOLEAN DEFAULT FALSE,
    
    -- Metadata and Governance
    identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_date DATETIME,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    deactivation_reason VARCHAR(100), -- why opportunity was deactivated
    
    -- Audit and Tracking
    created_by VARCHAR(50) DEFAULT 'ai_sports_edge_system',
    last_updated_by VARCHAR(50),
    validation_required BOOLEAN DEFAULT FALSE,
    validation_completed BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'ai_sports_edge_betting',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_sport_event (sport, event_id),
    INDEX idx_edge (edge DESC),
    INDEX idx_confidence (confidence_level DESC),
    INDEX idx_active_opportunities (is_active, expires_at),
    INDEX idx_event_date (event_date),
    INDEX idx_opportunity_type (opportunity_type, opportunity_tier),
    INDEX idx_sportsbook (sportsbook),
    INDEX idx_expected_value (expected_value DESC),
    INDEX idx_risk_rating (risk_rating),
    INDEX idx_time_sensitivity (time_sensitivity, optimal_betting_window_end),
    INDEX idx_sport_edge (sport, edge DESC),
    INDEX idx_bet_type (bet_type, expected_value DESC),
    INDEX idx_last_updated (last_updated)
);

-- Create betting opportunity tracking table for performance analysis
CREATE TABLE IF NOT EXISTS betting_opportunity_tracking (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    opportunity_id VARCHAR(50) NOT NULL,
    
    -- Tracking Event
    tracking_event VARCHAR(50) NOT NULL, -- "identified", "validated", "bet_placed", "outcome_determined"
    event_timestamp DATETIME NOT NULL,
    
    -- Market State at Time of Event
    odds_at_event INTEGER,
    implied_probability_at_event DECIMAL(5,3),
    edge_at_event DECIMAL(5,3),
    market_volume_at_event INTEGER,
    
    -- External Conditions
    weather_conditions VARCHAR(100),
    news_events JSON, -- relevant news at time of event
    market_conditions VARCHAR(50), -- "Normal", "Volatile", "Illiquid"
    
    -- User/System Actions
    action_taken VARCHAR(50), -- specific action taken
    action_by VARCHAR(50), -- who/what took the action
    bet_amount DECIMAL(10,2), -- if bet was placed
    
    -- Analysis and Notes
    analysis_notes TEXT,
    system_confidence DECIMAL(5,3),
    human_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (opportunity_id) REFERENCES betting_opportunities(id) ON DELETE CASCADE,
    INDEX idx_opportunity_tracking (opportunity_id),
    INDEX idx_tracking_event (tracking_event, event_timestamp),
    INDEX idx_event_timestamp (event_timestamp)
);

-- Create betting strategy performance table
CREATE TABLE IF NOT EXISTS betting_strategy_performance (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    sport VARCHAR(20) NOT NULL,
    strategy_name VARCHAR(100) NOT NULL,
    strategy_type VARCHAR(50) NOT NULL, -- "Value", "Arbitrage", "Momentum", "Contrarian"
    
    -- Performance Period
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Betting Statistics
    total_opportunities_identified INTEGER DEFAULT 0,
    total_bets_placed INTEGER DEFAULT 0,
    bet_placement_rate DECIMAL(5,3), -- percentage of opportunities acted upon
    
    -- Financial Performance
    total_amount_wagered DECIMAL(12,2) DEFAULT 0,
    total_amount_won DECIMAL(12,2) DEFAULT 0,
    net_profit_loss DECIMAL(12,2) DEFAULT 0,
    roi_percentage DECIMAL(6,3),
    units_won_lost DECIMAL(8,2),
    
    -- Win/Loss Analysis
    winning_bets INTEGER DEFAULT 0,
    losing_bets INTEGER DEFAULT 0,
    push_bets INTEGER DEFAULT 0,
    win_rate DECIMAL(5,3),
    average_winning_bet DECIMAL(8,2),
    average_losing_bet DECIMAL(8,2),
    
    -- Risk Metrics
    max_drawdown DECIMAL(8,2), -- largest losing streak
    sharpe_ratio DECIMAL(5,3), -- risk-adjusted return
    volatility DECIMAL(5,3), -- standard deviation of returns
    var_95 DECIMAL(8,2), -- Value at Risk (95% confidence)
    
    -- Efficiency Metrics
    average_edge_identified DECIMAL(5,3),
    edge_realization_rate DECIMAL(5,3), -- how much of identified edge was captured
    timing_efficiency DECIMAL(5,3), -- how well timing was executed
    line_shopping_effectiveness DECIMAL(5,3),
    
    -- Strategy Adaptation
    strategy_adjustments_made INTEGER DEFAULT 0,
    adjustment_impact_on_performance DECIMAL(6,3),
    learning_curve_progress DECIMAL(5,3),
    
    -- Comparison Metrics
    benchmark_comparison DECIMAL(6,3), -- performance vs benchmark
    market_outperformance DECIMAL(6,3), -- outperformance vs market
    peer_strategy_ranking INTEGER, -- ranking among similar strategies
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sport_strategy (sport, strategy_name),
    INDEX idx_performance_period (period_start_date, period_end_date),
    INDEX idx_roi_performance (roi_percentage DESC, sharpe_ratio DESC),
    INDEX idx_strategy_type (strategy_type, win_rate DESC)
);

-- Create sportsbook analysis table for book-specific intelligence
CREATE TABLE IF NOT EXISTS sportsbook_analysis (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    sportsbook_name VARCHAR(50) NOT NULL,
    sport VARCHAR(20) NOT NULL,
    
    -- Analysis Period
    analysis_start_date DATE NOT NULL,
    analysis_end_date DATE NOT NULL,
    
    -- Line Setting Analysis
    line_setting_accuracy DECIMAL(5,3), -- how accurate their lines are
    line_setting_bias DECIMAL(6,4), -- systematic bias in line setting
    line_movement_predictability DECIMAL(5,3), -- how predictable their movements are
    opening_line_advantage DECIMAL(5,3), -- advantage of betting their opening lines
    
    -- Market Position
    market_share_estimate DECIMAL(5,2), -- estimated market share percentage
    public_book_rating DECIMAL(3,2), -- 1-10 scale (10 = very public)
    sharp_tolerance DECIMAL(3,2), -- 1-10 scale (10 = very sharp-tolerant)
    betting_limits JSON, -- betting limits for different bet types
    
    -- Efficiency Metrics
    closing_line_value DECIMAL(5,3), -- how much CLV is available
    arbitrage_opportunities INTEGER DEFAULT 0, -- number of arb opportunities
    soft_line_frequency DECIMAL(5,3), -- frequency of soft lines
    steam_following_speed DECIMAL(3,2), -- how quickly they follow steam moves
    
    -- Customer Treatment
    winner_tolerance DECIMAL(3,2), -- tolerance for winning customers
    account_limitation_aggressiveness DECIMAL(3,2),
    payout_reliability DECIMAL(3,2), -- reliability of payouts
    customer_service_quality DECIMAL(3,2),
    
    -- Technology and Features
    api_availability BOOLEAN DEFAULT FALSE,
    live_betting_quality DECIMAL(3,2),
    mobile_app_quality DECIMAL(3,2),
    bet_types_offered INTEGER, -- number of different bet types
    
    -- Promotional Analysis
    bonus_generosity DECIMAL(3,2), -- how generous their bonuses are
    rollover_requirements_severity DECIMAL(3,2),
    promotional_value_score DECIMAL(5,3),
    loyalty_program_value DECIMAL(3,2),
    
    -- Risk Assessment
    financial_stability_rating DECIMAL(3,2), -- 1-10 scale
    regulatory_compliance_score DECIMAL(3,2),
    operational_risk_factors JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_sportsbook_sport_period (sportsbook_name, sport, analysis_start_date),
    INDEX idx_sportsbook_sport (sportsbook_name, sport),
    INDEX idx_analysis_period (analysis_start_date, analysis_end_date),
    INDEX idx_efficiency_metrics (closing_line_value DESC, soft_line_frequency DESC)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_betting_strategy_performance_timestamp 
    BEFORE UPDATE ON betting_strategy_performance 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Create trigger to update sportsbook analysis timestamp
DELIMITER //
CREATE TRIGGER update_sportsbook_analysis_timestamp 
    BEFORE UPDATE ON sportsbook_analysis 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample betting opportunities for testing (optional)
INSERT INTO betting_opportunities (
    id, sport, event_id, bet_type, opportunity_type, opportunity_tier,
    sportsbook, predicted_probability, market_implied_probability, edge,
    current_odds, expected_value, confidence_level, event_date
) VALUES 
('ufc_001_value', 'UFC', 'ufc_300', 'moneyline', 'value_bet', 'High', 'DraftKings', 0.650, 0.580, 0.070, 175, 0.125, 0.850, '2024-04-13 22:00:00'),
('mlb_001_total', 'MLB', 'NYY_BOS_20240515', 'total', 'line_movement', 'Medium', 'FanDuel', 0.520, 0.485, 0.035, 105, 0.065, 0.720, '2024-05-15 19:00:00'),
('f1_001_podium', 'F1', '2024_01_bahrain', 'prop', 'value_bet', 'High', 'BetMGM', 0.280, 0.220, 0.060, 350, 0.180, 0.780, '2024-03-02 18:00:00')
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample strategy performance data
INSERT INTO betting_strategy_performance (
    sport, strategy_name, strategy_type, period_start_date, period_end_date,
    total_opportunities_identified, total_bets_placed, roi_percentage, win_rate
) VALUES 
('UFC', 'ML Value Hunter', 'Value', '2024-01-01', '2024-03-31', 45, 32, 0.147, 0.656),
('MLB', 'Weather Edge', 'Value', '2024-04-01', '2024-06-30', 128, 89, 0.089, 0.584),
('F1', 'Qualifying Edge', 'Value', '2024-03-01', '2024-05-31', 24, 18, 0.203, 0.722)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Commit the changes
COMMIT;