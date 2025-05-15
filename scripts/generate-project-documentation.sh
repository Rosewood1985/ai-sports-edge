#!/bin/bash
# generate-project-documentation.sh
# Master script to generate comprehensive project documentation for AI Sports Edge
# Created: May 11, 2025

# Set up output directory
OUTPUT_DIR="docs/project-analysis"
mkdir -p "$OUTPUT_DIR"

echo "Generating comprehensive project documentation for AI Sports Edge..."

# Make all analysis scripts executable
chmod +x scripts/analyze-project-structure.sh
chmod +x scripts/analyze-development-history.sh
chmod +x scripts/generate-api-documentation.sh
chmod +x scripts/analyze-component-relationships.sh

# Run all analysis scripts
echo "Step 1: Analyzing project structure..."
./scripts/analyze-project-structure.sh

echo "Step 2: Analyzing development history..."
./scripts/analyze-development-history.sh

echo "Step 3: Generating API documentation..."
./scripts/generate-api-documentation.sh

echo "Step 4: Analyzing component relationships..."
./scripts/analyze-component-relationships.sh

# Create master documentation index
echo "Creating master documentation index..."

cat > "$OUTPUT_DIR/README.md" << 'EOL'
# AI Sports Edge Project Documentation

**Generated:** $(date)

## Overview

This documentation provides a comprehensive analysis of the AI Sports Edge project, including:

- Project structure and architecture
- Component relationships and inventory
- API documentation for services and functions
- Development history and evolution
- Technical debt analysis
- External dependencies

## Documentation Sections

1. [Project Structure Analysis](./00-MASTER-INDEX.md)
2. [API Documentation](./api-documentation.md)
3. [Component Inventory](./component-inventory.md)
4. [Development History](./development-history.md)
5. [Architectural Overview](./architectural-overview.md)

## How to Use This Documentation

This documentation is designed to help developers understand the AI Sports Edge codebase and architecture. It provides insights into:

- How components are organized and related
- How services and functions are implemented
- How the project has evolved over time
- Areas that may need improvement or refactoring

## Updating This Documentation

To update this documentation, run the following command:

```bash
./scripts/generate-project-documentation.sh
```

This will regenerate all documentation based on the current state of the codebase.

## Best Practices

When working with the AI Sports Edge codebase, consider the following best practices:

1. **Follow Atomic Design Principles**: Organize components as atoms, molecules, and organisms
2. **Use TypeScript**: Prefer TypeScript over JavaScript for better type safety
3. **Document Your Code**: Add JSDoc comments to functions and components
4. **Write Tests**: Ensure code changes are covered by tests
5. **Keep Dependencies Updated**: Regularly update external dependencies
6. **Follow the Established Patterns**: Maintain consistency with existing code

## Project Structure

The AI Sports Edge project follows a specific directory structure:

- `/scripts` - CLI and automation scripts
- `/functions` - Firebase Cloud Functions
- `/public` - Static assets
- `/status` - Logs and status reports
- `/tasks` - Task and changelog files
- `/docs` - Technical and user documentation
- `/src` - React Native and web frontend code
- `/atomic` - Atomic design components
- `/components` - React components
- `/screens` - React Native screens
- `/services` - Service modules
- `/utils` - Utility functions
- `/hooks` - React hooks
- `/contexts` - React contexts
- `/api` - API endpoints
EOL

# Update the date in the README
sed -i.bak "s/\$(date)/$(date)/" "$OUTPUT_DIR/README.md"
rm "$OUTPUT_DIR/README.md.bak"

# Create a technical debt summary
echo "Creating technical debt summary..."

cat > "$OUTPUT_DIR/technical-debt-summary.md" << 'EOL'
# Technical Debt Summary

**Generated:** $(date)

## Overview

This document summarizes the technical debt identified in the AI Sports Edge project. Technical debt represents aspects of the codebase that may need improvement, refactoring, or modernization.

## Key Areas of Technical Debt

### 1. JavaScript to TypeScript Migration

The codebase is in the process of migrating from JavaScript to TypeScript. Some files still use JavaScript, which lacks type safety and can lead to runtime errors.

**Recommendation:** Complete the migration of all JavaScript files to TypeScript.

### 2. Component Structure

Some components are not fully aligned with the atomic design methodology. This can lead to inconsistencies in the UI and make it harder to maintain the codebase.

**Recommendation:** Refactor components to follow atomic design principles (atoms, molecules, organisms).

### 3. Documentation Gaps

Some parts of the codebase lack proper documentation, making it harder for new developers to understand the code.

**Recommendation:** Add JSDoc comments to all exported functions, classes, and interfaces.

### 4. Test Coverage

Test coverage is incomplete, particularly for newer features and components.

**Recommendation:** Increase test coverage, focusing on critical components and services.

### 5. Deprecated API Usage

Some parts of the codebase use deprecated APIs, which may cause issues in the future.

**Recommendation:** Replace deprecated APIs with modern alternatives.

### 6. Console Logs

There are numerous console.log statements throughout the codebase, which should be removed in production code.

**Recommendation:** Replace console.log statements with proper logging mechanisms or remove them entirely.

### 7. Code Duplication

There are instances of code duplication, particularly in utility functions and UI components.

**Recommendation:** Extract duplicated code into shared functions or components.

## Detailed Analysis

For a more detailed analysis of technical debt, see:

- [Technical Debt Analysis](./technical-debt-analysis.md)
- [Component Complexity Analysis](./component-inventory.md#component-complexity)

## Prioritization

Based on the analysis, the following areas should be prioritized for technical debt reduction:

1. Complete TypeScript migration
2. Remove console.log statements
3. Improve test coverage
4. Refactor complex components
5. Update deprecated APIs

## Action Plan

1. Create a technical debt backlog
2. Allocate time in each sprint for technical debt reduction
3. Set up automated tools to detect and prevent new technical debt
4. Regularly review and update this technical debt summary
EOL

# Update the date in the technical debt summary
sed -i.bak "s/\$(date)/$(date)/" "$OUTPUT_DIR/technical-debt-summary.md"
rm "$OUTPUT_DIR/technical-debt-summary.md.bak"

# Create a dependencies summary
echo "Creating dependencies summary..."

cat > "$OUTPUT_DIR/dependencies-summary.md" << 'EOL'
# External Dependencies Summary

**Generated:** $(date)

## Overview

This document summarizes the external dependencies used in the AI Sports Edge project. External dependencies include npm packages, third-party services, and APIs.

## Core Dependencies

### React Native and Expo

The project is built using React Native with Expo, which provides a framework for building cross-platform mobile applications.

### Firebase

Firebase is used for various backend services:

- **Authentication**: User authentication and management
- **Firestore**: NoSQL database for storing application data
- **Cloud Functions**: Serverless functions for backend logic
- **Analytics**: User behavior tracking
- **Remote Config**: Feature flags and configuration

### Stripe

Stripe is used for payment processing:

- **Subscription Management**: Handling recurring subscriptions
- **One-Time Payments**: Processing one-time purchases
- **Payment Intents**: Secure payment processing
- **Customer Management**: Managing customer information

### Other Key Dependencies

- **React Navigation**: Navigation between screens
- **i18next**: Internationalization (English/Spanish)
- **OneSignal**: Push notifications
- **Axios**: HTTP client for API requests
- **Redux**: State management (if applicable)

## Dependency Management

### Version Control

Dependencies are managed through package.json and yarn.lock/package-lock.json files.

### Update Strategy

Dependencies should be updated regularly to ensure security and access to new features. The update process should include:

1. Reviewing release notes for breaking changes
2. Testing updates in a development environment
3. Updating dependencies incrementally rather than all at once

### Security Considerations

- Regular security audits using `npm audit` or similar tools
- Monitoring for security advisories related to dependencies
- Keeping dependencies up-to-date to address security vulnerabilities

## Third-Party Services

### API Integrations

- **Sports Data APIs**: For odds and betting information
- **Payment Gateways**: Stripe and potentially others
- **Analytics Services**: For tracking user behavior
- **Push Notification Services**: OneSignal

### Service Dependencies

- **Firebase Project**: Configuration and setup
- **Stripe Account**: API keys and webhook configuration
- **OneSignal Account**: API keys and configuration

## Detailed Analysis

For a more detailed analysis of dependencies, see:

- [Dependencies Analysis](./dependencies-analysis.md)

## Recommendations

1. **Dependency Consolidation**: Review and consolidate similar dependencies
2. **Regular Updates**: Establish a schedule for dependency updates
3. **Monitoring**: Set up monitoring for security advisories
4. **Documentation**: Keep documentation of third-party service integrations up-to-date
EOL

# Update the date in the dependencies summary
sed -i.bak "s/\$(date)/$(date)/" "$OUTPUT_DIR/dependencies-summary.md"
rm "$OUTPUT_DIR/dependencies-summary.md.bak"

echo "Comprehensive project documentation generation complete. Documentation available in $OUTPUT_DIR"
echo "Main index: $OUTPUT_DIR/README.md"