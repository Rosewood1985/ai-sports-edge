# Organisms

Organisms are sophisticated components that integrate molecules and/or atoms to create distinct, self-contained sections of the interface or application logic.

## What belongs here:

- **Complex UI components**: navigation bars, forms, comment systems, product cards
- **Service modules**: complete service implementations (auth, API, database)
- **Feature controllers**: components that manage feature-specific logic and state
- **Context providers**: providers that supply data and functionality to component trees
- **Data managers**: modules that handle complex data operations

## Guidelines:

1. Organisms should represent a complete, self-contained piece of functionality
2. Organisms should compose molecules and atoms together
3. Organisms can maintain complex state and side effects
4. Organisms should have clear boundaries and interfaces
5. Organisms should be focused on a specific domain or feature
6. Organisms can be specific to a feature but should be reusable within that feature