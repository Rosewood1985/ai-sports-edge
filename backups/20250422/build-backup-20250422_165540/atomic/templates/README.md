# Templates

Templates are page-level structures that define layouts without specific content. They focus on component arrangement rather than content display.

## What belongs here:

- **Screen layouts**: reusable screen structures (e.g., list view, detail view)
- **Layout components**: grid systems, responsive containers
- **Navigation structures**: tab layouts, drawer layouts, stack navigators
- **Data flow patterns**: containers that define data flow but not specific implementations
- **Feature scaffolds**: structures that define how features are composed

## Guidelines:

1. Templates should focus on structure and layout, not specific content
2. Templates should be highly reusable across different features
3. Templates should compose organisms, molecules, and atoms
4. Templates should handle responsive behavior and layout adaptation
5. Templates should define clear slots or props for content injection
6. Templates should not contain business logic specific to a feature