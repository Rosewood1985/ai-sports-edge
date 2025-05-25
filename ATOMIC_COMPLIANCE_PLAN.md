# Atomic Architecture Compliance Plan

## Current Status: 90% → Target: 100%

### Remaining 10% Breakdown:
- **155 files** need atomic migration/updates
- **48 screen files** with non-atomic imports  
- **20+ web components** not following atomic structure
- **4 missing index files** for proper exports

---

## Phase 1: High Priority Widgets (Immediate)

### Move Complex Components to Organisms
```bash
# Priority 1: Widget Components
/components/BettingAnalytics.tsx → /atomic/organisms/widgets/BettingAnalyticsWidget.tsx
/components/AILeaderboard.tsx → /atomic/organisms/widgets/AILeaderboardWidget.tsx  
/components/OddsComparisonComponent.tsx → /atomic/organisms/widgets/OddsComparisonWidget.tsx
/components/PersonalizationSettings.tsx → /atomic/organisms/forms/PersonalizationForm.tsx
```

### Create Missing Chart Molecules
```bash
# Priority 2: Chart Components  
/components/BettingAnalyticsChart.tsx → /atomic/molecules/charts/BettingAnalyticsChart.tsx
/components/BettingHistoryChart.tsx → /atomic/molecules/charts/BettingHistoryChart.tsx
/components/BubbleChart.tsx → /atomic/molecules/charts/BubbleChart.tsx
/components/HeatMapChart.tsx → /atomic/molecules/charts/HeatMapChart.tsx
```

---

## Phase 2: Core UI Atoms (Quick Wins)

### Move Basic Components to Atoms
```bash
/components/AccessibleText.tsx → /atomic/atoms/AccessibleText.tsx
/components/AccessibleTouchable.tsx → /atomic/atoms/AccessibleTouchable.tsx
/components/LoadingIndicator.tsx → /atomic/atoms/LoadingIndicator.tsx
/components/Toast.tsx → /atomic/atoms/Toast.tsx
/components/HapticTab.tsx → /atomic/atoms/HapticTab.tsx
```

---

## Phase 3: Index File Completion

### Create Complete Atomic Exports
```typescript
// /atomic/atoms/index.ts - Export all atoms
// /atomic/molecules/index.ts - Export all molecules  
// /atomic/organisms/index.ts - Export all organisms
// /atomic/pages/index.ts - Export all pages
// /atomic/templates/index.ts - Export all templates
```

---

## Phase 4: Import Pattern Updates

### Update All Non-Atomic Imports
```typescript
// Before (Non-atomic)
import LanguageSelector from '../components/LanguageSelector';
import { BettingAnalytics } from '../components/BettingAnalytics';

// After (Atomic)
import { LanguageSelector } from '../atomic/molecules/language';
import { BettingAnalytics } from '../atomic/organisms/widgets';
```

**Files to Update:** 48 screen files + 20+ web files

---

## Implementation Strategy

### Token-Efficient Approach:
1. **Batch Operations**: Move related components together
2. **Template Reuse**: Standardized atomic component structure
3. **Index Updates**: Batch export updates
4. **Import Replacements**: Pattern-based replacements

### Technical Execution:
1. Create atomic directories
2. Move components with atomic-compliant structure
3. Update index files
4. Replace import statements
5. Test atomic imports

---

## Success Metrics

### Target Compliance:
- **100% Atomic Structure**: All components in proper atomic hierarchy
- **0 Non-Atomic Imports**: All imports use atomic paths
- **Complete Index Coverage**: All atomic modules properly exported
- **Design Pattern Adherence**: All components follow atomic principles