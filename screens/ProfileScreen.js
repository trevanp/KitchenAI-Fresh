import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../components/DesignSystem';
import { usePantry } from '../PantryContext';

const user = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  bio: 'Food enthusiast and home cook. I love trying new recipes and experimenting with different cuisines.',
  dietary: 'Vegetarian',
  profilePic: null, // Placeholder
};

// Helper functions for formatting user preferences
const formatMenuType = (menuType) => {
  const menuTypeLabels = {
    'vegetarian': 'Vegetarian',
    'vegan': 'Vegan',
    'keto': 'Keto',
    'paleo': 'Paleo',
    'mediterranean': 'Mediterranean',
    'low_carb': 'Low-Carb',
    'gluten_free': 'Gluten-Free',
    'standard': 'Standard Diet'
  };
  
  return menuTypeLabels[menuType] || 'Custom Diet';
};

const formatServingSize = (servingSize, servingType) => {
  if (servingType === 'custom') {
    return `Serves ${servingSize} people`;
  }
  
  const servingLabels = {
    'individual': 'Serves 1 person',
    'couple': 'Serves 2 people',
    'small_family': 'Serves 3-4 people',
    'large_family': 'Serves 5+ people'
  };
  
  return servingLabels[servingType] || `Serves ${servingSize} people`;
};

export default function ProfileScreen({ navigation }) {
  const { quizCompleted, quizData } = usePantry();
  const [user] = useState({
    name: 'Kitchen Explorer',
    email: 'user@example.com',
    profilePic: null,
    joinDate: 'January 2024',
    recipesCreated: 12,
    recipesCooked: 47,
    // User preferences (mock data - would come from EditProfileScreen)
    menuType: 'vegetarian',
    servingSize: 4,
    servingType: 'small_family',
    allergies: ['nuts', 'dairy'],
    dislikes: ['mushrooms', 'cilantro', 'olives'],
  });

  // Refresh quiz state when Profile screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 ProfileScreen focused - checking quiz completion status');
      console.log('📊 Current quiz state:', { quizCompleted, quizData });
      
      // Check if quiz was completed by looking at pantry items or user profile
      // For now, we'll assume quiz is completed if there are pantry items
      // In a real app, you'd check the user's profile data
      
      // Don't clear quiz state here - let the context manage it
      // The quiz state should persist if the user actually completed it
      
    }, [quizCompleted, quizData])
  );

  const handlePantryQuiz = () => {
    navigation.navigate('PantryQuiz');
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', {
      currentProfile: user
    });
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings feature coming soon!');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Help and support feature coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Edit Icon */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.editProfileIcon} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {user.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.profilePic} />
            ) : (
              <View style={styles.profilePicPlaceholder}>
                <Ionicons name="person" size={40} color={COLORS.primary} />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          
          {/* User Preferences Section */}
          <View style={styles.userPreferences}>
            {user.menuType && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceIcon}>🥬</Text>
                <Text style={styles.preferenceText}>{formatMenuType(user.menuType)}</Text>
              </View>
            )}
            
            {user.servingSize && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceIcon}>🍽️</Text>
                <Text style={styles.preferenceText}>{formatServingSize(user.servingSize, user.servingType)}</Text>
              </View>
            )}
            
            {user.allergies && user.allergies.length > 0 && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceIcon}>🚫</Text>
                <Text style={styles.preferenceText}>
                  Allergic to: {user.allergies.join(', ')}
                </Text>
              </View>
            )}
            
            {user.dislikes && user.dislikes.length > 0 && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceIcon}>👎</Text>
                <Text style={styles.preferenceText}>
                  Dislikes: {user.dislikes.slice(0, 3).join(', ')}
                  {user.dislikes.length > 3 && ` +${user.dislikes.length - 3} more`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.recipesCreated}</Text>
              <Text style={styles.statLabel}>Your Recipes Uploaded</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.recipesCooked}</Text>
              <Text style={styles.statLabel}>Recipes Cooked</Text>
            </View>
          </View>
        </View>

        {/* Pantry Quiz Card */}
        <View style={styles.quizCard}>
          <View style={styles.quizHeader}>
            <Ionicons 
              name={quizCompleted ? "checkmark-circle" : "bulb-outline"} 
              size={24} 
              color={quizCompleted ? "#10B981" : COLORS.primary} 
            />
            <Text style={styles.quizTitle}>
              {quizCompleted ? 'Pantry Analysis Complete' : 'Smart Pantry Discovery'}
            </Text>
          </View>
          <Text style={styles.quizDescription}>
            {quizCompleted 
              ? `Quiz completed on ${new Date(quizData?.completedAt).toLocaleDateString()}. Your pantry is now optimized for better recipe suggestions!`
              : 'Take a quick quiz to help us understand what you already have in your kitchen. This will make recipe suggestions much more accurate!'
            }
          </Text>
          <TouchableOpacity 
            style={[styles.quizButton, quizCompleted && styles.quizButtonCompleted]} 
            onPress={handlePantryQuiz}
          >
            <Ionicons 
              name={quizCompleted ? "refresh" : "play"} 
              size={20} 
              color={COLORS.white} 
            />
            <Text style={styles.quizButtonText}>
              {quizCompleted ? 'Retake Quiz' : 'Start Pantry Quiz'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
            <Text style={styles.menuItemText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.textPrimary} />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: 24, 
    marginBottom: 10, 
    paddingHorizontal: 24,
  },
  headerTitle: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary, 
    flex: 1,
    textAlign: 'center',
  },
  editProfileIcon: {
    padding: 8,
    borderRadius: 8,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 28,
    ...SHADOWS.default,
  },
  profileImageContainer: { alignItems: 'center', marginBottom: 18 },
  profilePic: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.background },
  profilePicPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 2 },
  userEmail: { fontSize: 15, color: COLORS.textSecondary },
  joinDate: { fontSize: 15, color: COLORS.textSecondary },
  userPreferences: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  preferenceIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  preferenceText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },

  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 28,
    ...SHADOWS.default,
  },
  statsTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 6, textAlign: 'left' },
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  statItem: { 
    alignItems: 'center',
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  statNumber: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary, 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 14, 
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  quizCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 28,
    ...SHADOWS.default,
  },
  quizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  quizTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginLeft: 10 },
  quizDescription: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 10 },
  quizButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  quizButtonText: { fontSize: 15, fontWeight: 'bold', color: COLORS.white },
  quizButtonCompleted: { backgroundColor: '#10B981' },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 28,
    ...SHADOWS.default,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: { fontSize: 15, color: COLORS.textPrimary, marginLeft: 10 },
}); 