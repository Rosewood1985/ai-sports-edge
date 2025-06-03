/**
 * ML Sports Edge API Service
 * Service for interacting with the ML Sports Edge API
 */

class MLSportsEdgeService {
  constructor() {
    this.baseUrl = '/api/ml-sports-edge';
  }

  /**
   * Get predictions for a specific sport and league
   * @param {string} sport - Sport code (e.g., basketball, football)
   * @param {string} league - League code (e.g., nba, nfl)
   * @returns {Promise<Object>} - Predictions data
   */
  async getPredictions(sport, league) {
    try {
      const url = `${this.baseUrl}/predictions?sport=${sport}&league=${league}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch predictions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching predictions:', error);
      throw error;
    }
  }

  /**
   * Get value bets for a specific sport and league
   * @param {string} sport - Sport code (e.g., basketball, football)
   * @param {string} league - League code (e.g., nba, nfl)
   * @returns {Promise<Object>} - Value bets data
   */
  async getValueBets(sport, league) {
    try {
      const url = `${this.baseUrl}/value_bets?sport=${sport}&league=${league}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch value bets: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching value bets:', error);
      throw error;
    }
  }

  /**
   * Get model information for a specific sport
   * @param {string} sport - Sport code (e.g., basketball, football)
   * @returns {Promise<Object>} - Model information
   */
  async getModels(sport) {
    try {
      const url = `${this.baseUrl}/models?sport=${sport}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  /**
   * Run the ML Sports Edge pipeline for a specific sport and league
   * @param {string} sport - Sport code (e.g., basketball, football)
   * @param {string} league - League code (e.g., nba, nfl)
   * @param {string} target - Target variable (e.g., home_team_winning)
   * @param {boolean} train - Whether to train new models
   * @returns {Promise<Object>} - Pipeline results
   */
  async runPipeline(sport, league, target = 'home_team_winning', train = false) {
    try {
      const url = `${this.baseUrl}/run_pipeline`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport,
          league,
          target,
          train,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to run pipeline: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error running pipeline:', error);
      throw error;
    }
  }
}

export default new MLSportsEdgeService();
