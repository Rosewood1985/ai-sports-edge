// =============================================================================
// 3. INTELLIGENT BET SLIP PARSER
// =============================================================================

class IntelligentBetSlipParser {
  constructor() {
    this.sportsbookPatterns = this.initializeSportsbookPatterns();
    this.sportPatterns = this.initializeSportPatterns();
    this.betTypePatterns = this.initializeBetTypePatterns();
  }

  initializeSportsbookPatterns() {
    return {
      draftkings: {
        name: 'DraftKings',
        identifiers: [/draftkings/i, /dk sportsbook/i, /dksb/i, /draft kings/i],
        oddsFormat: 'american',
        fieldPatterns: {
          odds: /([+-]\d{2,4})\s*(?:odds|line)?/gi,
          stake: /\$(\d+\.?\d*)\s*(?:bet|wager|stake)?/gi,
          event: /([A-Z\s]+)\s+(?:@|vs\.?|v\.?)\s+([A-Z\s]+)/gi,
          betType: /(moneyline|spread|total|over|under|prop)/gi,
          date: /(\d{1,2}\/\d{1,2}\/\d{2,4}|\w{3}\s+\d{1,2})/gi,
        },
        layout: {
          typical_structure: 'header -> event -> bet_type -> odds -> stake',
          text_direction: 'top_to_bottom',
        },
      },
      fanduel: {
        name: 'FanDuel',
        identifiers: [/fanduel/i, /fan duel/i, /fd sportsbook/i],
        oddsFormat: 'american',
        fieldPatterns: {
          odds: /([+-]\d{2,4})/gi,
          stake: /\$(\d+\.?\d*)/gi,
          event: /([A-Z\s]+)\s+vs\.?\s+([A-Z\s]+)/gi,
          betType: /(moneyline|point spread|total points|over|under)/gi,
        },
        layout: {
          typical_structure: 'event -> bet_selection -> odds -> stake',
          text_direction: 'top_to_bottom',
        },
      },
      betmgm: {
        name: 'BetMGM',
        identifiers: [/betmgm/i, /bet mgm/i, /mgm sportsbook/i],
        oddsFormat: 'american',
        fieldPatterns: {
          odds: /([+-]\d{2,4})/gi,
          stake: /\$(\d+\.?\d*)/gi,
          event: /([A-Z\s]+)\s+(?:@|vs\.?)\s+([A-Z\s]+)/gi,
        },
      },
      caesars: {
        name: 'Caesars',
        identifiers: [/caesars/i, /caesar/i, /czr/i],
        oddsFormat: 'american',
        fieldPatterns: {
          odds: /([+-]\d{2,4})/gi,
          stake: /\$(\d+\.?\d*)/gi,
          event: /([A-Z\s]+)\s+(?:@|vs\.?)\s+([A-Z\s]+)/gi,
        },
      },
    };
  }

  initializeSportPatterns() {
    return {
      nfl: {
        identifiers: [/nfl/i, /football/i, /patriots/i, /cowboys/i, /chiefs/i],
        teamPatterns: [
          /bills|dolphins|patriots|jets|ravens|bengals|browns|steelers|titans|colts|texans|jaguars|chiefs|raiders|chargers|broncos|cowboys|giants|eagles|commanders|packers|lions|bears|vikings|falcons|panthers|saints|buccaneers|cardinals|rams|49ers|seahawks/i,
        ],
        eventPattern: /([A-Z\s]+)\s+(?:@|vs\.?)\s+([A-Z\s]+)/i,
        commonBets: ['moneyline', 'spread', 'total', 'props'],
      },
      nba: {
        identifiers: [/nba/i, /basketball/i, /lakers/i, /warriors/i, /celtics/i],
        teamPatterns: [
          /celtics|nets|knicks|76ers|raptors|bulls|cavaliers|pistons|pacers|bucks|hawks|hornets|heat|magic|wizards|nuggets|timberwolves|thunder|blazers|jazz|warriors|clippers|lakers|suns|kings|mavericks|rockets|grizzlies|pelicans|spurs/i,
        ],
        eventPattern: /([A-Z\s]+)\s+(?:@|vs\.?)\s+([A-Z\s]+)/i,
        commonBets: ['moneyline', 'spread', 'total', 'props'],
      },
      // Add more sports...
    };
  }

  initializeBetTypePatterns() {
    return {
      moneyline: {
        patterns: [/moneyline/i, /ml/i, /to win/i, /winner/i],
        expectedOdds: /[+-]\d{2,4}/,
      },
      spread: {
        patterns: [/spread/i, /point spread/i, /line/i, /[+-]\d+\.?5?/],
        expectedOdds: /[+-]\d{2,4}/,
      },
      total: {
        patterns: [/total/i, /over|under/i, /o\/u/i, /points/i],
        expectedOdds: /[+-]\d{2,4}/,
      },
      props: {
        patterns: [/prop/i, /player/i, /anytime/i, /first|last/i],
        expectedOdds: /[+-]\d{2,4}/,
      },
    };
  }

  async parseExtractedText(ocrResult, options = {}) {
    const {
      useContextualAnalysis = true,
      validateConsistency = true,
      enhanceWithMLModel = false,
    } = options;

    try {
      console.log('Starting intelligent bet slip parsing');

      const { fullText, textBlocks, confidence } = ocrResult;

      // Step 1: Detect sportsbook
      const detectedSportsbook = this.detectSportsbook(fullText);

      // Step 2: Detect sport
      const detectedSport = this.detectSport(fullText, textBlocks);

      // Step 3: Extract structured data
      const extractedData = await this.extractStructuredData(
        fullText,
        textBlocks,
        detectedSportsbook,
        detectedSport
      );

      // Step 4: Contextual analysis for better accuracy
      if (useContextualAnalysis) {
        extractedData.contextualAnalysis = await this.performContextualAnalysis(
          extractedData,
          textBlocks
        );
      }

      // Step 5: Validate consistency
      if (validateConsistency) {
        extractedData.validationResults = await this.validateConsistency(extractedData);
      }

      // Step 6: Calculate final confidence score
      extractedData.finalConfidence = this.calculateFinalConfidence(
        confidence,
        extractedData,
        ocrResult.providerCount || 1
      );

      console.log(`Parsing completed with confidence: ${extractedData.finalConfidence}`);

      return extractedData;
    } catch (error) {
      console.error('Intelligent parsing failed:', error);
      throw error;
    }
  }

  detectSportsbook(text) {
    for (const [key, config] of Object.entries(this.sportsbookPatterns)) {
      for (const pattern of config.identifiers) {
        if (pattern.test(text)) {
          return {
            id: key,
            name: config.name,
            confidence: 0.9,
            matchedPattern: pattern.source,
          };
        }
      }
    }

    return {
      id: 'generic',
      name: 'Unknown',
      confidence: 0.3,
    };
  }

  detectSport(text, textBlocks) {
    let bestMatch = null;
    let highestScore = 0;

    for (const [sport, config] of Object.entries(this.sportPatterns)) {
      let score = 0;

      // Check for sport identifiers
      for (const identifier of config.identifiers) {
        if (identifier.test(text)) {
          score += 0.3;
        }
      }

      // Check for team patterns
      for (const teamPattern of config.teamPatterns) {
        const matches = text.match(teamPattern);
        if (matches) {
          score += matches.length * 0.2;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          id: sport,
          name: sport.toUpperCase(),
          confidence: Math.min(score, 0.95),
          indicators: [],
        };
      }
    }

    return (
      bestMatch || {
        id: 'unknown',
        name: 'Unknown',
        confidence: 0.1,
      }
    );
  }

  async extractStructuredData(fullText, textBlocks, sportsbook, sport) {
    const lines = fullText.split('\n').filter(line => line.trim());
    const config = this.sportsbookPatterns[sportsbook.id] || this.sportsbookPatterns.generic;

    const extractedData = {
      sportsbook: sportsbook.id,
      sport: sport.id,
      legs: [],
      metadata: {
        sportsbook,
        sport,
        totalLines: lines.length,
        processingMethod: 'intelligent_parser',
      },
    };

    // Extract individual bet legs
    const legs = await this.extractBetLegs(lines, config, sport);
    extractedData.legs = legs;

    // Extract bet slip metadata
    extractedData.betSlipInfo = await this.extractBetSlipInfo(lines, config);

    return extractedData;
  }

  async extractBetLegs(lines, config, sport) {
    const legs = [];
    let currentLeg = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Try to extract event/matchup
      const eventMatch = this.extractEvent(line, config, sport);
      if (eventMatch) {
        // Save previous leg if exists
        if (currentLeg && this.isValidLeg(currentLeg)) {
          legs.push(currentLeg);
        }

        currentLeg = {
          eventName: eventMatch.eventName,
          teams: eventMatch.teams,
          sport: sport.id,
          league: this.detectLeague(line, sport),
        };
      }

      // Try to extract bet type and selection
      const betTypeMatch = this.extractBetType(line, config);
      if (betTypeMatch && currentLeg) {
        currentLeg.betType = betTypeMatch.betType;
        currentLeg.selection = betTypeMatch.selection;
      }

      // Try to extract odds
      const oddsMatch = this.extractOdds(line, config);
      if (oddsMatch && currentLeg) {
        currentLeg.odds = oddsMatch.odds;
        currentLeg.oddsFormat = oddsMatch.format;
      }

      // Try to extract stake
      const stakeMatch = this.extractStake(line, config);
      if (stakeMatch && currentLeg) {
        currentLeg.stake = stakeMatch.amount;
      }
    }

    // Add the last leg
    if (currentLeg && this.isValidLeg(currentLeg)) {
      legs.push(currentLeg);
    }

    return legs;
  }

  extractEvent(line, config, sport) {
    const eventPattern = config.fieldPatterns?.event || sport.eventPattern;
    if (!eventPattern) return null;

    const match = line.match(eventPattern);
    if (match) {
      return {
        eventName: match[0],
        teams: match.length > 2 ? [match[1].trim(), match[2].trim()] : [],
      };
    }

    return null;
  }

  extractBetType(line, config) {
    for (const [betType, betConfig] of Object.entries(this.betTypePatterns)) {
      for (const pattern of betConfig.patterns) {
        if (pattern.test(line)) {
          return {
            betType,
            selection: line.trim(),
            confidence: 0.8,
          };
        }
      }
    }

    return null;
  }

  extractOdds(line, config) {
    const oddsPattern = config.fieldPatterns?.odds || /([+-]\d{2,4})/;
    const match = line.match(oddsPattern);

    if (match) {
      return {
        odds: match[1],
        format: config.oddsFormat || 'american',
        confidence: 0.9,
      };
    }

    return null;
  }

  extractStake(line, config) {
    const stakePattern = config.fieldPatterns?.stake || /\$(\d+\.?\d*)/;
    const match = line.match(stakePattern);

    if (match) {
      return {
        amount: parseFloat(match[1]),
        currency: 'USD',
        confidence: 0.9,
      };
    }

    return null;
  }

  detectLeague(line, sport) {
    // Simple league detection based on context
    const leaguePatterns = {
      nfl: /nfl|football/i,
      nba: /nba|basketball/i,
      mlb: /mlb|baseball/i,
      nhl: /nhl|hockey/i,
    };

    const pattern = leaguePatterns[sport.id];
    if (pattern && pattern.test(line)) {
      return sport.id.toUpperCase();
    }

    return 'unknown';
  }

  isValidLeg(leg) {
    return leg.eventName && (leg.odds || leg.stake);
  }

  async performContextualAnalysis(extractedData, textBlocks) {
    // Analyze spatial relationships between text blocks
    const spatialAnalysis = this.analyzeSpatialRelationships(textBlocks);

    // Validate logical consistency
    const logicalConsistency = this.checkLogicalConsistency(extractedData);

    // Cross-reference with known patterns
    const patternMatching = this.crossReferencePatterns(extractedData);

    return {
      spatialAnalysis,
      logicalConsistency,
      patternMatching,
    };
  }

  analyzeSpatialRelationships(textBlocks) {
    // Analyze the spatial layout of text blocks to improve accuracy
    const relationships = [];

    for (let i = 0; i < textBlocks.length; i++) {
      for (let j = i + 1; j < textBlocks.length; j++) {
        const block1 = textBlocks[i];
        const block2 = textBlocks[j];

        const relationship = this.calculateSpatialRelationship(block1, block2);
        relationships.push({
          block1Index: i,
          block2Index: j,
          relationship,
        });
      }
    }

    return relationships;
  }

  calculateSpatialRelationship(block1, block2) {
    if (!block1.boundingBox || !block2.boundingBox) {
      return 'unknown';
    }

    const box1 = this.getBoundingBoxCenter(block1.boundingBox);
    const box2 = this.getBoundingBoxCenter(block2.boundingBox);

    const dx = box2.x - box1.x;
    const dy = box2.y - box1.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'below' : 'above';
    }
  }

  getBoundingBoxCenter(boundingBox) {
    const x = boundingBox.reduce((sum, point) => sum + point.x, 0) / boundingBox.length;
    const y = boundingBox.reduce((sum, point) => sum + point.y, 0) / boundingBox.length;
    return { x, y };
  }

  checkLogicalConsistency(extractedData) {
    const issues = [];

    // Check if odds format matches sportsbook
    const sportsbook = this.sportsbookPatterns[extractedData.sportsbook];
    if (sportsbook) {
      for (const leg of extractedData.legs) {
        if (leg.oddsFormat && leg.oddsFormat !== sportsbook.oddsFormat) {
          issues.push({
            type: 'odds_format_mismatch',
            leg,
            expected: sportsbook.oddsFormat,
            actual: leg.oddsFormat,
          });
        }
      }
    }

    // Check for reasonable odds values
    for (const leg of extractedData.legs) {
      if (leg.odds) {
        const oddsValue = parseInt(leg.odds.replace(/[^-+\d]/g, ''));
        if (Math.abs(oddsValue) > 5000 || Math.abs(oddsValue) < 100) {
          issues.push({
            type: 'unreasonable_odds',
            leg,
            value: oddsValue,
          });
        }
      }
    }

    return {
      issues,
      consistencyScore: Math.max(0, 1 - issues.length * 0.1),
    };
  }

  crossReferencePatterns(extractedData) {
    const matchingPatterns = [];

    // Check against known sportsbook patterns
    const sportsbook = this.sportsbookPatterns[extractedData.sportsbook];
    if (sportsbook) {
      matchingPatterns.push({
        type: 'sportsbook_pattern',
        pattern: sportsbook.name,
        confidence: 0.9,
      });
    }

    // Check against sport patterns
    const sport = this.sportPatterns[extractedData.sport];
    if (sport) {
      matchingPatterns.push({
        type: 'sport_pattern',
        pattern: sport.name,
        confidence: 0.8,
      });
    }

    return matchingPatterns;
  }

  calculateFinalConfidence(ocrConfidence, extractedData, providerCount) {
    let confidence = ocrConfidence;

    // Boost confidence for multi-provider consensus
    if (providerCount > 1) {
      confidence += 0.1;
    }

    // Adjust based on sportsbook detection
    if (extractedData.metadata?.sportsbook?.confidence) {
      confidence = (confidence + extractedData.metadata.sportsbook.confidence) / 2;
    }

    // Adjust based on validation results
    if (extractedData.validationResults?.consistencyScore) {
      confidence = (confidence + extractedData.validationResults.consistencyScore) / 2;
    }

    // Penalize for missing critical data
    const criticalFields = ['sportsbook', 'legs'];
    for (const field of criticalFields) {
      if (
        !extractedData[field] ||
        (Array.isArray(extractedData[field]) && extractedData[field].length === 0)
      ) {
        confidence -= 0.2;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }

  async validateConsistency(extractedData) {
    const validationResults = {
      issues: [],
      warnings: [],
      score: 1.0,
    };

    // Validate required fields
    if (!extractedData.sportsbook || extractedData.sportsbook === 'generic') {
      validationResults.issues.push('Could not detect sportsbook');
      validationResults.score -= 0.2;
    }

    if (!extractedData.legs || extractedData.legs.length === 0) {
      validationResults.issues.push('No bet legs detected');
      validationResults.score -= 0.3;
    }

    // Validate each leg
    for (const [index, leg] of extractedData.legs.entries()) {
      if (!leg.eventName) {
        validationResults.warnings.push(`Leg ${index + 1}: Missing event name`);
        validationResults.score -= 0.1;
      }

      if (!leg.odds) {
        validationResults.warnings.push(`Leg ${index + 1}: Missing odds`);
        validationResults.score -= 0.1;
      }

      if (!leg.stake) {
        validationResults.warnings.push(`Leg ${index + 1}: Missing stake`);
        validationResults.score -= 0.05;
      }
    }

    validationResults.score = Math.max(0, validationResults.score);

    return validationResults;
  }

  // This method is not in the original code but is referenced
  async extractBetSlipInfo(lines, config) {
    // Extract bet slip metadata like date, total stake, potential payout, etc.
    const betSlipInfo = {
      date: null,
      totalStake: 0,
      potentialPayout: 0,
    };

    // Simple implementation for now
    return betSlipInfo;
  }
}

module.exports = IntelligentBetSlipParser;
