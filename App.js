import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screen components
import ExploreScreen from './screens/ExploreScreen';
import CookbookScreen from './screens/CookbookScreen';
import MealPlanScreen from './screens/MealPlanScreen';
import PantryScreen from './screens/PantryScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Cookbook" component={CookbookScreen} />
        <Tab.Screen name="Meal Plan" component={MealPlanScreen} />
        <Tab.Screen name="Pantry" component={PantryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}