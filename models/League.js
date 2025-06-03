/**
 * League model for AI Sports Edge
 * Represents a sports league with its details
 */

export default class League {
  /**
   * Create a new League instance
   * @param {string} id - Unique identifier for the league
   * @param {string} name - Full name of the league
   * @param {string} sport - Sport type (e.g., 'basketball', 'football')
   * @param {string} abbreviation - League abbreviation (e.g., 'NBA', 'NFL')
   * @param {string} logo - URL to the league's logo image
   * @param {string} country - Country where the league operates
   * @param {Object} [metadata] - Additional metadata about the league
   */
  constructor(id, name, sport, abbreviation, logo, country = 'USA', metadata = {}) {
    this.id = id;
    this.name = name;
    this.sport = sport;
    this.abbreviation = abbreviation;
    this.logo = logo;
    this.country = country;
    this.metadata = metadata;
  }

  /**
   * Create a League instance from API data
   * @param {Object} apiLeague - League data from API
   * @returns {League} New League instance
   */
  static fromAPI(apiLeague) {
    return new League(
      apiLeague.id,
      apiLeague.name,
      apiLeague.sport,
      apiLeague.abbreviation,
      apiLeague.logo,
      apiLeague.country || 'USA',
      apiLeague.metadata || {}
    );
  }

  /**
   * Get the league's display name
   * @returns {string} Display name (e.g., "National Basketball Association (NBA)")
   */
  getDisplayName() {
    return `${this.name} (${this.abbreviation})`;
  }

  /**
   * Get the league's full display name with sport
   * @returns {string} Full display name (e.g., "National Basketball Association (NBA, Basketball)")
   */
  getFullDisplayName() {
    return `${this.name} (${this.abbreviation}, ${this.sport})`;
  }

  /**
   * Check if the league is international
   * @returns {boolean} Whether the league is international
   */
  isInternational() {
    return this.country !== 'USA';
  }

  /**
   * Get league season information
   * @returns {Object|null} Season information if available
   */
  getSeasonInfo() {
    return this.metadata.season || null;
  }

  /**
   * Check if the league is currently in season
   * @returns {boolean} Whether the league is in season
   */
  isInSeason() {
    const seasonInfo = this.getSeasonInfo();
    if (!seasonInfo || !seasonInfo.startDate || !seasonInfo.endDate) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(seasonInfo.startDate);
    const endDate = new Date(seasonInfo.endDate);

    return now >= startDate && now <= endDate;
  }

  /**
   * Convert to JSON object
   * @returns {Object} JSON representation of the league
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sport: this.sport,
      abbreviation: this.abbreviation,
      logo: this.logo,
      country: this.country,
      metadata: this.metadata,
    };
  }

  /**
   * Create a League instance from JSON
   * @param {Object} json - JSON representation of a league
   * @returns {League} New League instance
   */
  static fromJSON(json) {
    return new League(
      json.id,
      json.name,
      json.sport,
      json.abbreviation,
      json.logo,
      json.country,
      json.metadata
    );
  }
}
