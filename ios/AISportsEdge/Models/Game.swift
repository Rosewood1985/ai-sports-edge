import Foundation

/**
 * Game Model
 * 
 * Represents a sports game or event with all associated data
 * Supports:
 * - NBA, MLB, NHL (existing)
 * - WNBA (new)
 * - NCAA Men's and Women's Basketball (new)
 * - Formula 1 (new)
 */

struct Game: Identifiable, Codable, Hashable {
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
    
    // Odds-specific properties
    let homeOdds: Int?
    let awayOdds: Int?
    let oddsProvider: String?
    let hasRealOdds: Bool?
    
    // Computed properties
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
    
    var displayName: String {
        if isTeamSport {
            return "\(awayTeam) vs. \(homeTeam)"
        } else {
            return raceName ?? "F1 Race"
        }
    }
    
    var formattedSpread: String? {
        guard let spread = spread else { return nil }
        
        // Format the spread to show the favorite
        if spread.starts(with("-")) {
            return "\(homeTeam) \(spread)"
        } else if spread.starts(with("+") || Double(spread) ?? 0 > 0 {
            return "\(awayTeam) +\(spread.replacingOccurrences(of: "+", with: ""))"
        }
        return spread
    }
    
    var formattedOverUnder: String? {
        guard let overUnder = overUnder else { return nil }
        return "O/U \(overUnder)"
    }
    
    var formattedHomeOdds: String? {
        guard let odds = homeOdds else { return nil }
        return odds > 0 ? "+\(odds)" : "\(odds)"
    }
    
    var formattedAwayOdds: String? {
        guard let odds = awayOdds else { return nil }
        return odds > 0 ? "+\(odds)" : "\(odds)"
    }
    
    // For Hashable conformance
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Game, rhs: Game) -> Bool {
        return lhs.id == rhs.id
    }
}

enum GameStatus: String, Codable, Hashable {
    case scheduled = "pre"
    case inProgress = "in"
    case final = "post"
    case postponed = "postponed"
    case canceled = "canceled"
    case unknown
    
    var displayName: String {
        switch self {
        case .scheduled:
            return "Scheduled"
        case .inProgress:
            return "Live"
        case .final:
            return "Final"
        case .postponed:
            return "Postponed"
        case .canceled:
            return "Canceled"
        case .unknown:
            return "Unknown"
        }
    }
    
    var isLive: Bool {
        return self == .inProgress
    }
}

enum SportType: String, CaseIterable, Identifiable, Hashable {
    case NBA = "NBA"
    case WNBA = "WNBA"
    case MLB = "MLB"
    case NHL = "NHL"
    case NCAA_MENS = "NCAA_MENS"
    case NCAA_WOMENS = "NCAA_WOMENS"
    case FORMULA1 = "FORMULA1"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .NBA:
            return "NBA"
        case .WNBA:
            return "WNBA"
        case .MLB:
            return "MLB"
        case .NHL:
            return "NHL"
        case .NCAA_MENS:
            return "NCAA Men"
        case .NCAA_WOMENS:
            return "NCAA Women"
        case .FORMULA1:
            return "Formula 1"
        }
    }
    
    var icon: String {
        switch self {
        case .NBA:
            return "basketball"
        case .WNBA:
            return "basketball"
        case .MLB:
            return "baseball"
        case .NHL:
            return "hockey.puck"
        case .NCAA_MENS:
            return "basketball"
        case .NCAA_WOMENS:
            return "basketball"
        case .FORMULA1:
            return "car.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .NBA:
            return Color(red: 0.79, green: 0.03, blue: 0.17) // NBA red
        case .WNBA:
            return Color(red: 1.0, green: 0.4, blue: 0.12) // WNBA orange
        case .MLB:
            return Color(red: 0.06, green: 0.32, blue: 0.73) // MLB blue
        case .NHL:
            return Color(red: 0.56, green: 0.56, blue: 0.56) // NHL silver
        case .NCAA_MENS, .NCAA_WOMENS:
            return Color(red: 1.0, green: 0.51, blue: 0.0) // NCAA orange
        case .FORMULA1:
            return Color(red: 1.0, green: 0.12, blue: 0.0) // F1 red
        }
    }
}

// Import SwiftUI for Color
import SwiftUI