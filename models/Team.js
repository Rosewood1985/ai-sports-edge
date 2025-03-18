/**
 * Team model for AI Sports Edge
 * Represents a sports team with its details
 */

export default class Team {
  /**
   * Create a new Team instance
   * @param {string} id - Unique identifier for the team
   * @param {string} name - Full name of the team
   * @param {string} league - League the team belongs to (e.g., 'NBA', 'NFL')
   * @param {string} abbreviation - Team abbreviation (e.g., 'LAL', 'DAL')
   * @param {string} logo - URL to the team's logo image
   * @param {Object} [metadata] - Additional metadata about the team
   */
  constructor(id, name, league, abbreviation, logo, metadata = {}) {
    this.id = id;
    this.name = name;
    this.league = league;
    this.abbreviation = abbreviation;
    this.logo = logo;
    this.metadata = metadata;
  }
  
  /**
   * Create a Team instance from API data
   * @param {Object} apiTeam - Team data from API
   * @returns {Team} New Team instance
   */
  static fromAPI(apiTeam) {
    return new Team(
      apiTeam.id,
      apiTeam.name,
      apiTeam.league,
      apiTeam.abbreviation,
      apiTeam.logo,
      apiTeam.metadata || {}
    );
  }
  
  /**
   * Get the team's display name
   * @returns {string} Display name (e.g., "Los Angeles Lakers (NBA)")
   */
  getDisplayName() {
    return `${this.name} (${this.league})`;
  }
  
  /**
   * Get the team's short name
   * @returns {string} Short name (e.g., "Lakers")
   */
  getShortName() {
    // Try to extract the team name without city
    const parts = this.name.split(' ');
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    return this.name;
  }
  
  /**
   * Get the team's city
   * @returns {string} City name (e.g., "Los Angeles")
   */
  getCity() {
    // Try to extract the city name
    const parts = this.name.split(' ');
    if (parts.length > 1) {
      return parts.slice(0, -1).join(' ');
    }
    return '';
  }
  
  /**
   * Convert to JSON object
   * @returns {Object} JSON representation of the team
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      league: this.league,
      abbreviation: this.abbreviation,
      logo: this.logo,
      metadata: this.metadata
    };
  }
  
  /**
   * Create a Team instance from JSON
   * @param {Object} json - JSON representation of a team
   * @returns {Team} New Team instance
   */
  static fromJSON(json) {
    return new Team(
      json.id,
      json.name,
      json.league,
      json.abbreviation,
      json.logo,
      json.metadata
    );
  }
}