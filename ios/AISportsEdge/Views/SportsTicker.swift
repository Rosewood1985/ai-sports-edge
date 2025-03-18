import SwiftUI
import Combine

/**
 * SportsTicker
 * 
 * A SwiftUI component for displaying a scrolling ticker of sports events
 * Supports:
 * - NBA, MLB, NHL (existing)
 * - WNBA (new)
 * - NCAA Men's and Women's Basketball (new)
 * - Formula 1 (new)
 *
 * Features:
 * - Continuous scrolling animation
 * - Premium game indicators
 * - FanDuel deep linking
 * - Sport-specific styling
 */

struct SportsTicker: View {
    @StateObject private var viewModel = SportsTickerViewModel()
    @StateObject private var rssViewModel = RSSTickerViewModel()
    @State private var scrollOffset: CGFloat = 0
    @State private var contentWidth: CGFloat = 0
    @State private var containerWidth: CGFloat = 0
    @State private var showNewsTab: Bool = false
    
    // Animation settings
    private let scrollDuration: Double = 60.0
    private let scrollDelay: Double = 0.0
    
    var body: some View {
        VStack(spacing: 0) {
            // Title bar
            HStack {
                // Toggle between games and news
                HStack(spacing: 16) {
                    Button(action: {
                        withAnimation {
                            showNewsTab = false
                        }
                    }) {
                        Text("UPCOMING GAMES")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(showNewsTab ? .gray : .white)
                            .padding(.vertical, 4)
                            .padding(.horizontal, 8)
                            .background(showNewsTab ? Color.clear : Color.blue.opacity(0.3))
                            .cornerRadius(4)
                    }
                    
                    Button(action: {
                        withAnimation {
                            showNewsTab = true
                        }
                    }) {
                        Text("SPORTS NEWS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(showNewsTab ? .white : .gray)
                            .padding(.vertical, 4)
                            .padding(.horizontal, 8)
                            .background(showNewsTab ? Color.blue.opacity(0.3) : Color.clear)
                            .cornerRadius(4)
                    }
                }
                
                Spacer()
                
                if viewModel.isLoading || rssViewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.7)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.black.opacity(0.8))
            
            // Ticker content
            GeometryReader { geometry in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        if showNewsTab {
                            // News content
                            if rssViewModel.newsItems.isEmpty && !rssViewModel.isLoading {
                                Text("No sports news found")
                                    .foregroundColor(.gray)
                                    .padding()
                            } else {
                                // Duplicate content for continuous scrolling
                                ForEach(0..<3) { _ in
                                    ForEach(rssViewModel.newsItems) { newsItem in
                                        newsItemView(for: newsItem)
                                    }
                                }
                            }
                        } else {
                            // Games content
                            if viewModel.games.isEmpty && !viewModel.isLoading {
                                Text("No upcoming games found")
                                    .foregroundColor(.gray)
                                    .padding()
                            } else {
                                // Duplicate content for continuous scrolling
                                ForEach(0..<3) { _ in
                                    ForEach(viewModel.games) { game in
                                        gameView(for: game)
                                    }
                                }
                            }
                        }
                    }
                    .background(GeometryReader { contentGeometry in
                        Color.clear.onAppear {
                            contentWidth = contentGeometry.size.width
                            containerWidth = geometry.size.width
                        }
                    })
                    .offset(x: scrollOffset)
                    .onAppear {
                        animateScroll()
                    }
                }
                .onAppear {
                    containerWidth = geometry.size.width
                }
            }
            .frame(height: 44)
            .background(Color.black.opacity(0.7))
        }
        .onAppear {
            viewModel.loadGames()
            rssViewModel.loadNewsItems()
        }
    }
    
    // Game view for team sports
    private func teamGameView(for game: Game) -> some View {
        HStack(spacing: 4) {
            // Date
            Text(game.formattedDate)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(sportColor(for: game.league))
            
            // Teams
            Text("\(game.awayTeam) vs. \(game.homeTeam)")
                .font(.caption)
                .foregroundColor(.white)
            
            // Time
            Text(game.formattedTime)
                .font(.caption2)
                .foregroundColor(.gray)
            
            // League
            Text("| \(SportType(rawValue: game.league)?.displayName ?? game.league)")
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(sportColor(for: game.league))
            
            // Premium indicator
            if game.isPremium {
                premiumBadge()
            }
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 8)
        .background(
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.black.opacity(0.3))
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .strokeBorder(
                            isMarchMadness(game) ? 
                                LinearGradient(
                                    gradient: Gradient(colors: [.orange, .orange.opacity(0.3), .orange]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ) : Color.clear,
                            lineWidth: 1
                        )
                )
        )
        .contentShape(Rectangle())
        .onTapGesture {
            if let link = game.fanduelLink, !link.isEmpty {
                openFanduelLink(link)
            }
        }
    }
    
    // Game view for Formula 1
    private func formula1GameView(for game: Game) -> some View {
        HStack(spacing: 4) {
            // Date
            Text(game.formattedDate)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(sportColor(for: game.league))
            
            // Race name
            Text(game.raceName ?? "F1 Race")
                .font(.caption)
                .foregroundColor(.white)
            
            // Time
            Text(game.formattedTime)
                .font(.caption2)
                .foregroundColor(.gray)
            
            // League
            Text("| F1")
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(sportColor(for: game.league))
            
            // Premium indicator
            if game.isPremium {
                premiumBadge()
            }
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 8)
        .background(
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.black.opacity(0.3))
        )
        .contentShape(Rectangle())
        .onTapGesture {
            if let link = game.fanduelLink, !link.isEmpty {
                openFanduelLink(link)
            }
        }
    }
    
    // Combined game view that handles both team sports and F1
    private func gameView(for game: Game) -> some View {
        Group {
            if game.isTeamSport {
                teamGameView(for: game)
            } else {
                formula1GameView(for: game)
            }
        }
    }
    
    // Premium badge
    private func premiumBadge() -> some View {
        Text("PREMIUM")
            .font(.system(size: 8, weight: .black))
            .padding(.horizontal, 4)
            .padding(.vertical, 2)
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [Color.orange, Color.yellow]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(2)
    }
    
    // Check if a game is part of March Madness
    private func isMarchMadness(_ game: Game) -> Bool {
        return (game.league == SportType.NCAA_MENS.rawValue || 
                game.league == SportType.NCAA_WOMENS.rawValue) && 
               (game.isMarchMadness == true)
    }
    
    // Get color for sport
    private func sportColor(for league: String) -> Color {
        guard let sport = SportType(rawValue: league) else {
            return .blue
        }
        
        switch sport {
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
    
    // Animate the scroll
    private func animateScroll() {
        // Only start animation if we have content
        guard contentWidth > 0, containerWidth > 0 else { return }
        
        // Calculate the animation distance (one full content width)
        let distance = contentWidth / 3 // Divide by 3 because we have 3 copies of the content
        
        // Reset position
        scrollOffset = 0
        
        // Animate the scroll
        withAnimation(Animation.linear(duration: scrollDuration).delay(scrollDelay).repeatForever(autoreverses: false)) {
            scrollOffset = -distance
        }
    }
    
    // News item view
    private func newsItemView(for newsItem: RSSItem) -> some View {
        HStack(spacing: 4) {
            // Date
            Text(newsItem.date)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(newsColor(for: newsItem.sport))
            
            // News headline
            Text(newsItem.teams)
                .font(.caption)
                .foregroundColor(.white)
                .lineLimit(1)
            
            // Time
            Text(newsItem.time)
                .font(.caption2)
                .foregroundColor(.gray)
            
            // Sport
            Text("| \(newsItem.sport)")
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(newsColor(for: newsItem.sport))
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 8)
        .background(
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.black.opacity(0.3))
        )
        .contentShape(Rectangle())
        .onTapGesture {
            if let link = newsItem.link, !link.isEmpty {
                openNewsLink(link)
            }
        }
    }
    
    // Get color for news item based on sport
    private func newsColor(for sport: String) -> Color {
        let upperSport = sport.uppercased()
        
        if upperSport.contains("NBA") || upperSport == "BASKETBALL" {
            return Color(red: 0.79, green: 0.03, blue: 0.17) // NBA red
        } else if upperSport.contains("MLB") || upperSport == "BASEBALL" {
            return Color(red: 0.06, green: 0.32, blue: 0.73) // MLB blue
        } else if upperSport.contains("NHL") || upperSport == "HOCKEY" {
            return Color(red: 0.56, green: 0.56, blue: 0.56) // NHL silver
        } else if upperSport.contains("NFL") || upperSport == "FOOTBALL" {
            return Color(red: 0.0, green: 0.32, blue: 0.5) // NFL blue
        } else if upperSport.contains("F1") || upperSport == "FORMULA 1" || upperSport == "RACING" {
            return Color(red: 1.0, green: 0.12, blue: 0.0) // F1 red
        } else if upperSport.contains("UFC") || upperSport == "MMA" {
            return Color(red: 0.8, green: 0.0, blue: 0.0) // UFC red
        } else if upperSport.contains("SOCCER") {
            return Color(red: 0.0, green: 0.5, blue: 0.0) // Soccer green
        } else {
            return Color.blue
        }
    }
    
    // Open news link
    private func openNewsLink(_ link: String) {
        guard let url = URL(string: link) else { return }
        
        #if os(iOS)
        UIApplication.shared.open(url)
        #endif
    }
    
    // Open FanDuel link
    private func openFanduelLink(_ link: String) {
        guard let url = URL(string: link) else { return }
        
        #if os(iOS)
        UIApplication.shared.open(url)
        #endif
    }
}

// MARK: - ViewModels
class SportsTickerViewModel: ObservableObject {
    @Published var games: [Game] = []
    @Published var isLoading = false
    
    private var cancellables = Set<AnyCancellable>()
    private let sportsDataService = SportsDataService.shared
    
    func loadGames() {
        isLoading = true
        
        sportsDataService.fetchAllSportsData()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    
                    if case .failure(let error) = completion {
                        print("Error loading games: \(error.localizedDescription)")
                    }
                },
                receiveValue: { [weak self] games in
                    self?.games = games
                }
            )
            .store(in: &cancellables)
    }
}

// MARK: - RSS Ticker ViewModel
class RSSTickerViewModel: ObservableObject {
    @Published var newsItems: [RSSItem] = []
    @Published var isLoading = false
    
    private var cancellables = Set<AnyCancellable>()
    private let rssFeedService = RSSFeedService.shared
    
    func loadNewsItems() {
        isLoading = true
        
        rssFeedService.fetchNewsTickerItems(limit: 20)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    
                    if case .failure(let error) = completion {
                        print("Error loading news items: \(error.localizedDescription)")
                    }
                },
                receiveValue: { [weak self] items in
                    self?.newsItems = items
                }
            )
            .store(in: &cancellables)
    }
    
    func refreshNewsItems() {
        loadNewsItems()
    }
}

// MARK: - Preview
struct SportsTicker_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color.gray.edgesIgnoringSafeArea(.all)
            
            VStack {
                Spacer()
                
                SportsTicker()
                    .frame(height: 70)
            }
        }
    }
}