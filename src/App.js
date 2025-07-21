import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { PantryProvider } from './context/PantryContext';

// Import only the screens we need for MVP
import CookbookScreen from './screens/CookbookScreen';
import PantryScreen from './screens/PantryScreen';
import PantryQuizScreen from './screens/PantryQuizScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function PantryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PantryMain" component={PantryScreen} />
      <Stack.Screen name="PantryQuiz" component={PantryQuizScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Pantry') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cookbook') {
            iconName = focused ? 'book' : 'book-outline';
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
      <Tab.Screen name="Pantry" component={PantryStack} />
      <Tab.Screen name="Cookbook" component={CookbookScreen} />
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