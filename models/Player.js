/**
 * Player model for AI Sports Edge
 * Represents a sports player with their details
 */

export default class Player {
  /**
   * Create a new Player instance
   * @param {string} id - Unique identifier for the player
   * @param {string} name - Full name of the player
   * @param {string} teamId - ID of the team the player belongs to
   * @param {string} position - Player's position (e.g., 'PG', 'QB')
   * @param {string} sport - Sport the player plays (e.g., 'NBA', 'NFL')
   * @param {string} image - URL to the player's image
   * @param {Object} [stats] - Player statistics
   * @param {Object} [metadata] - Additional metadata about the player
   */
  constructor(id, name, teamId, position, sport, image, stats = {}, metadata = {}) {
    this.id = id;
    this.name = name;
    this.teamId = teamId;
    this.position = position;
    this.sport = sport;
    this.image = image;
    this.stats = stats;
    this.metadata = metadata;
  }
  
  /**
   * Create a Player instance from API data
   * @param {Object} apiPlayer - Player data from API
   * @returns {Player} New Player instance
   */
  static fromAPI(apiPlayer) {
    return new Player(
      apiPlayer.id,
      apiPlayer.name,
      apiPlayer.team_id || apiPlayer.teamId,
      apiPlayer.position,
      apiPlayer.sport,
      apiPlayer.image,
      apiPlayer.stats || {},
      apiPlayer.metadata || {}
    );
  }
  
  /**
   * Get the player's display name
   * @returns {string} Display name (e.g., "LeBron James (SF)")
   */
  getDisplayName() {
    return `${this.name} (${this.position})`;
  }
  
  /**
   * Get the player's full display name with sport
   * @returns {string} Full display name (e.g., "LeBron James (SF, NBA)")
   */
  getFullDisplayName() {
    return `${this.name} (${this.position}, ${this.sport})`;
  }
  
  /**
   * Get the player's first name
   * @returns {string} First name
   */
  getFirstName() {
    return this.name.split(' ')[0];
  }
  
  /**
   * Get the player's last name
   * @returns {string} Last name
   */
  getLastName() {
    const parts = this.name.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }
  
  /**
   * Get a specific player statistic
   * @param {string} statName - Name of the statistic
   * @param {*} defaultValue - Default value if statistic is not found
   * @returns {*} Statistic value or default value
   */
  getStat(statName, defaultValue = null) {
    return this.stats[statName] !== undefined ? this.stats[statName] : defaultValue;
  }
  
  /**
   * Check if player has a specific statistic
   * @param {string} statName - Name of the statistic
   * @returns {boolean} Whether the player has the statistic
   */
  hasStat(statName) {
    return this.stats[statName] !== undefined;
  }
  
  /**
   * Convert to JSON object
   * @returns {Object} JSON representation of the player
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      teamId: this.teamId,
      position: this.position,
      sport: this.sport,
      image: this.image,
      stats: this.stats,
      metadata: this.metadata
    };
  }
  
  /**
   * Create a Player instance from JSON
   * @param {Object} json - JSON representation of a player
   * @returns {Player} New Player instance
   */
  static fromJSON(json) {
    return new Player(
      json.id,
      json.name,
      json.teamId,
      json.position,
      json.sport,
      json.image,
      json.stats,
      json.metadata
    );
  }
}