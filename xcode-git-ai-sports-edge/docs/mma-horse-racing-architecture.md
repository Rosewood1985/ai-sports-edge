# MMA Round Betting and Horse Racing Architecture

This document provides architectural diagrams for the MMA round betting and horse racing features in the AI Sports Edge app.

## System Architecture

```mermaid
graph TD
    subgraph "Client Application"
        UI[User Interface]
        Services[Service Layer]
        Cache[Local Cache]
        Store[AsyncStorage]
    end
    
    subgraph "Backend Services"
        UFC[UFC/MMA API]
        HR[Horse Racing API]
        Firebase[Firebase/Firestore]
    end
    
    UI --> Services
    Services --> Cache
    Services --> Store
    Services --> UFC
    Services --> HR
    Services --> Firebase
    
    classDef primary fill:#0a7ea4,stroke:#0a6c8f,color:white;
    classDef secondary fill:#34495e,stroke:#2c3e50,color:white;
    classDef storage fill:#f39c12,stroke:#e67e22,color:white;
    
    class UI,Services primary;
    class UFC,HR,Firebase secondary;
    class Cache,Store storage;
```

## MMA Round Betting Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant UFC as UFCService
    participant Sub as SubscriptionService
    participant API as UFC/MMA API
    participant DB as Firestore
    
    User->>UI: View Fight Details
    UI->>UFC: fetchFight(fightId)
    UFC->>API: GET /fights/{fightId}
    API-->>UFC: Fight Data
    UFC-->>UI: Fight Details
    
    User->>UI: Access Round Betting
    UI->>Sub: hasRoundBettingAccess(userId, fightId)
    Sub->>DB: Check Subscription Status
    DB-->>Sub: Subscription Data
    Sub-->>UI: Access Status
    
    alt Has Access
        UI->>UFC: fetchRoundBettingOptions(fightId)
        UFC->>API: GET /fights/{fightId}/round-betting
        API-->>UFC: Round Betting Options
        UFC-->>UI: Display Betting Options
        User->>UI: Select Betting Option
        UI->>UI: Update UI with Selection
    else No Access
        UI->>UI: Show Premium Feature Prompt
        User->>UI: Purchase Access
        UI->>Sub: purchaseRoundBettingAccess(userId, fightId)
        Sub->>DB: Store Purchase
        DB-->>Sub: Confirmation
        Sub-->>UI: Access Granted
        UI->>UFC: fetchRoundBettingOptions(fightId)
        UFC->>API: GET /fights/{fightId}/round-betting
        API-->>UFC: Round Betting Options
        UFC-->>UI: Display Betting Options
    end
```

## Horse Racing Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant HR as HorseRacingService
    participant Sub as SubscriptionService
    participant API as Horse Racing API
    participant DB as Firestore
    
    User->>UI: Open Horse Racing Screen
    UI->>HR: fetchRaceMeetings()
    HR->>API: GET /meetings
    API-->>HR: Race Meetings Data
    HR-->>UI: Display Race Meetings
    
    User->>UI: Select Race
    UI->>HR: fetchRace(raceId)
    HR->>API: GET /races/{raceId}
    API-->>HR: Race Details
    HR-->>UI: Display Race Details
    
    User->>UI: View Horse Details
    UI->>HR: fetchHorse(horseId)
    HR->>API: GET /horses/{horseId}
    API-->>HR: Horse Details
    HR-->>UI: Display Horse Details
    
    User->>UI: Place Bet
    UI->>Sub: hasHorseRacingAccess(userId, raceId)
    Sub->>DB: Check Subscription Status
    DB-->>Sub: Subscription Data
    
    alt Has Access
        Sub-->>UI: Access Granted
        UI->>UI: Process Bet
        UI->>DB: Store Bet
        DB-->>UI: Confirmation
    else No Access
        Sub-->>UI: Access Denied
        UI->>UI: Show Premium Feature Prompt
        User->>UI: Purchase Access
        UI->>Sub: purchaseRaceAccess(userId, raceId)
        Sub->>DB: Store Purchase
        DB-->>Sub: Confirmation
        Sub-->>UI: Access Granted
        UI->>UI: Process Bet
        UI->>DB: Store Bet
        DB-->>UI: Confirmation
    end
```

## Component Architecture

### MMA Round Betting Components

```mermaid
graph TD
    subgraph "Screens"
        UFC[UFCScreen]
        FD[FightDetailScreen]
    end
    
    subgraph "Components"
        FC[FightCard]
        RBC[RoundBettingCard]
        PF[PremiumFeature]
    end
    
    subgraph "Services"
        UFCS[UFCService]
        SS[SubscriptionService]
    end
    
    UFC --> FC
    FC --> FD
    FD --> RBC
    FD --> PF
    RBC --> UFCS
    PF --> SS
    FD --> UFCS
    FD --> SS
    
    classDef screen fill:#3498db,stroke:#2980b9,color:white;
    classDef component fill:#2ecc71,stroke:#27ae60,color:white;
    classDef service fill:#9b59b6,stroke:#8e44ad,color:white;
    
    class UFC,FD screen;
    class FC,RBC,PF component;
    class UFCS,SS service;
```

### Horse Racing Components

```mermaid
graph TD
    subgraph "Screens"
        HRS[HorseRacingScreen]
        RDS[RaceDetailScreen]
        HDS[HorseDetailScreen]
    end
    
    subgraph "Components"
        RC[RaceCard]
        HC[HorseCard]
        BF[BettingForm]
        PF[PremiumFeature]
    end
    
    subgraph "Services"
        HRS2[HorseRacingService]
        SS[SubscriptionService]
    end
    
    HRS --> RC
    RC --> RDS
    RDS --> HC
    HC --> HDS
    RDS --> BF
    RDS --> PF
    HDS --> BF
    BF --> SS
    PF --> SS
    HRS --> HRS2
    RDS --> HRS2
    HDS --> HRS2
    
    classDef screen fill:#3498db,stroke:#2980b9,color:white;
    classDef component fill:#2ecc71,stroke:#27ae60,color:white;
    classDef service fill:#9b59b6,stroke:#8e44ad,color:white;
    
    class HRS,RDS,HDS screen;
    class RC,HC,BF,PF component;
    class HRS2,SS service;
```

## Subscription Model

```mermaid
graph TD
    subgraph "Subscription Tiers"
        Basic[Basic Tier]
        Premium[Premium Tier]
    end
    
    subgraph "Microtransactions"
        RB[Round Betting]
        RA[Race Access]
    end
    
    subgraph "Features"
        UFC[UFC Basic]
        UFCRB[UFC Round Betting]
        HR[Horse Racing Basic]
        HRB[Horse Racing Betting]
    end
    
    Basic --> UFC
    Basic --> HR
    Premium --> UFC
    Premium --> UFCRB
    Premium --> HR
    Premium --> HRB
    RB --> UFCRB
    RA --> HRB
    
    classDef tier fill:#e74c3c,stroke:#c0392b,color:white;
    classDef micro fill:#f39c12,stroke:#d35400,color:white;
    classDef feature fill:#1abc9c,stroke:#16a085,color:white;
    
    class Basic,Premium tier;
    class RB,RA micro;
    class UFC,UFCRB,HR,HRB feature;
```

## Database Schema

### Firestore Collections

```mermaid
erDiagram
    USERS ||--o{ SUBSCRIPTIONS : has
    USERS ||--o{ MICROTRANSACTIONS : has
    USERS ||--o{ BETS : places
    
    SUBSCRIPTIONS {
        string id
        string userId
        string planId
        date startDate
        date endDate
        boolean active
    }
    
    MICROTRANSACTIONS {
        string id
        string userId
        string productId
        string itemId
        date purchaseDate
        boolean used
    }
    
    BETS {
        string id
        string userId
        string type
        string itemId
        number odds
        number stake
        number potentialPayout
        date placedDate
        string status
    }
```

## API Integration

```mermaid
graph LR
    subgraph "App Services"
        UFCS[UFCService]
        HRS[HorseRacingService]
    end
    
    subgraph "API Layer"
        UFCA[UFC API Config]
        HRA[Horse Racing API Config]
    end
    
    subgraph "External APIs"
        Sherdog[Sherdog API]
        OddsAPI[Odds API]
        HRAPI[Horse Racing API]
    end
    
    UFCS --> UFCA
    HRS --> HRA
    UFCA --> Sherdog
    UFCA --> OddsAPI
    HRA --> HRAPI
    
    classDef service fill:#3498db,stroke:#2980b9,color:white;
    classDef config fill:#f1c40f,stroke:#f39c12,color:white;
    classDef api fill:#e74c3c,stroke:#c0392b,color:white;
    
    class UFCS,HRS service;
    class UFCA,HRA config;
    class Sherdog,OddsAPI,HRAPI api;
```

These architectural diagrams provide a visual representation of the system components, data flow, and relationships for the MMA round betting and horse racing features. They can be used as a reference during implementation to ensure that all components are properly integrated and that the data flows correctly through the system.