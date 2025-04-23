# Decision Log

## AI Pick of the Day Feature Implementation

### ML Component Decisions

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|-------------------------|
| 2025-04-17 | Use RandomForest classifier for initial model | Good performance with limited data, interpretable results, handles both numerical and categorical features | Neural networks (more complex, requires more data), Logistic regression (less powerful) |
| 2025-04-17 | Implement confidence adjustment based on sport, league, and momentum | Different sports have different predictability levels, momentum is a strong indicator of confidence | Fixed confidence thresholds, no adjustments |
| 2025-04-17 | Create separate Python scripts for training and inference | Separation of concerns, allows for easier maintenance and testing | Single script for both training and inference |

### Firebase Cloud Functions Decisions

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|-------------------------|
| 2025-04-17 | Use scheduled Cloud Functions for predictions | Automated, reliable, scalable, no need for manual intervention | Cron jobs on a separate server, client-side predictions |
| 2025-04-17 | Run predictTodayGames at 10 AM daily | Ensures all game data is available, predictions are ready for users | Running at midnight (less data available), running multiple times per day (higher costs) |
| 2025-04-17 | Run markAIPickOfDay at 9 AM daily | Ensures Pick of the Day is available when users check the app in the morning | Running immediately after predictions (less reliable) |
| 2025-04-17 | Store prediction logs in a separate collection | Enables analysis of prediction accuracy over time, helps with debugging | Storing logs with game data (less organized) |

### Frontend Component Decisions

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|-------------------------|
| 2025-04-17 | Create dedicated AIPickCard component | Reusable across different screens, consistent UI for predictions | Inline card implementation (less reusable) |
| 2025-04-17 | Implement separate screens for Pick of the Day and Leaderboard | Better organization, focused user experience for each feature | Combined screen (more cluttered) |
| 2025-04-17 | Use bottom tab navigation for AI Picks section | Intuitive navigation, standard pattern in mobile apps | Drawer navigation (less visible), stack navigation (less accessible) |
| 2025-04-17 | Implement client-side caching for predictions | Reduces Firestore reads, improves performance | No caching (higher costs, slower performance) |

### Data Structure Decisions

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|-------------------------|
| 2025-04-17 | Store predictions with game data | Simplifies queries, reduces joins, better performance | Separate predictions collection (more complex queries) |
| 2025-04-17 | Use isAIPickOfDay flag on game documents | Easy to query for Pick of the Day, simple to update | Separate Pick of the Day collection (more complex) |
| 2025-04-17 | Store historical picks in aiPicksOfDay collection | Enables historical analysis, doesn't clutter game data | Storing historical data with game data (less organized) |

### Technical Debt and Future Considerations

| Issue | Impact | Plan |
|-------|--------|------|
| Limited ML model features | May affect prediction accuracy | Plan to add more features in future iterations |
| No real-time updates | Predictions may become outdated | Implement real-time updates based on pre-game information |
| Limited personalization | Same predictions for all users | Add personalization features in future iterations |
| No A/B testing framework | Difficult to test different prediction strategies | Implement A/B testing framework in future iterations |