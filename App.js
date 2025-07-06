import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './components/DesignSystem';
import { PantryProvider, usePantry } from './PantryContext';
import 'react-native-gesture-handler';

// Import screen components
import ExploreScreen from './screens/ExploreScreen';
import CookbookScreen from './screens/CookbookScreen';
import MealPlanScreen from './screens/MealPlanScreen';
import PantryScreen from './screens/PantryScreen';
import ProfileScreen from './screens/ProfileScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import PantryQuizScreen from './screens/PantryQuizScreen';
import QuizResultsScreen from './screens/QuizResultsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ExploreMain" 
        component={ExploreScreenWrapper} 
      />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="PantryQuiz" component={PantryQuizScreen} />
      <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
    </Stack.Navigator>
  );
}

function ExploreScreenWrapper() {
  const { pantryItems } = usePantry();
  return <ExploreScreen pantryItems={pantryItems} />;
}

function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Explore') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Cookbook') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Meal Plan') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Pantry') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: Math.max(insets.bottom, 16),
          paddingTop: 5,
          height: 60 + Math.max(insets.bottom, 16),
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Cookbook" component={CookbookScreen} />
      <Tab.Screen name="Pantry" component={PantryScreen} />
      <Tab.Screen name="Meal Plan" component={MealPlanScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PantryProvider>
        <NavigationContainer>
          <AppTabs />
        </NavigationContainer>
      </PantryProvider>
    </SafeAreaProvider>
  );
}