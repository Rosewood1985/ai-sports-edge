/**
 * ML Prediction Card Component
 * Displays predictions from the ML Sports Edge API
 */

import {
  faChartLine,
  faInfoCircle,
  faThumbsUp,
  faThumbsDown,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Collapse, Progress, Tooltip } from 'react-bootstrap';

import { getGamePredictionById, submitPredictionFeedback } from '../services/MLPredictionService';

// Debug logging for React Bootstrap components
console.log('[MLPredictionCard] React Bootstrap components available:', {
  Card: !!Card,
  Badge: !!Badge,
  Button: !!Button,
  Collapse: !!Collapse,
  Progress: !!Progress,
  Tooltip: !!Tooltip,
});

// Debug logging for FontAwesome
console.log('[MLPredictionCard] FontAwesome available:', {
  FontAwesomeIcon: !!FontAwesomeIcon,
  icons: {
    faChartLine: !!faChartLine,
    faInfoCircle: !!faInfoCircle,
    faThumbsUp: !!faThumbsUp,
    faThumbsDown: !!faThumbsDown,
  },
});

// Confidence level colors
const getConfidenceColor = confidence => {
  if (confidence >= 0.7) return 'success';
  if (confidence >= 0.6) return 'info';
  if (confidence >= 0.5) return 'warning';
  return 'danger';
};

// Format American odds
const formatOdds = odds => {
  if (!odds) return '';
  return odds > 0 ? `+${odds}` : odds;
};

/**
 * ML Prediction Card Component
 * @param {Object} props - Component props
 * @param {Object} props.prediction - Prediction data
 * @param {string} props.type - Prediction type (game, player, race, fight)
 * @param {boolean} props.detailed - Show detailed view
 * @param {boolean} props.interactive - Allow user interaction
 * @param {Function} props.onFeedback - Callback for feedback submission
 * @returns {JSX.Element} - Rendered component
 */
const MLPredictionCard = ({
  prediction,
  type = 'game',
  detailed = false,
  interactive = true,
  onFeedback = null,
}) => {
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [detailedPrediction, setDetailedPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Debug logging for props
  console.log('[MLPredictionCard] Initialized with props:', {
    predictionId: prediction?.id,
    type,
    detailed,
    interactive,
  });

  // Fetch detailed prediction if needed
  useEffect(() => {
    if (detailed && !detailedPrediction && prediction?.id) {
      console.log(`[MLPredictionCard] Fetching detailed prediction for ${prediction.id}`);
      setLoading(true);
      getGamePredictionById(prediction.id)
        .then(data => {
          console.log(
            `[MLPredictionCard] Received detailed prediction for ${prediction.id}:`,
            data
          );
          setDetailedPrediction(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('[MLPredictionCard] Error fetching detailed prediction:', error);
          setLoading(false);
        });
    }
  }, [detailed, detailedPrediction, prediction]);

  // Handle feedback submission
  const handleFeedback = rating => {
    if (!prediction?.id) {
      console.warn('[MLPredictionCard] Cannot submit feedback: missing prediction ID');
      return;
    }

    console.log(`[MLPredictionCard] Submitting feedback for ${prediction.id}:`, { rating });

    const feedback = {
      predictionId: prediction.id,
      predictionType: type,
      rating: rating ? 5 : 1,
      comments: rating ? 'Helpful prediction' : 'Unhelpful prediction',
    };

    // Get token from localStorage (in a real app, use a proper auth system)
    const token = localStorage.getItem('authToken');
    console.log('[MLPredictionCard] Auth token available:', !!token);

    submitPredictionFeedback(feedback, token)
      .then(() => {
        console.log('[MLPredictionCard] Feedback submitted successfully');
        setFeedbackSubmitted(true);
        if (onFeedback) onFeedback(feedback);
      })
      .catch(error => {
        console.error('[MLPredictionCard] Error submitting feedback:', error);
      });
  };

  // Render different card based on prediction type
  const renderPredictionCard = () => {
    console.log(`[MLPredictionCard] Rendering prediction card of type: ${type}`);
    switch (type) {
      case 'game':
        return renderGamePrediction();
      case 'player':
        return renderPlayerPrediction();
      case 'race':
        return renderRacePrediction();
      case 'fight':
        return renderFightPrediction();
      default:
        return renderGamePrediction();
    }
  };

  // Render game prediction
  const renderGamePrediction = () => {
    const data = detailedPrediction || prediction;
    if (!data) {
      console.warn('[MLPredictionCard] No data available for game prediction');
      return null;
    }

    console.log('[MLPredictionCard] Rendering game prediction:', {
      homeTeam: data.homeTeam?.name,
      awayTeam: data.awayTeam?.name,
      hasPredictions: !!data.predictions,
    });

    const { homeTeam, awayTeam, predictions } = data;

    return (
      <>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">{data.sport}</span>
            <Badge bg="primary">{new Date(data.date).toLocaleDateString()}</Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <div className="text-center">
              <h5>{awayTeam.name}</h5>
              <Badge bg="secondary">{awayTeam.abbreviation}</Badge>
            </div>
            <div className="text-center">
              <h6>vs</h6>
            </div>
            <div className="text-center">
              <h5>{homeTeam.name}</h5>
              <Badge bg="secondary">{homeTeam.abbreviation}</Badge>
            </div>
          </div>

          {predictions && (
            <div className="prediction-details">
              {predictions.spread && (
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>Spread</span>
                    <Badge bg={getConfidenceColor(predictions.spread.confidence)}>
                      {predictions.spread.pick === 'home' ? homeTeam.name : awayTeam.name}{' '}
                      {predictions.spread.line}
                    </Badge>
                  </div>
                  <Progress
                    now={predictions.spread.confidence * 100}
                    variant={getConfidenceColor(predictions.spread.confidence)}
                    className="mt-1"
                  />
                </div>
              )}

              {predictions.moneyline && (
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>Moneyline</span>
                    <Badge bg={getConfidenceColor(predictions.moneyline.confidence)}>
                      {predictions.moneyline.pick === 'home' ? homeTeam.name : awayTeam.name}{' '}
                      {formatOdds(predictions.moneyline.odds?.home)}
                    </Badge>
                  </div>
                  <Progress
                    now={predictions.moneyline.confidence * 100}
                    variant={getConfidenceColor(predictions.moneyline.confidence)}
                    className="mt-1"
                  />
                </div>
              )}

              {predictions.total && (
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>Total</span>
                    <Badge bg={getConfidenceColor(predictions.total.confidence)}>
                      {predictions.total.pick.toUpperCase()} {predictions.total.line}
                    </Badge>
                  </div>
                  <Progress
                    now={predictions.total.confidence * 100}
                    variant={getConfidenceColor(predictions.total.confidence)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {detailed && data.analysis && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="mt-3 w-100"
              onClick={() => {
                console.log('[MLPredictionCard] Toggling expanded details:', !expandedDetails);
                setExpandedDetails(!expandedDetails);
              }}
            >
              {expandedDetails ? 'Hide Analysis' : 'Show Analysis'}
            </Button>
          )}
        </Card.Body>

        {detailed && data.analysis && (
          <Collapse in={expandedDetails}>
            <div>
              <Card.Footer>
                <h6>Analysis</h6>
                <p className="text-muted">{data.analysis.confidence.explanation}</p>

                <h6>Key Factors</h6>
                <ul className="small">
                  {data.analysis.keyFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>

                <h6>Trends</h6>
                <ul className="small">
                  {data.analysis.trends.map((trend, index) => (
                    <li key={index}>{trend}</li>
                  ))}
                </ul>
              </Card.Footer>
            </div>
          </Collapse>
        )}
      </>
    );
  };

  // Render player prediction
  const renderPlayerPrediction = () => {
    const data = detailedPrediction || prediction;
    if (!data) {
      console.warn('[MLPredictionCard] No data available for player prediction');
      return null;
    }

    console.log('[MLPredictionCard] Rendering player prediction:', {
      playerName: data.name,
      team: data.team,
      hasPredictions: !!data.predictions,
    });

    return (
      <>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">Player Prediction</span>
            <Badge bg="primary">{new Date(data.game.date).toLocaleDateString()}</Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-3">
            <h5>{data.name}</h5>
            <Badge bg="secondary">{data.team}</Badge>
            <div className="text-muted mt-1">vs {data.game.opponent}</div>
          </div>

          {data.predictions && (
            <div className="prediction-details">
              {Object.entries(data.predictions).map(([stat, prediction]) => (
                <div className="mb-2" key={stat}>
                  <div className="d-flex justify-content-between">
                    <span>{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                    <Badge bg={getConfidenceColor(prediction.confidence)}>
                      {prediction.prediction} ({prediction.range[0]}-{prediction.range[1]})
                    </Badge>
                  </div>
                  <Progress
                    now={prediction.confidence * 100}
                    variant={getConfidenceColor(prediction.confidence)}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          )}

          {data.propBets && data.propBets.length > 0 && (
            <>
              <h6 className="mt-3">Prop Bets</h6>
              {data.propBets.map((prop, index) => (
                <div className="mb-2" key={index}>
                  <div className="d-flex justify-content-between">
                    <span>
                      {prop.type} {prop.line}
                    </span>
                    <Badge bg={getConfidenceColor(prop.confidence)}>{prop.recommendation}</Badge>
                  </div>
                  <Progress
                    now={prop.confidence * 100}
                    variant={getConfidenceColor(prop.confidence)}
                    className="mt-1"
                  />
                </div>
              ))}
            </>
          )}

          {detailed && data.analysis && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="mt-3 w-100"
              onClick={() => {
                console.log('[MLPredictionCard] Toggling expanded details:', !expandedDetails);
                setExpandedDetails(!expandedDetails);
              }}
            >
              {expandedDetails ? 'Hide Analysis' : 'Show Analysis'}
            </Button>
          )}
        </Card.Body>

        {detailed && data.analysis && (
          <Collapse in={expandedDetails}>
            <div>
              <Card.Footer>
                <h6>Key Factors</h6>
                <ul className="small">
                  {data.analysis.keyFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>

                <h6>Trends</h6>
                <ul className="small">
                  {data.analysis.trends.map((trend, index) => (
                    <li key={index}>{trend}</li>
                  ))}
                </ul>
              </Card.Footer>
            </div>
          </Collapse>
        )}
      </>
    );
  };

  // Render race prediction (Formula 1)
  const renderRacePrediction = () => {
    const data = detailedPrediction || prediction;
    if (!data) {
      console.warn('[MLPredictionCard] No data available for race prediction');
      return null;
    }

    console.log('[MLPredictionCard] Rendering race prediction:', {
      raceName: data.raceName,
      trackName: data.trackName,
      hasPredictions: !!data.predictions,
    });

    return (
      <>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">Formula 1</span>
            <Badge bg="primary">{new Date(data.date).toLocaleDateString()}</Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-3">
            <h5>{data.raceName}</h5>
            <div className="text-muted">{data.trackName}</div>
            <div className="text-muted small">{data.location}</div>
          </div>

          {data.predictions?.winner?.drivers && (
            <div className="prediction-details">
              <h6>Winner Prediction</h6>
              {data.predictions.winner.drivers.slice(0, 3).map((driver, index) => (
                <div className="mb-2" key={index}>
                  <div className="d-flex justify-content-between">
                    <span>{driver.name}</span>
                    <Badge bg={getConfidenceColor(driver.confidence)}>
                      {formatOdds(driver.odds)}
                    </Badge>
                  </div>
                  <Progress
                    now={driver.confidence * 100}
                    variant={getConfidenceColor(driver.confidence)}
                    className="mt-1"
                  />
                  <div className="text-muted small">{driver.analysis}</div>
                </div>
              ))}
            </div>
          )}

          {data.predictions?.podium && (
            <div className="mt-3">
              <h6>Podium Prediction</h6>
              <div className="d-flex justify-content-between">
                <span>Podium</span>
                <Badge bg={getConfidenceColor(data.predictions.podium.confidence)}>
                  {data.predictions.podium.confidence * 100}% Confidence
                </Badge>
              </div>
              <ul className="small mt-2">
                {data.predictions.podium.drivers.map((driver, index) => (
                  <li key={index}>
                    {index + 1}. {driver}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card.Body>
      </>
    );
  };

  // Render fight prediction (UFC)
  const renderFightPrediction = () => {
    const data = detailedPrediction || prediction;
    if (!data) {
      console.warn('[MLPredictionCard] No data available for fight prediction');
      return null;
    }

    console.log('[MLPredictionCard] Rendering fight prediction:', {
      eventName: data.eventName,
      fighter1: data.fighter1?.name,
      fighter2: data.fighter2?.name,
      hasPredictions: !!data.predictions,
    });

    return (
      <>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">UFC</span>
            <Badge bg="primary">{new Date(data.date).toLocaleDateString()}</Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-3">
            <h5>{data.eventName}</h5>
            <Badge bg="secondary">{data.weightClass}</Badge>
            {data.isMainEvent && (
              <Badge bg="danger" className="ms-2">
                Main Event
              </Badge>
            )}
          </div>

          <div className="d-flex justify-content-between mb-3">
            <div className="text-center">
              <h5>{data.fighter1.name}</h5>
              <div className="text-muted small">{data.fighter1.record}</div>
            </div>
            <div className="text-center">
              <h6>vs</h6>
            </div>
            <div className="text-center">
              <h5>{data.fighter2.name}</h5>
              <div className="text-muted small">{data.fighter2.record}</div>
            </div>
          </div>

          {data.predictions && (
            <div className="prediction-details">
              {data.predictions.winner && (
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>Winner</span>
                    <Badge bg={getConfidenceColor(data.predictions.winner.confidence)}>
                      {data.predictions.winner.pick} {formatOdds(data.predictions.winner.odds)}
                    </Badge>
                  </div>
                  <Progress
                    now={data.predictions.winner.confidence * 100}
                    variant={getConfidenceColor(data.predictions.winner.confidence)}
                    className="mt-1"
                  />
                  <div className="text-muted small">{data.predictions.winner.analysis}</div>
                </div>
              )}

              {data.predictions.method && (
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>Method</span>
                    <Badge bg={getConfidenceColor(data.predictions.method.confidence)}>
                      {data.predictions.method.pick}
                    </Badge>
                  </div>
                  <Progress
                    now={data.predictions.method.confidence * 100}
                    variant={getConfidenceColor(data.predictions.method.confidence)}
                    className="mt-1"
                  />
                  <div className="text-muted small">{data.predictions.method.analysis}</div>
                </div>
              )}

              {data.predictions.round && (
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>Round</span>
                    <Badge bg={getConfidenceColor(data.predictions.round.confidence)}>
                      {data.predictions.round.pick}
                    </Badge>
                  </div>
                  <Progress
                    now={data.predictions.round.confidence * 100}
                    variant={getConfidenceColor(data.predictions.round.confidence)}
                    className="mt-1"
                  />
                  <div className="text-muted small">{data.predictions.round.analysis}</div>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </>
    );
  };

  return (
    <Card className="ml-prediction-card mb-3">
      {renderPredictionCard()}

      {interactive && !feedbackSubmitted && (
        <Card.Footer className="d-flex justify-content-between">
          <Tooltip title="Was this prediction helpful?">
            <div>
              <Button
                variant="outline-success"
                size="sm"
                className="me-2"
                onClick={() => handleFeedback(true)}
              >
                <FontAwesomeIcon icon={faThumbsUp} />
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => handleFeedback(false)}>
                <FontAwesomeIcon icon={faThumbsDown} />
              </Button>
            </div>
          </Tooltip>
          <div>
            <FontAwesomeIcon icon={faChartLine} className="text-primary me-2" />
            <FontAwesomeIcon icon={faInfoCircle} className="text-info" />
          </div>
        </Card.Footer>
      )}

      {interactive && feedbackSubmitted && (
        <Card.Footer className="text-center text-muted">Thanks for your feedback!</Card.Footer>
      )}
    </Card>
  );
};

export default MLPredictionCard;
