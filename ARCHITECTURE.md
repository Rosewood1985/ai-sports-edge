
# AI Sports Edge - Architecture Overview

## 1. Introduction
AI Sports Edge is built using a hybrid atomic-modular architecture that promotes scalable, clean, and maintainable development practices. The project emphasizes reusable UI components, modular feature development, and extensibility for future growth.

## 2. Architecture Model

| Layer | Architecture Style | Description |
|:--|:--|:--|
| UI Components | Atomic Design | Small reusable elements like buttons, inputs, and toasts. |
| Pages | Modular Structure | Full-page features like Dashboard, Account, Bets. |
| Services | Modular Structure | Firebase Authentication, Firestore Database, APIs, Racing Data. |
| Racing Integration | Atomic + Modular | NASCAR & Horse Racing data services with ML features. |
| Routing | Modular Routing | Centralized configuration for clean navigation. |
| i18n | Modular Language Packs | English live; Spanish scaffolding initiated. |

## 3. Folder Structure

```
/ai-sports-edge-restore
  /atomic            (Modern Atomic Design Components)
    /atoms           (Basic UI elements, racing types/utils)
    /molecules       (Composed components, racing charts)
    /organisms       (Complex systems, racing dashboards)
  /components        (Legacy UI Elements - being migrated)
  /screens           (Full-screen features: Dashboard, Betting, etc.)
  /services          (Business logic services)
    /racing          (NEW: NASCAR & Horse Racing data services)
  /config            (Configuration files)
  /functions         (Firebase Cloud Functions)
  /utils             (Helper functions and constants)
App.tsx              (Application root file)
```

## 4. Key Advantages
- Highly scalable
- Developer-friendly modularization
- Faster onboarding for new devs
- Cleaner feature expansion
- Lower technical debt
- Ready for internationalization
- Investor/partner-grade technical standards

## 5. Future Enhancements (Roadmap)
- Admin Portal Development
- Advanced Analytics Module
- Dark Mode Expansion
- Language Expansion (Spanish UI full buildout)

---
Version v1.0
Last Updated: April 27, 2025
