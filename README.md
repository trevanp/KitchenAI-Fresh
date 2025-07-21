# 🍽️ KitchenAI Fresh - Streamlined MVP

A clean, modern React Native app for smart pantry management with AI-powered features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platforms
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## 📱 Features

- **Smart Pantry Management**: Add, search, and organize pantry items
- **Receipt OCR**: Scan grocery receipts to automatically add items
- **Pantry Quiz**: Quick setup wizard to populate your pantry
- **Clean Design**: Intuitive interface with modern design system

## 📂 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── DesignSystem.js  # Design tokens & base components
│   └── RecipeCard.js    # Recipe display component
├── screens/             # Screen components
│   ├── PantryScreen.js  # Main pantry management
│   ├── CookbookScreen.js # Saved recipes
│   └── PantryQuizScreen.js # Onboarding quiz
├── context/             # React Context providers
│   └── PantryContext.js # Global pantry state
├── services/            # API services & utilities
│   └── ocrService.js    # Google Vision OCR integration
└── App.js              # Main app component

assets/                  # Static images & icons
docs/                   # Documentation
├── setup/              # API configuration guides
└── guides/             # Implementation guides
```

## 🛠️ Configuration

### Required API Keys

1. **Google Vision API** (for receipt OCR)
   - See `docs/setup/GOOGLE_VISION_API_SETUP.md`

2. **Expo Camera** (for photo capture)
   - Automatically configured in Expo

### Environment Setup

Create a `.env` file in the root directory:

```env
GOOGLE_VISION_API_KEY=your_api_key_here
```

## 🎯 Core Technologies

- **React Native** + **Expo** for cross-platform development
- **React Navigation** for navigation
- **React Context** for state management
- **Google Vision API** for OCR functionality
- **Expo Camera** for image capture

## 📖 Development

### Code Style
- Clean, readable component structure
- Centralized design system
- Consistent naming conventions
- Modular architecture

### Key Components
- `DesignSystem.js`: Contains all design tokens (colors, typography, spacing)
- `PantryContext.js`: Global state management for pantry items
- `ocrService.js`: Handles receipt scanning and text extraction

## 📋 Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
```

## 🔧 Troubleshooting

### Common Issues

1. **Metro bundler cache**: Run `expo start -c` to clear cache
2. **Node modules**: Delete `node_modules` and run `npm install`
3. **OCR not working**: Check your Google Vision API key in `.env`

### Performance Tips

- Use `react-native-reanimated` for smooth animations
- Optimize images in the `assets/` folder
- Implement proper list virtualization for large datasets

## 📚 Documentation

- **Setup Guides**: `docs/setup/` - API configuration instructions
- **Implementation Guides**: `docs/guides/` - Feature implementation details

## 🎨 Design System

The app uses a consistent design system defined in `src/components/DesignSystem.js`:

- **Colors**: Primary (#DC2626), success, error, and neutral tones
- **Typography**: Responsive text styles for all screen sizes
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl)
- **Components**: Reusable UI components (Button, Card, Header, etc.)

## 🤝 Contributing

1. Follow the existing file structure
2. Use the design system for consistent styling
3. Write clean, commented code
4. Test on both iOS and Android

---

Built with ❤️ using React Native and Expo 