import Foundation
import Combine

/**
 * RSSFeedService
 * 
 * A service for fetching and processing RSS feed data for sports news
 * Integrates with the backend RSS feed API
 */

// MARK: - Models
struct RSSItem: Identifiable, Codable {
    let id: String
    let date: String
    let teams: String
    let time: String
    let sport: String
    let link: String?
    
    enum CodingKeys: String, CodingKey {
        case id, date, teams, time, sport, link
    }
}

// MARK: - RSSFeedService
class RSSFeedService {
    // Singleton instance
    static let shared = RSSFeedService()
    
    private let urlSession: URLSession
    private let baseURL: String
    
    private init() {
        self.urlSession = URLSession.shared
        
        // Use the app's API endpoint for RSS feeds
        #if DEBUG
        self.baseURL = "http://localhost:3000/api/rss"
        #else
        self.baseURL = "https://ai-sports-edge.web.app/api/rss"
        #endif
    }
    
    // MARK: - Public Methods
    
    /// Fetch news ticker items
    func fetchNewsTickerItems(limit: Int = 20) -> AnyPublisher<[RSSItem], Error> {
        guard let url = URL(string: "\(baseURL)/news-ticker?limit=\(limit)") else {
            return Fail(error: NSError(domain: "RSSFeedService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
                .eraseToAnyPublisher()
        }
        
        print("Fetching RSS news ticker items")
        
        return urlSession.dataTaskPublisher(for: url)
            .map { $0.data }
            .decode(type: [RSSItem].self, decoder: JSONDecoder())
            .catch { error -> AnyPublisher<[RSSItem], Error> in
                print("Error fetching RSS news ticker items: \(error.localizedDescription)")
                return Just(self.getFallbackNewsItems())
                    .setFailureType(to: Error.self)
                    .eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    /// Fetch RSS feed for a specific sport
    func fetchSportFeed(sport: String) -> AnyPublisher<[RSSItem], Error> {
        guard let url = URL(string: "\(baseURL)/feeds/\(sport.lowercased())") else {
            return Fail(error: NSError(domain: "RSSFeedService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
                .eraseToAnyPublisher()
        }
        
        print("Fetching RSS feed for \(sport)")
        
        return urlSession.dataTaskPublisher(for: url)
            .map { $0.data }
            .decode(type: [RSSItem].self, decoder: JSONDecoder())
            .catch { error -> AnyPublisher<[RSSItem], Error> in
                print("Error fetching RSS feed for \(sport): \(error.localizedDescription)")
                return Just([])
                    .setFailureType(to: Error.self)
                    .eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    /// Get fallback news items in case the API fails
    private func getFallbackNewsItems() -> [RSSItem] {
        return [
            RSSItem(
                id: "news-1",
                date: "MAR 18",
                teams: "Lakers defeat Nuggets in overtime thriller",
                time: "10:30 PM",
                sport: "NBA",
                link: nil
            ),
            RSSItem(
                id: "news-2",
                date: "MAR 18",
                teams: "Yankees sign star pitcher to 5-year deal",
                time: "2:15 PM",
                sport: "MLB",
                link: nil
            ),
            RSSItem(
                id: "news-3",
                date: "MAR 19",
                teams: "Formula 1 announces new race in Las Vegas",
                time: "9:00 AM",
                sport: "F1",
                link: nil
            ),
            RSSItem(
                id: "news-4",
                date: "MAR 19",
                teams: "NCAA Tournament Sweet 16 matchups set",
                time: "11:45 PM",
                sport: "NCAA",
                link: nil
            ),
            RSSItem(
                id: "news-5",
                date: "MAR 20",
                teams: "NHL trade deadline: Winners and losers",
                time: "3:30 PM",
                sport: "NHL",
                link: nil
            )
        ]
    }
}