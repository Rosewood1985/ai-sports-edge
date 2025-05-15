# AI Sports Edge Project

## Project Overview

AI Sports Edge is a React Native (Expo) app using atomic architecture. The app provides AI-powered sports analytics, predictions, and betting insights to users.

## Architecture

The project follows the atomic design methodology, organizing components into:

- **Atoms**: Basic building blocks (buttons, inputs, icons)
- **Molecules**: Simple combinations of atoms (form fields, cards)
- **Organisms**: Complex UI components (headers, forms, sections)
- **Templates**: Page layouts without specific content
- **Pages**: Specific instances of templates with real content

## Key Technologies

- **Frontend**: React Native (Expo)
- **State Management**: React Context API
- **Backend**: Firebase (Authentication, Firestore, Functions, Storage)
- **Payment Processing**: Stripe
- **Deployment**: SFTP to GoDaddy (aisportsedge.app)
- **CI/CD**: GitHub Actions

## Project Structure

```
ai-sports-edge/
├── atomic/                # Atomic architecture components
│   ├── atoms/             # Basic building blocks
│   ├── molecules/         # Simple combinations of atoms
│   └── organisms/         # Complex UI components
├── components/            # Legacy components (being migrated to atomic)
├── screens/               # App screens
├── services/              # Service layer for API interactions
├── scripts/               # Utility scripts for development and deployment
├── tools/                 # CLI tools and utilities
│   ├── ops.ts             # Central CLI entry point
│   └── utils/             # Reusable helper functions
├── status/                # Status tracking files
├── memory-bank/           # Context-aware memory for development
└── ...
```

## Firebase Atomic Architecture

The Firebase services are being migrated to follow the atomic architecture pattern:

- **atoms**: Basic Firebase configuration and types
- **molecules**: Individual Firebase service modules (auth, firestore, functions, etc.)
- **organisms**: Main Firebase service that composes molecules

### Migration Status

The Firebase migration status is tracked in:
- `status/firebase-atomic-migration.md`
- `status/firebase-migration-progress.md`

## CLI Tools

The project includes a centralized CLI tool for managing operations:

```bash
# Firebase migration commands
npx ops firebase:migrate           # Run the complete migration process
npx ops firebase:migrate --file=path/to/file.ts  # Migrate a specific file
npx ops firebase:status            # Check migration status
npx ops firebase:tag --retro       # Retroactively tag migrated files
npx ops firebase:consolidate -o output.ts -i input1.ts input2.ts  # Consolidate files
npx ops firebase:accelerate        # Accelerate migration process

# Memory bank commands
npx ops memory:update              # Update memory bank
npx ops memory:checkpoint          # Create memory bank checkpoint

# Deployment commands
npx ops deploy                     # Deploy to all targets
npx ops deploy --target=firebase   # Deploy to Firebase only
npx ops deploy --target=godaddy    # Deploy to GoDaddy only
```

## Development Workflow

1. **Feature Development**:
   - Create feature branch from main
   - Implement feature following atomic architecture
   - Run tests and linting
   - Create PR for review

2. **Firebase Migration**:
   - Use `npx ops firebase:migrate` to migrate services
   - Update memory bank with `npx ops memory:update`
   - Create checkpoint with `npx ops memory:checkpoint`

3. **Deployment**:
   - Deploy to Firebase with `npx ops deploy --target=firebase`
   - Deploy to GoDaddy with `npx ops deploy --target=godaddy`

## Documentation

- **Memory Bank**: Contains context-aware documentation in Markdown format
- **Status Directory**: Contains status tracking files for various operations
- **Scripts README**: Documentation for utility scripts

## Contact

For questions or issues, contact the development team.