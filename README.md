# AI Sports Edge

AI Sports Edge is a mobile application that provides sports analytics, predictions, and betting insights powered by AI.

## Features

- Advanced sports analytics and statistics
- AI-powered predictions for games and player performance
- Microtransactions for premium features
- Multi-language support (English, Spanish)
- Dark mode support
- User profiles and preferences

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/ai-sports-edge.git
cd ai-sports-edge
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Follow the instructions in the terminal to open the app on your device or emulator.

## Project Structure

```
ai-sports-edge/
├── assets/              # Static assets (images, fonts)
├── components/          # Reusable UI components
├── config/              # Configuration files
├── contexts/            # React Context providers
├── docs/                # Documentation
├── navigation/          # Navigation configuration
├── screens/             # App screens
├── services/            # API and business logic
├── translations/        # Language translation files
├── utils/               # Utility functions
├── App.tsx              # Main app component
└── package.json         # Project dependencies
```

## Key Features Documentation

### Multi-Language Support

The app supports multiple languages with an easy-to-use language selection system. See [Language System Documentation](docs/language-system.md) for details on:

- How to use translations in components
- Adding new translations
- Adding new languages
- RTL language support
- Best practices

### Microtransaction System

The app includes a sophisticated microtransaction system for monetization. Key features include:

- Frequency control to prevent overwhelming users
- Enhanced error handling and retry mechanisms
- Purchase history tracking
- Server-side validation

### Theme Support

The app supports both light and dark themes, automatically switching based on device settings.

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow the React Native community guidelines
- Use functional components with hooks
- Document complex functions and components

### Adding New Features

1. Create components in the `components/` directory
2. Add screens in the `screens/` directory
3. Update navigation in `navigation/AppNavigator.tsx`
4. Add translations for all supported languages

### Testing

Run tests with:
```bash
npm test
# or
yarn test
```

## Deployment

### Building for Production

```bash
expo build:android  # For Android
expo build:ios      # For iOS
```

### Publishing Updates

```bash
expo publish
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Expo](https://expo.dev/) - React Native framework
- [React Navigation](https://reactnavigation.org/) - Navigation library
- [i18n-js](https://github.com/fnando/i18n-js) - Internationalization library
