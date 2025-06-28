# KitchenAI - Smart Kitchen Assistant

A React Native Expo app that helps you manage your kitchen inventory, discover recipes based on your pantry, and plan meals efficiently.

## Features

- **Pantry Management**: Scan receipts, barcodes, or manually add items to your pantry
- **Recipe Discovery**: Find recipes based on ingredients you have using Spoonacular API
- **Smart OCR**: Extract grocery items from receipt photos using Google Vision API
- **Recipe Collection**: Save and organize your favorite recipes
- **Meal Planning**: Plan your meals for the week (coming soon)
- **User Profile**: Manage your preferences and settings (coming soon)

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs)
- **Icons**: Expo Vector Icons (Ionicons)
- **Image Processing**: Expo Image Picker & Image Manipulator
- **OCR**: Google Vision API
- **Recipe API**: Spoonacular API
- **Design System**: Custom components with consistent styling

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **Expo Go** app on your mobile device - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/KitchenAI-Fresh.git
cd KitchenAI-Fresh
```

### 2. Install Dependencies

```bash
npm install
# or if using yarn:
# yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
touch .env
```

Add your API keys to the `.env` file:

```env
# Google Vision API Key (for receipt scanning)
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# Spoonacular API Key (for recipe discovery)
SPOONACULAR_API_KEY=your_spoonacular_api_key_here
```

### 4. Get API Keys

#### Google Vision API (Optional - for receipt scanning)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Cloud Vision API
4. Create credentials (API Key)
5. Add the key to your `.env` file

#### Spoonacular API (Required - for recipe discovery)
1. Go to [Spoonacular](https://spoonacular.com/food-api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add the key to your `.env` file

### 5. Start the Development Server

```bash
npx expo start
```

### 6. Run on Your Device

1. Open the **Expo Go** app on your phone
2. Scan the QR code displayed in your terminal
3. The app will load on your device

## Project Structure

```
KitchenAI-Fresh/
├── components/
│   └── DesignSystem.js          # Shared design system components
├── screens/
│   ├── ExploreScreen.js         # Recipe discovery
│   ├── CookbookScreen.js        # Saved recipes
│   ├── MealPlanScreen.js        # Meal planning (placeholder)
│   ├── PantryScreen.js          # Inventory management
│   └── ProfileScreen.js         # User profile (placeholder)
├── App.js                       # Main app component with navigation
├── ocrService.js               # Google Vision API integration
├── .env                        # Environment variables (create this)
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Available Scripts

- `npx expo start` - Start the development server
- `npx expo start --clear` - Clear cache and start server
- `npx expo start --tunnel` - Start with tunnel for external access

## Development Workflow

### Making Changes
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test on your device
4. Commit your changes: `git commit -m "Add your feature description"`
5. Push to GitHub: `git push origin feature/your-feature-name`
6. Create a Pull Request

### Code Style
- Use the design system components from `components/DesignSystem.js`
- Follow the existing color scheme and typography
- Keep components modular and reusable
- Add comments for complex logic

## Troubleshooting

### Common Issues

**"Unable to resolve module" errors**
```bash
npx expo start --clear
```

**Metro bundler issues**
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

**Expo Go connection issues**
- Ensure your phone and computer are on the same WiFi network
- Try using tunnel mode: `npx expo start --tunnel`

**API key issues**
- Verify your `.env` file is in the root directory
- Check that API keys are correct and active
- Restart the development server after adding new environment variables

### Getting Help

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Review [React Native documentation](https://reactnative.dev/)
3. Search existing issues in the GitHub repository
4. Create a new issue with detailed error information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Team

- **Trevan** - Project Lead & Development
- **Cole** - Development & Testing

---

**Happy coding! 🍳👨‍🍳** 