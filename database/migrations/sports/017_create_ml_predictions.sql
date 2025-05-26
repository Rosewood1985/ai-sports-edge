-- Migration: Create Cross-Sport ML Predictions table
-- This migration creates the unified ML predictions table for all sports

CREATE TABLE IF NOT EXISTS ml_predictions (
    id VARCHAR(50) PRIMARY KEY,
    sport VARCHAR(20) NOT NULL, -- "UFC", "MLB", "NFL", "WNBA", "F1"
    event_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- "fight", "game", "race"
    
    -- Prediction Metadata
    model_version VARCHAR(20) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- "ensemble", "neural_network", "random_forest", etc.
    prediction_algorithm VARCHAR(50), -- specific algorithm used
    training_data_size INTEGER, -- number of records used for training
    last_training_date DATETIME,
    
    -- Prediction Data Structure (JSON for flexibility across sports)
    predictions JSON NOT NULL, -- sport-specific prediction data
    confidence_score DECIMAL(5,3) NOT NULL, -- 0.000 to 1.000
    prediction_tier VARCHAR(20) NOT NULL, -- "Primary", "Secondary", "Experimental"
    
    -- Feature Data and Analysis
    features_used JSON, -- features that went into the model
    feature_count INTEGER, -- total number of features
    feature_importance JSON, -- which features were most important
    feature_correlation_matrix JSON, -- correlations between features
    
    -- Model Performance Metrics
    expected_accuracy DECIMAL(5,3), -- expected accuracy based on validation
    historical_accuracy DECIMAL(5,3), -- historical accuracy of this model type
    cross_validation_score DECIMAL(5,3), -- CV score from training
    model_complexity_score DECIMAL(5,3), -- complexity indicator (overfitting risk)
    
    -- Prediction Specifics by Sport
    ufc_predictions JSON, -- specific UFC predictions (winner, method, round)
    mlb_predictions JSON, -- specific MLB predictions (runs, winner, props)
    nfl_predictions JSON, -- specific NFL predictions (points, winner, props)
    wnba_predictions JSON, -- specific WNBA predictions (points, winner, props)
    f1_predictions JSON, -- specific F1 predictions (podium, points, DNF)
    
    -- Uncertainty and Risk Assessment
    prediction_uncertainty DECIMAL(5,3), -- model uncertainty measure
    data_quality_score DECIMAL(5,3), -- quality of input data
    external_factors_impact DECIMAL(5,3), -- impact of external factors
    risk_factors JSON, -- identified risk factors
    confidence_intervals JSON, -- confidence intervals for predictions
    
    -- Contextual Information
    weather_factor_impact DECIMAL(5,3), -- weather impact on predictions
    injury_factor_impact DECIMAL(5,3), -- injury impact on predictions
    recent_form_weight DECIMAL(5,3), -- how much recent form influenced prediction
    historical_data_weight DECIMAL(5,3), -- how much historical data influenced prediction
    
    -- Validation and Testing
    backtesting_results JSON, -- results from backtesting
    simulation_results JSON, -- Monte Carlo or similar simulation results
    stress_test_results JSON, -- how predictions hold under stress scenarios
    
    -- Actual Outcome Tracking
    actual_outcome JSON, -- filled in after event completes
    prediction_accuracy DECIMAL(5,3), -- how accurate the prediction was
    accuracy_by_feature JSON, -- accuracy breakdown by feature category
    error_analysis JSON, -- analysis of prediction errors
    
    -- Business Impact Metrics
    betting_value_identified DECIMAL(8,2), -- potential betting value in USD
    user_engagement_score DECIMAL(5,3), -- how much users engaged with prediction
    click_through_rate DECIMAL(5,3), -- CTR on prediction
    conversion_rate DECIMAL(5,3), -- rate of users acting on prediction
    
    -- Model Updates and Improvements
    requires_model_update BOOLEAN DEFAULT FALSE,
    update_priority VARCHAR(20), -- "High", "Medium", "Low"
    improvement_suggestions JSON, -- identified areas for improvement
    next_training_scheduled DATETIME,
    
    -- Real-time Factors
    live_data_integration BOOLEAN DEFAULT FALSE, -- if real-time data was used
    prediction_staleness INTEGER DEFAULT 0, -- hours since prediction was made
    market_reaction_impact DECIMAL(5,3), -- how market reacted to prediction
    social_sentiment_factor DECIMAL(5,3), -- social media sentiment impact
    
    -- Cross-Sport Learning
    cross_sport_insights JSON, -- insights from other sports that influenced prediction
    similar_scenarios JSON, -- similar scenarios from other sports
    transfer_learning_applied BOOLEAN DEFAULT FALSE,
    
    -- Metadata and Governance
    prediction_source VARCHAR(50), -- system/service that generated prediction
    regulatory_compliance BOOLEAN DEFAULT TRUE,
    ethical_considerations JSON, -- any ethical considerations noted
    explainability_score DECIMAL(5,3), -- how explainable the prediction is
    
    -- Timing and Event Context
    prediction_created_at DATETIME NOT NULL,
    event_date DATETIME,
    time_to_event_hours INTEGER, -- hours between prediction and event
    is_validated BOOLEAN DEFAULT FALSE,
    validation_date DATETIME,
    
    -- API and Integration
    api_endpoint_used VARCHAR(100), -- API endpoint used for prediction
    processing_time_ms INTEGER, -- time taken to generate prediction
    cache_hit BOOLEAN DEFAULT FALSE, -- if prediction was served from cache
    
    -- Data Management
    data_source VARCHAR(50) DEFAULT 'ai_sports_edge_ml',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_sport_event (sport, event_id),
    INDEX idx_confidence (confidence_score DESC),
    INDEX idx_event_date (event_date),
    INDEX idx_validation (is_validated, validation_date),
    INDEX idx_model_version (model_version, model_type),
    INDEX idx_prediction_tier (prediction_tier),
    INDEX idx_accuracy (prediction_accuracy DESC),
    INDEX idx_sport_confidence (sport, confidence_score DESC),
    INDEX idx_event_timing (event_date, time_to_event_hours),
    INDEX idx_last_updated (last_updated)
);

-- Create ML model performance tracking table
CREATE TABLE IF NOT EXISTS ml_model_performance (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    sport VARCHAR(20) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    
    -- Performance Period
    evaluation_start_date DATE NOT NULL,
    evaluation_end_date DATE NOT NULL,
    total_predictions INTEGER DEFAULT 0,
    
    -- Accuracy Metrics
    overall_accuracy DECIMAL(5,3),
    precision_score DECIMAL(5,3),
    recall_score DECIMAL(5,3),
    f1_score DECIMAL(5,3),
    auc_roc DECIMAL(5,3), -- Area Under ROC Curve
    
    -- Accuracy by Confidence Level
    high_confidence_accuracy DECIMAL(5,3), -- accuracy for confidence > 0.8
    medium_confidence_accuracy DECIMAL(5,3), -- accuracy for confidence 0.5-0.8
    low_confidence_accuracy DECIMAL(5,3), -- accuracy for confidence < 0.5
    
    -- Accuracy by Prediction Type (sport-specific)
    primary_outcome_accuracy DECIMAL(5,3), -- winner/result accuracy
    secondary_outcome_accuracy DECIMAL(5,3), -- props/details accuracy
    margin_prediction_accuracy DECIMAL(5,3), -- score/margin accuracy
    
    -- Calibration Metrics
    calibration_score DECIMAL(5,3), -- how well probabilities match actual outcomes
    brier_score DECIMAL(5,3), -- scoring rule for probability predictions
    log_loss DECIMAL(5,3), -- logarithmic loss
    
    -- Business Impact Metrics
    total_betting_value_identified DECIMAL(12,2),
    successful_value_bets DECIMAL(8,2),
    roi_on_predictions DECIMAL(5,3), -- return on investment
    user_satisfaction_score DECIMAL(5,3),
    
    -- Error Analysis
    false_positive_rate DECIMAL(5,3),
    false_negative_rate DECIMAL(5,3),
    major_errors INTEGER DEFAULT 0, -- predictions that were very wrong
    systematic_biases JSON, -- identified systematic biases
    
    -- Improvement Tracking
    accuracy_trend VARCHAR(20), -- "Improving", "Declining", "Stable"
    model_drift_detected BOOLEAN DEFAULT FALSE,
    requires_retraining BOOLEAN DEFAULT FALSE,
    next_evaluation_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sport_model (sport, model_version),
    INDEX idx_evaluation_period (evaluation_start_date, evaluation_end_date),
    INDEX idx_accuracy_metrics (overall_accuracy DESC, f1_score DESC),
    INDEX idx_business_impact (roi_on_predictions DESC, total_betting_value_identified DESC)
);

-- Create ML feature importance tracking table
CREATE TABLE IF NOT EXISTS ml_feature_importance (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    sport VARCHAR(20) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    feature_category VARCHAR(50) NOT NULL, -- "Player Stats", "Weather", "Historical", etc.
    feature_name VARCHAR(100) NOT NULL,
    
    -- Importance Metrics
    importance_score DECIMAL(6,4), -- 0.0000 to 1.0000
    importance_rank INTEGER, -- rank among all features
    importance_percentile DECIMAL(5,2), -- percentile ranking
    
    -- Feature Statistics
    feature_usage_frequency DECIMAL(5,3), -- how often feature is used
    feature_correlation_with_outcome DECIMAL(6,4), -- correlation with actual outcomes
    feature_stability DECIMAL(5,3), -- how stable the feature importance is
    
    -- Feature Context
    feature_description TEXT,
    data_source VARCHAR(100), -- where this feature comes from
    calculation_method TEXT, -- how the feature is calculated
    update_frequency VARCHAR(50), -- how often feature is updated
    
    -- Performance Impact
    accuracy_impact_when_removed DECIMAL(5,3), -- accuracy drop when feature removed
    prediction_confidence_impact DECIMAL(5,3), -- impact on prediction confidence
    
    -- Feature Quality
    data_quality_score DECIMAL(5,3), -- quality of underlying data
    missing_data_percentage DECIMAL(5,2), -- percentage of missing values
    outlier_percentage DECIMAL(5,2), -- percentage of outlier values
    
    -- Analysis Period
    analysis_start_date DATE NOT NULL,
    analysis_end_date DATE NOT NULL,
    predictions_analyzed INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_sport_model_feature (sport, model_version, feature_name),
    INDEX idx_importance_rank (importance_rank, importance_score DESC),
    INDEX idx_feature_category (feature_category, importance_score DESC),
    INDEX idx_analysis_period (analysis_start_date, analysis_end_date)
);

-- Create ML prediction feedback table for continuous learning
CREATE TABLE IF NOT EXISTS ml_prediction_feedback (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    prediction_id VARCHAR(50) NOT NULL,
    sport VARCHAR(20) NOT NULL,
    
    -- Feedback Source
    feedback_source VARCHAR(50) NOT NULL, -- "User", "Expert", "System", "Market"
    feedback_type VARCHAR(50) NOT NULL, -- "Accuracy", "Confidence", "Feature", "Bias"
    
    -- Feedback Content
    feedback_rating DECIMAL(3,2), -- 1-10 scale
    feedback_comment TEXT,
    suggested_improvements JSON,
    identified_issues JSON,
    
    -- User Context (if from user)
    user_id VARCHAR(50),
    user_expertise_level VARCHAR(20), -- "Novice", "Intermediate", "Expert", "Professional"
    user_sport_knowledge DECIMAL(3,2), -- 1-10 scale
    
    -- Expert Context (if from expert)
    expert_credentials VARCHAR(200),
    expert_specialization VARCHAR(100),
    expert_track_record DECIMAL(5,3), -- historical accuracy of expert feedback
    
    -- Market Context (if from market)
    market_movement_correlation DECIMAL(6,4), -- correlation with market movement
    market_efficiency_indicator DECIMAL(5,3),
    
    -- Impact Assessment
    feedback_impact_score DECIMAL(5,3), -- how impactful this feedback could be
    implementation_priority VARCHAR(20), -- "High", "Medium", "Low"
    estimated_accuracy_improvement DECIMAL(5,3),
    
    -- Follow-up Actions
    action_taken BOOLEAN DEFAULT FALSE,
    action_description TEXT,
    improvement_implemented BOOLEAN DEFAULT FALSE,
    follow_up_required BOOLEAN DEFAULT FALSE,
    
    feedback_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (prediction_id) REFERENCES ml_predictions(id) ON DELETE CASCADE,
    INDEX idx_prediction_feedback (prediction_id),
    INDEX idx_sport_feedback (sport, feedback_type),
    INDEX idx_feedback_source (feedback_source, feedback_rating DESC),
    INDEX idx_impact_priority (feedback_impact_score DESC, implementation_priority)
);

-- Create trigger to update the updated_at timestamp
DELIMITER //
CREATE TRIGGER update_ml_model_performance_timestamp 
    BEFORE UPDATE ON ml_model_performance 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insert sample ML predictions for testing (optional)
INSERT INTO ml_predictions (
    id, sport, event_id, event_type, model_version, model_type,
    confidence_score, prediction_tier, event_date
) VALUES 
('ufc_001_2024', 'UFC', 'ufc_300', 'fight', 'v2.1.0', 'ensemble', 0.856, 'Primary', '2024-04-13 22:00:00'),
('mlb_001_2024', 'MLB', 'NYY_BOS_20240515', 'game', 'v1.8.2', 'neural_network', 0.732, 'Primary', '2024-05-15 19:00:00'),
('f1_001_2024', 'F1', '2024_01_bahrain', 'race', 'v3.0.1', 'random_forest', 0.689, 'Primary', '2024-03-02 18:00:00')
ON DUPLICATE KEY UPDATE
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample model performance data
INSERT INTO ml_model_performance (
    sport, model_version, model_type, evaluation_start_date, evaluation_end_date,
    total_predictions, overall_accuracy, precision_score, recall_score, f1_score
) VALUES 
('UFC', 'v2.1.0', 'ensemble', '2024-01-01', '2024-03-31', 156, 0.847, 0.832, 0.851, 0.841),
('MLB', 'v1.8.2', 'neural_network', '2024-04-01', '2024-06-30', 486, 0.758, 0.743, 0.772, 0.757),
('F1', 'v3.0.1', 'random_forest', '2024-03-01', '2024-05-31', 72, 0.694, 0.681, 0.708, 0.694)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Commit the changes
COMMIT;