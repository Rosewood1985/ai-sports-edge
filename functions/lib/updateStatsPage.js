"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatsPage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const firestore = admin.firestore();
/**
 * Firebase Cloud Function that runs weekly to update stats page data
 */
exports.updateStatsPage = functions.pubsub
    .schedule('0 0 * * 0') // Run at midnight every Sunday
    .timeZone('America/New_York')
    .onRun(async (context) => {
    firebase_functions_1.logger.info('Starting updateStatsPage function');
    try {
        // Get all completed games with AI predictions
        const gamesRef = firestore.collection('games');
        const gamesQuery = gamesRef
            .where('aiConfidence', '>', 0) // Only games with predictions
            .where('result', 'in', ['win', 'loss', 'push']); // Only completed games
        const gamesSnapshot = await gamesQuery.get();
        if (gamesSnapshot.empty) {
            firebase_functions_1.logger.info('No completed games with predictions found');
            return null;
        }
        firebase_functions_1.logger.info(`Found ${gamesSnapshot.size} completed games with predictions`);
        // Convert to array
        const games = gamesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Calculate overall stats
        const totalPicks = games.length;
        const wins = games.filter(game => game.result === 'win').length;
        const losses = games.filter(game => game.result === 'loss').length;
        const pushes = games.filter(game => game.result === 'push').length;
        const pending = games.filter(game => game.result === 'pending' || !game.result).length;
        const overallWinPercentage = totalPicks > 0
            ? Math.round((wins / (wins + losses)) * 100)
            : 0;
        // Calculate confidence tier stats
        const confidenceTiers = [
            {
                tier: 'high',
                range: '80-100%',
                winPercentage: 0,
                totalPicks: 0,
                wins: 0,
                losses: 0,
                pushes: 0,
                pending: 0
            },
            {
                tier: 'medium',
                range: '60-79%',
                winPercentage: 0,
                totalPicks: 0,
                wins: 0,
                losses: 0,
                pushes: 0,
                pending: 0
            },
            {
                tier: 'low',
                range: '0-59%',
                winPercentage: 0,
                totalPicks: 0,
                wins: 0,
                losses: 0,
                pushes: 0,
                pending: 0
            }
        ];
        // Populate confidence tier stats
        games.forEach(game => {
            const confidence = game.aiConfidence || 0;
            let tier;
            if (confidence >= 80) {
                tier = confidenceTiers[0]; // high
            }
            else if (confidence >= 60) {
                tier = confidenceTiers[1]; // medium
            }
            else {
                tier = confidenceTiers[2]; // low
            }
            tier.totalPicks++;
            if (game.result === 'win') {
                tier.wins++;
            }
            else if (game.result === 'loss') {
                tier.losses++;
            }
            else if (game.result === 'push') {
                tier.pushes++;
            }
            else {
                tier.pending++;
            }
        });
        // Calculate win percentages for each tier
        confidenceTiers.forEach(tier => {
            tier.winPercentage = (tier.wins + tier.losses) > 0
                ? Math.round((tier.wins / (tier.wins + tier.losses)) * 100)
                : 0;
        });
        // Calculate sport stats
        const sportMap = new Map();
        games.forEach(game => {
            const sport = game.sport || 'Unknown';
            if (!sportMap.has(sport)) {
                sportMap.set(sport, {
                    sport,
                    winPercentage: 0,
                    totalPicks: 0,
                    wins: 0,
                    losses: 0,
                    pushes: 0,
                    pending: 0
                });
            }
            const sportStat = sportMap.get(sport);
            sportStat.totalPicks++;
            if (game.result === 'win') {
                sportStat.wins++;
            }
            else if (game.result === 'loss') {
                sportStat.losses++;
            }
            else if (game.result === 'push') {
                sportStat.pushes++;
            }
            else {
                sportStat.pending++;
            }
        });
        // Calculate win percentages for each sport
        sportMap.forEach(sportStat => {
            sportStat.winPercentage = (sportStat.wins + sportStat.losses) > 0
                ? Math.round((sportStat.wins / (sportStat.wins + sportStat.losses)) * 100)
                : 0;
        });
        const sportStats = Array.from(sportMap.values());
        // Calculate time range stats
        const now = admin.firestore.Timestamp.now();
        const sevenDaysAgo = new admin.firestore.Timestamp(now.seconds - (7 * 24 * 60 * 60), now.nanoseconds);
        const thirtyDaysAgo = new admin.firestore.Timestamp(now.seconds - (30 * 24 * 60 * 60), now.nanoseconds);
        // Last 7 days
        const last7DaysGames = games.filter(game => game.startTime && game.startTime.seconds >= sevenDaysAgo.seconds);
        const last7DaysWins = last7DaysGames.filter(game => game.result === 'win').length;
        const last7DaysLosses = last7DaysGames.filter(game => game.result === 'loss').length;
        const last7DaysWinPercentage = (last7DaysWins + last7DaysLosses) > 0
            ? Math.round((last7DaysWins / (last7DaysWins + last7DaysLosses)) * 100)
            : 0;
        // Last 30 days
        const last30DaysGames = games.filter(game => game.startTime && game.startTime.seconds >= thirtyDaysAgo.seconds);
        const last30DaysWins = last30DaysGames.filter(game => game.result === 'win').length;
        const last30DaysLosses = last30DaysGames.filter(game => game.result === 'loss').length;
        const last30DaysWinPercentage = (last30DaysWins + last30DaysLosses) > 0
            ? Math.round((last30DaysWins / (last30DaysWins + last30DaysLosses)) * 100)
            : 0;
        // Compile stats data
        const statsData = {
            lastUpdated: admin.firestore.Timestamp.now(),
            overallWinPercentage,
            totalPicks,
            wins,
            losses,
            pushes,
            pending,
            confidenceTiers,
            sportStats,
            timeRanges: {
                last7Days: {
                    winPercentage: last7DaysWinPercentage,
                    totalPicks: last7DaysGames.length,
                    wins: last7DaysWins,
                    losses: last7DaysLosses
                },
                last30Days: {
                    winPercentage: last30DaysWinPercentage,
                    totalPicks: last30DaysGames.length,
                    wins: last30DaysWins,
                    losses: last30DaysLosses
                },
                allTime: {
                    winPercentage: overallWinPercentage,
                    totalPicks,
                    wins,
                    losses
                }
            }
        };
        // Save stats to Firestore
        await firestore.collection('stats').doc('aiPicks').set(statsData);
        firebase_functions_1.logger.info('Successfully updated stats page data');
        // Also save a historical record
        await firestore.collection('statsHistory').add(Object.assign(Object.assign({}, statsData), { timestamp: admin.firestore.Timestamp.now() }));
        firebase_functions_1.logger.info('Added entry to statsHistory collection');
        return statsData;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error in updateStatsPage function:', error);
        throw error;
    }
});
//# sourceMappingURL=updateStatsPage.js.map