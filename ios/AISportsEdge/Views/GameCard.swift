import SwiftUI

/**
 * GameCard
 * 
 * A SwiftUI component for displaying a game card with odds information
 * Supports:
 * - NBA, MLB, NHL (existing)
 * - WNBA (new)
 * - NCAA Men's and Women's Basketball (new)
 * - Formula 1 (new)
 */

struct GameCard: View {
    let game: Game
    let onTap: () -> Void
    
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header with date, time, and league
                HStack {
                    Text(game.formattedDate)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(sportColor)
                    
                    Spacer()
                    
                    Text(game.formattedTime)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("| \(sportName)")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(sportColor)
                }
                
                // Game content
                if game.isTeamSport {
                    teamGameContent
                } else {
                    formulaOneContent
                }
                
                // Odds information
                if hasOddsInfo {
                    Divider()
                    oddsContent
                }
                
                // Premium indicator
                if game.isPremium {
                    HStack {
                        Spacer()
                        premiumBadge
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(cardBackgroundColor)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(
                        isMarchMadness ? 
                            LinearGradient(
                                gradient: Gradient(colors: [sportColor, sportColor.opacity(0.3), sportColor]),
                                startPoint: .leading,
                                endPoint: .trailing
                            ) : Color.clear,
                        lineWidth: 1
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    // Team sports content
    private var teamGameContent: some View {
        HStack(alignment: .center) {
            // Away team
            VStack(alignment: .leading) {
                Text(game.awayTeam)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                if let awayOdds = game.formattedAwayOdds {
                    Text(awayOdds)
                        .font(.subheadline)
                        .foregroundColor(sportColor)
                }
            }
            
            Spacer()
            
            // VS
            Text("VS")
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.horizontal, 8)
            
            Spacer()
            
            // Home team
            VStack(alignment: .trailing) {
                Text(game.homeTeam)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                if let homeOdds = game.formattedHomeOdds {
                    Text(homeOdds)
                        .font(.subheadline)
                        .foregroundColor(sportColor)
                }
            }
        }
    }
    
    // Formula 1 content
    private var formulaOneContent: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(game.raceName ?? "Formula 1 Race")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            if let trackName = game.trackName {
                Text(trackName)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            if let location = game.location {
                Text(location)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    // Odds content
    private var oddsContent: some View {
        HStack {
            if let spread = game.formattedSpread {
                oddsItem(label: "Spread", value: spread)
            }
            
            Spacer()
            
            if let overUnder = game.formattedOverUnder {
                oddsItem(label: "Total", value: overUnder)
            }
            
            if game.hasRealOdds == true {
                Spacer()
                liveOddsBadge
            }
        }
    }
    
    // Odds item
    private func oddsItem(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
            
            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
        }
    }
    
    // Premium badge
    private var premiumBadge: some View {
        Text("PREMIUM")
            .font(.system(size: 10, weight: .black))
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [Color.orange, Color.yellow]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(4)
    }
    
    // Live odds badge
    private var liveOddsBadge: some View {
        Text("LIVE ODDS")
            .font(.system(size: 10, weight: .black))
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [Color.green, Color.green.opacity(0.7)]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(4)
    }
    
    // Computed properties
    private var sportType: SportType? {
        return SportType(rawValue: game.league)
    }
    
    private var sportName: String {
        return sportType?.displayName ?? game.league
    }
    
    private var sportColor: Color {
        return sportType?.color ?? .blue
    }
    
    private var isMarchMadness: Bool {
        return (game.league == SportType.NCAA_MENS.rawValue || 
                game.league == SportType.NCAA_WOMENS.rawValue) && 
               (game.isMarchMadness == true)
    }
    
    private var hasOddsInfo: Bool {
        return game.spread != nil || game.overUnder != nil || game.homeOdds != nil || game.awayOdds != nil
    }
    
    private var cardBackgroundColor: Color {
        return colorScheme == .dark ? Color(UIColor.systemBackground) : Color.white
    }
}

// MARK: - Preview
struct GameCard_Previews: PreviewProvider {
    static var previews: some View {
        let dateFormatter = ISO8601DateFormatter()
        
        let nbaGame = Game(
            id: "nba1",
            date: Date(),
            homeTeam: "Lakers",
            awayTeam: "Nuggets",
            league: "NBA",
            status: .scheduled,
            spread: "-3.5",
            overUnder: "224.5",
            fanduelLink: "https://sportsbook.fanduel.com/navigation/nba?gameId=nba1",
            isPremium: true,
            raceName: nil,
            trackName: nil,
            location: nil,
            tournamentRound: nil,
            isMarchMadness: nil,
            bracketRegion: nil,
            homeOdds: -150,
            awayOdds: +130,
            oddsProvider: "FanDuel",
            hasRealOdds: true
        )
        
        let f1Race = Game(
            id: "f1",
            date: Date(),
            homeTeam: "",
            awayTeam: "",
            league: "FORMULA1",
            status: .scheduled,
            spread: nil,
            overUnder: nil,
            fanduelLink: "https://sportsbook.fanduel.com/navigation/formula-1?gameId=f1",
            isPremium: true,
            raceName: "Monaco Grand Prix",
            trackName: "Circuit de Monaco",
            location: "Monte Carlo, Monaco",
            tournamentRound: nil,
            isMarchMadness: nil,
            bracketRegion: nil,
            homeOdds: nil,
            awayOdds: nil,
            oddsProvider: nil,
            hasRealOdds: false
        )
        
        let ncaaGame = Game(
            id: "ncaa1",
            date: Date(),
            homeTeam: "Duke",
            awayTeam: "North Carolina",
            league: "NCAA_MENS",
            status: .scheduled,
            spread: "-2.5",
            overUnder: "145.5",
            fanduelLink: "https://sportsbook.fanduel.com/navigation/college-basketball?gameId=ncaa1",
            isPremium: true,
            raceName: nil,
            trackName: nil,
            location: nil,
            tournamentRound: "Sweet 16",
            isMarchMadness: true,
            bracketRegion: "East",
            homeOdds: -120,
            awayOdds: +100,
            oddsProvider: "FanDuel",
            hasRealOdds: true
        )
        
        return Group {
            GameCard(game: nbaGame, onTap: {})
                .padding()
                .previewDisplayName("NBA Game")
            
            GameCard(game: f1Race, onTap: {})
                .padding()
                .previewDisplayName("Formula 1 Race")
            
            GameCard(game: ncaaGame, onTap: {})
                .padding()
                .previewDisplayName("NCAA Game (March Madness)")
                .preferredColorScheme(.dark)
        }
    }
}