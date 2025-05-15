# Molecules

Molecules are cohesive groupings of atoms that function as unified components with moderate complexity.

## What belongs here:

- **Composite UI components**: search forms, input groups, card components
- **Service functions**: functions that combine multiple atomic operations
- **Feature-specific utilities**: utilities that serve specific features
- **Compound hooks**: hooks that combine multiple simpler hooks
- **Data transformers**: functions that transform data between formats

## Guidelines:

1. Molecules should have a single responsibility but may be more complex than atoms
2. Molecules should primarily compose atoms together
3. Molecules should not depend on organisms
4. Molecules should be reusable across different features
5. Molecules can maintain internal state but should be controlled via props