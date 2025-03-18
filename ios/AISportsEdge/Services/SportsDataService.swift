import Foundation
import Combine

/**
 * SportsDataService
 * 
 * A service for fetching and processing sports data for:
 * - NBA, MLB, NHL (existing)
 * - WNBA (new)
 * - NCAA Men's and Women's Basketball (new)
 * - Formula 1 (new)
 *
 * Integrates with FanDuel for betting odds
 */

// MARK: - Configuration
struct SportsConfig {
    // API endpoints
    struct APIEndpoints {
        static let NBA = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
        static let WNBA = "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard"
        static let MLB = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"
        static let NHL = "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard"
        static let NCAA_MENS = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard"
        static let NCAA_WOMENS = "https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard"
        static let FORMULA1 = "https://site.api.espn.com/apis/site/v2/racing/f1/scoreboard"
    }
    
    // FanDuel affiliate configuration
    struct FanDuel {
        static let BASE_URL = "https://account.sportsbook.fanduel.com/join"
        static let AFFILIATE_ID = "ai-sports-edge"
        static let DEEP_LINK_BASE = "https://sportsbook.fanduel.com/navigation/"
    }
    
    // Feature flags
    struct Features {
        static let ENABLE_WNBA = true
        static let ENABLE_NCAA = true
        static let ENABLE_FORMULA1 = true
        static let ENABLE_FANDUEL_LINKS = true
        static let PREMIUM_PREDICTIONS = true
    }
    
    // Cache settings
    struct Cache {
        static let EXPIRY_MINUTES = 15
    }
}

// MARK: - Enums
enum SportType: String, CaseIterable {
    case NBA = "NBA"
    case WNBA = "WNBA"
    case MLB = "MLB"
    case NHL = "NHL"
    case NCAA_MENS = "NCAA_MENS"
    case NCAA_WOMENS = "NCAA_WOMENS"
    case FORMULA1 = "FORMULA1"
    
    var endpoint: String {
        switch self {
        case .NBA:
            return SportsConfig.APIEndpoints.NBA
        case .WNBA:
            return SportsConfig.APIEndpoints.WNBA
        case .MLB:
            return SportsConfig.APIEndpoints.MLB
        case .NHL:
            return SportsConfig.APIEndpoints.NHL
        case .NCAA_MENS:
            return SportsConfig.APIEndpoints.NCAA_MENS
        case .NCAA_WOMENS:
            return SportsConfig.APIEndpoints.NCAA_WOMENS
        case .FORMULA1:
            return SportsConfig.APIEndpoints.FORMULA1
        }
    }
    
    var displayName: String {
        switch self {
        case .NCAA_MENS:
            return "NCAA MEN"
        case .NCAA_WOMENS:
            return "NCAA WOMEN"
        case .FORMULA1:
            return "F1"
        default:
            return rawValue
        }
    }
}

enum GameStatus: String, Codable {
    case scheduled = "pre"
    case inProgress = "in"
    case final = "post"
    case postponed = "postponed"
    case canceled = "canceled"
    case unknown
}

// MARK: - Models
struct Game: Identifiable, Codable {
    let id: String
    let date: Date
    let homeTeam: String
    let awayTeam: String
    let league: String
    let status: GameStatus
    let spread: String?
    let overUnder: String?
    let fanduelLink: String?
    let isPremium: Bool
    
    // Formula 1 specific properties
    let raceName: String?
    let trackName: String?
    let location: String?
    
    // NCAA specific properties
    let tournamentRound: String?
    let isMarchMadness: Bool?
    let bracketRegion: String?
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date).uppercased()
    }
    
    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        formatter.amSymbol = "AM"
        formatter.pmSymbol = "PM"
        return formatter.string(from: date) + " ET"
    }
    
    var isTeamSport: Bool {
        return raceName == nil
    }
}

// MARK: - API Response Models
struct ESPNResponse: Codable {
    let events: [Event]?
}

struct Event: Codable {
    let id: String
    let date: String
    let name: String?
    let competitions: [Competition]?
    let status: Status?
    let circuit: Circuit?
}

struct Competition: Codable {
    let competitors: [Competitor]?
    let odds: [Odds]?
    let notes: [Note]?
}

struct Competitor: Codable {
    let homeAway: String?
    let team: Team
}

struct Team: Codable {
    let displayName: String
}

struct Odds: Codable {
    let spread: String?
    let overUnder: String?
}

struct Note: Codable {
    let type: String?
    let headline: String?
}

struct Status: Codable {
    let type: StatusType?
}

struct StatusType: Codable {
    let state: String?
}

struct Circuit: Codable {
    let fullName: String?
    let address: Address?
}

struct Address: Codable {
    let city: String?
    let country: String?
}

// MARK: - Cache
struct CacheEntry<T> {
    let data: T
    let timestamp: Date
    
    var isValid: Bool {
        let now = Date()
        let diffMinutes = Int(now.timeIntervalSince(timestamp) / 60)
        return diffMinutes < SportsConfig.Cache.EXPIRY_MINUTES
    }
}

// MARK: - SportsDataService
class SportsDataService {
    // Singleton instance
    static let shared = SportsDataService()
    
    private let jsonDecoder: JSONDecoder
    private let urlSession: URLSession
    private var cache: [SportType: CacheEntry<[Game]>] = [:]
    
    private init() {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.jsonDecoder = decoder
        self.urlSession = URLSession.shared
    }
    
    // MARK: - Public Methods
    
    /// Get active sports based on feature flags and season
    func getActiveSports() -> [SportType] {
        var sports: [SportType] = [.NBA, .MLB, .NHL]
        
        if SportsConfig.Features.ENABLE_WNBA {
            sports.append(.WNBA)
        }
        
        if SportsConfig.Features.ENABLE_NCAA {
            sports.append(contentsOf: [.NCAA_MENS, .NCAA_WOMENS])
        }
        
        if SportsConfig.Features.ENABLE_FORMULA1 {
            sports.append(.FORMULA1)
        }
        
        return sports
    }
    
    /// Fetch data for a specific sport
    func fetchSportData(for sport: SportType) -> AnyPublisher<[Game], Error> {
        // Check cache first
        if let cacheEntry = cache[sport], cacheEntry.isValid {
            print("Using cached data for \(sport.rawValue)")
            return Just(cacheEntry.data)
                .setFailureType(to: Error.self)
                .eraseToAnyPublisher()
        }
        
        // Fetch from API
        guard let url = URL(string: sport.endpoint) else {
            return Fail(error: NSError(domain: "SportsDataService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL for \(sport.rawValue)"]))
                .eraseToAnyPublisher()
        }
        
        print("Fetching \(sport.rawValue) data from API")
        
        return urlSession.dataTaskPublisher(for: url)
            .map { $0.data }
            .decode(type: ESPNResponse.self, decoder: jsonDecoder)
            .map { [weak self] response -> [Game] in
                guard let self = self else { return [] }
                
                // Process data based on sport type
                let processedData: [Game]
                if sport == .FORMULA1 {
                    processedData = self.processFormula1Data(response, sport: sport)
                } else if sport == .NCAA_MENS || sport == .NCAA_WOMENS {
                    processedData = self.processNCAAData(response, sport: sport)
                } else {
                    processedData = self.processTeamSportData(response, sport: sport)
                }
                
                // Update cache
                self.cache[sport] = CacheEntry(data: processedData, timestamp: Date())
                
                return processedData
            }
            .catch { [weak self] error -> AnyPublisher<[Game], Error> in
                print("Error fetching \(sport.rawValue) data: \(error.localizedDescription)")
                
                // Return fallback data if available
                guard let self = self else {
                    return Fail(error: error).eraseToAnyPublisher()
                }
                
                return Just(self.getFallbackData(for: sport))
                    .setFailureType(to: Error.self)
                    .eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    /// Fetch all active sports data
    func fetchAllSportsData() -> AnyPublisher<[Game], Error> {
        let activeSports = getActiveSports()
        
        let publishers = activeSports.map { fetchSportData(for: $0) }
        
        return Publishers.MergeMany(publishers)
            .collect()
            .map { results in
                // Flatten the array of arrays
                let allGames = results.flatMap { $0 }
                
                // Sort by date
                return allGames.sorted { $0.date < $1.date }
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    /// Process team sports data (NBA, WNBA, MLB, NHL, NCAA)
    private func processTeamSportData(_ response: ESPNResponse, sport: SportType) -> [Game] {
        guard let events = response.events, !events.isEmpty else {
            return []
        }
        
        return events.compactMap { event in
            guard let date = ISO8601DateFormatter().date(from: event.date),
                  let competition = event.competitions?.first else {
                return nil
            }
            
            let competitors = competition.competitors ?? []
            let homeTeam = competitors.first(where: { $0.homeAway == "home" })?.team.displayName ?? "TBD"
            let awayTeam = competitors.first(where: { $0.homeAway == "away" })?.team.displayName ?? "TBD"
            
            // Get odds if available
            let odds = competition.odds?.first
            let spread = odds?.spread
            let overUnder = odds?.overUnder
            
            let status = event.status?.type?.state ?? "pre"
            
            return Game(
                id: event.id,
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                league: sport.rawValue,
                status: GameStatus(rawValue: status) ?? .unknown,
                spread: spread,
                overUnder: overUnder,
                fanduelLink: SportsConfig.Features.ENABLE_FANDUEL_LINKS ? 
                    generateFanduelLink(sport: sport, gameId: event.id, homeTeam: homeTeam, awayTeam: awayTeam) : nil,
                isPremium: isPremiumGame(sport: sport, homeTeam: homeTeam, awayTeam: awayTeam),
                raceName: nil,
                trackName: nil,
                location: nil,
                tournamentRound: nil,
                isMarchMadness: nil,
                bracketRegion: nil
            )
        }
    }
    
    /// Process NCAA basketball data
    private func processNCAAData(_ response: ESPNResponse, sport: SportType) -> [Game] {
        // Start with team sports processing
        let games = processTeamSportData(response, sport: sport)
        
        // Add tournament round information if available
        return games.map { game in
            guard let event = response.events?.first(where: { $0.id == game.id }),
                  let competition = event.competitions?.first else {
                return game
            }
            
            let tournamentInfo = competition.notes ?? []
            let roundNote = tournamentInfo.first(where: { $0.type == "event" })
            let bracketRegion = getBracketRegion(from: competition)
            
            return Game(
                id: game.id,
                date: game.date,
                homeTeam: game.homeTeam,
                awayTeam: game.awayTeam,
                league: game.league,
                status: game.status,
                spread: game.spread,
                overUnder: game.overUnder,
                fanduelLink: game.fanduelLink,
                isPremium: game.isPremium,
                raceName: nil,
                trackName: nil,
                location: nil,
                tournamentRound: roundNote?.headline,
                isMarchMadness: isMarchMadnessPeriod(),
                bracketRegion: bracketRegion
            )
        }
    }
    
    /// Process Formula 1 data
    private func processFormula1Data(_ response: ESPNResponse, sport: SportType) -> [Game] {
        guard let events = response.events, !events.isEmpty else {
            return []
        }
        
        return events.compactMap { event in
            guard let date = ISO8601DateFormatter().date(from: event.date) else {
                return nil
            }
            
            let raceName = event.name ?? "Formula 1 Race"
            let trackName = event.circuit?.fullName ?? "TBD"
            let location = event.circuit?.address?.city != nil ? 
                "\(event.circuit!.address!.city!), \(event.circuit!.address!.country ?? "")" : "TBD"
            
            let status = event.status?.type?.state ?? "pre"
            
            return Game(
                id: event.id,
                date: date,
                homeTeam: "",
                awayTeam: "",
                league: sport.rawValue,
                status: GameStatus(rawValue: status) ?? .unknown,
                spread: nil,
                overUnder: nil,
                fanduelLink: SportsConfig.Features.ENABLE_FANDUEL_LINKS ? 
                    generateFanduelLink(sport: sport, gameId: event.id, raceName: raceName) : nil,
                isPremium: true, // F1 predictions are premium by default
                raceName: raceName,
                trackName: trackName,
                location: location,
                tournamentRound: nil,
                isMarchMadness: nil,
                bracketRegion: nil
            )
        }
    }
    
    /// Check if current date is during March Madness
    private func isMarchMadnessPeriod() -> Bool {
        let now = Date()
        let calendar = Calendar.current
        let year = calendar.component(.year, from: now)
        
        let marchMadnessStart = calendar.date(from: DateComponents(year: year, month: 3, day: 1)) ?? now
        let marchMadnessEnd = calendar.date(from: DateComponents(year: year, month: 4, day: 15)) ?? now
        
        return now >= marchMadnessStart && now <= marchMadnessEnd
    }
    
    /// Get bracket region for NCAA games
    private func getBracketRegion(from competition: Competition) -> String? {
        let notes = competition.notes ?? []
        let bracketNote = notes.first(where: { $0.type == "bracket" })
        
        return bracketNote?.headline
    }
    
    /// Generate FanDuel deep link
    private func generateFanduelLink(sport: SportType, gameId: String, homeTeam: String? = nil, awayTeam: String? = nil, raceName: String? = nil) -> String {
        if !SportsConfig.Features.ENABLE_FANDUEL_LINKS {
            return ""
        }
        
        var path = ""
        
        switch sport {
        case .NBA:
            path = "nba"
        case .WNBA:
            path = "wnba"
        case .MLB:
            path = "mlb"
        case .NHL:
            path = "nhl"
        case .NCAA_MENS:
            path = "college-basketball"
        case .NCAA_WOMENS:
            path = "womens-college-basketball"
        case .FORMULA1:
            path = "formula-1"
        }
        
        var deepLink = "\(SportsConfig.FanDuel.DEEP_LINK_BASE)\(path)"
        
        // Add game-specific parameters
        if !gameId.isEmpty {
            deepLink += "?gameId=\(gameId)"
        }
        
        // Add affiliate ID
        deepLink += "&affid=\(SportsConfig.FanDuel.AFFILIATE_ID)"
        
        return deepLink
    }
    
    /// Determine if a game should be marked as premium
    private func isPremiumGame(sport: SportType, homeTeam: String, awayTeam: String) -> Bool {
        if !SportsConfig.Features.PREMIUM_PREDICTIONS {
            return false
        }
        
        // Mark all NCAA tournament games as premium during March Madness
        if (sport == .NCAA_MENS || sport == .NCAA_WOMENS) && isMarchMadnessPeriod() {
            return true
        }
        
        // Mark all WNBA playoff games as premium
        if sport == .WNBA && isPlayoffPeriod(for: sport) {
            return true
        }
        
        // For other sports, use a combination of team popularity and game importance
        let popularTeams: [SportType: [String]] = [
            .NBA: ["Lakers", "Celtics", "Warriors", "Bucks", "Nets"],
            .WNBA: ["Aces", "Liberty", "Sparks", "Mercury", "Sky"],
            .MLB: ["Yankees", "Dodgers", "Red Sox", "Cubs", "Braves"],
            .NHL: ["Maple Leafs", "Rangers", "Bruins", "Blackhawks", "Penguins"]
        ]
        
        let sportTeams = popularTeams[sport] ?? []
        
        // If both teams are popular, mark as premium
        if sportTeams.contains(where: { homeTeam.contains($0) }) && 
           sportTeams.contains(where: { awayTeam.contains($0) }) {
            return true
        }
        
        // Default to non-premium
        return false
    }
    
    /// Check if current date is during playoff period for a sport
    private func isPlayoffPeriod(for sport: SportType) -> Bool {
        let now = Date()
        let calendar = Calendar.current
        let month = calendar.component(.month, from: now)
        
        switch sport {
        case .NBA:
            return month >= 4 && month <= 6 // April to June
        case .WNBA:
            return month >= 9 && month <= 10 // September to October
        case .MLB:
            return month >= 10 && month <= 11 // October to November
        case .NHL:
            return month >= 4 && month <= 6 // April to June
        default:
            return false
        }
    }
    
    /// Get fallback data for a sport
    private func getFallbackData(for sport: SportType) -> [Game] {
        print("Using fallback data for \(sport.rawValue)")
        
        let today = Date()
        let calendar = Calendar.current
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: today) ?? today
        
        switch sport {
        case .NBA:
            return [
                Game(
                    id: "nba1",
                    date: today,
                    homeTeam: "Lakers",
                    awayTeam: "Nuggets",
                    league: sport.rawValue,
                    status: .scheduled,
                    spread: "-3.5",
                    overUnder: "224.5",
                    fanduelLink: generateFanduelLink(sport: sport, gameId: "nba1", homeTeam: "Lakers", awayTeam: "Nuggets"),
                    isPremium: true,
                    raceName: nil,
                    trackName: nil,
                    location: nil,
                    tournamentRound: nil,
                    isMarchMadness: nil,
                    bracketRegion: nil
                ),
                Game(
                    id: "nba2",
                    date: today,
                    homeTeam: "Celtics",
                    awayTeam: "Bucks",
                    league: sport.rawValue,
                    status: .scheduled,
                    spread: "-1.5",
                    overUnder: "220.5",
                    fanduelLink: generateFanduelLink(sport: sport, gameId: "nba2", homeTeam: "Celtics", awayTeam: "Bucks"),
                    isPremium: true,
                    raceName: nil,
                    trackName: nil,
                    location: nil,
                    tournamentRound: nil,
                    isMarchMadness: nil,
                    bracketRegion: nil
                )
            ]
            
        case .WNBA:
            return [
                Game(
                    id: "wnba1",
                    date: today,
                    homeTeam: "Liberty",
                    awayTeam: "Aces",
                    league: sport.rawValue,
                    status: .scheduled,
                    spread: "-2.5",
                    overUnder: "168.5",
                    fanduelLink: generateFanduelLink(sport: sport, gameId: "wnba1", homeTeam: "Liberty", awayTeam: "Aces"),
                    isPremium: true,
                    raceName: nil,
                    trackName: nil,
                    location: nil,
                    tournamentRound: nil,
                    isMarchMadness: nil,
                    bracketRegion: nil
                ),
                Game(
                    id: "wnba2",
                    date: tomorrow,
                    homeTeam: "Sparks",
                    awayTeam: "Mercury",
                    league: sport.rawValue,
                    status: .scheduled,
                    spread: "-1.5",
                    overUnder: "165.0",
                    fanduelLink: generateFanduelLink(sport: sport, gameId: "wnba2", homeTeam: "Sparks", awayTeam: "Mercury"),
                    isPremium: false,
                    raceName: nil,
                    trackName: nil,
                    location: nil,
                    tournamentRound: nil,
                    isMarchMadness: nil,
                    bracketRegion: nil
                )
            ]
            
        case .NCAA_MENS:
            return [
                Game(
                    id: "ncaam1",
                    date: today,
                    homeTeam: "Duke",
                    awayTeam: "North Carolina",
                    league: sport.rawValue,
                    status: .scheduled,
                    spread: "-3.5",
                    overUnder: "145.5",
                    fanduelLink: generateFanduelLink(sport: sport, gameId: "ncaam1", homeTeam: "Duke", awayTeam: "North Carolina"),
                    isPremium: true,
                    raceName: nil,
                    trackName: nil,
                    location: nil,
                    tournamentRound: "Sweet 16",
                    isMarchMadness: isMarchMadnessPeriod(),
                    bracketRegion: "East"
                ),
                Game(
                    id: "ncaam2",
                    date: today,
                    homeTeam: "Gonzaga",
                    awayTeam: "UCLA",
                    league: sport.rawValue,
                    status: .scheduled,
                    spread: "-4.5",
                    overUnder: "152.0",
                    fanduelLink: generateFanduelLink(sport: sport, gameId: "ncaam2", homeTeam: "Gonzaga", awayTeam: "UCLA"),
                    isPremium: true,
                    raceName: nil,
                    trackName: nil,
                    location: nil,
                    tournamentRound: "Sweet 16",
                    isMarchMadness: isMarchMadnessPeriod(),
                    bracketRegion: "West"
                )
            ]
            
        case .FORMULA1:
            return [
                Game(
                    id: "f11",
                    date: today,
                    homeTeam: "",
                    awayTeam: "",
                    league: sport.rawValue,
                    status: .scheduled,
                    spread: nil,
                    overUnder: nil,
                    fanduelLink: generateFanduelLink(sport: sport, gameId: "f11", raceName: "Monaco Grand Prix"),
                    isPremium: true,
                    raceName: "Monaco Grand Prix",
                    trackName: "Circuit de Monaco",
                    location: "Monte Carlo, Monaco",
                    tournamentRound: nil,
                    isMarchMadness: nil,
                    bracketRegion: nil
                ),
                Game(
                    id: "f12",
                    date: calendar.date(byAdding: .day, value: 14, to: today) ?? today,
                    homeTeam: "",
                    awayTeam: "",
                    league: sport.rawValue,
                    status: .scheduled,
                    spread: nil,
                    overUnder: nil,
                    fanduelLink: generateFanduelLink(sport: sport, gameId: "f12", raceName: "Canadian Grand Prix"),
                    isPremium: true,
                    raceName: "Canadian Grand Prix",
                    trackName: "Circuit Gilles Villeneuve",
                    location: "Montreal, Canada",
                    tournamentRound: nil,
                    isMarchMadness: nil,
                    bracketRegion: nil
                )
            ]
            
        default:
            // MLB, NHL, NCAA_WOMENS - similar pattern to above
            return []
        }
    }
}