import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../components/DesignSystem';

const { width } = Dimensions.get('window');

export default function EditProfileScreen({ navigation, route }) {
  const { currentProfile } = route.params || {};
  
  // Profile state
  const [profile, setProfile] = useState({
    displayName: currentProfile?.name || 'Kitchen Explorer',
    email: currentProfile?.email || 'user@example.com',
    profilePhoto: currentProfile?.profilePic || null,
    menuType: 'standard',
    allergies: [],
    foodDislikes: [],
    mealSize: 'couple',
    customMealSize: 2,
  });

  // UI state
  const [uploading, setUploading] = useState(false);
  const [dislikeInput, setDislikeInput] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');

  // Menu type options
  const menuTypes = [
    { id: 'standard', label: 'Standard', description: 'All foods' },
    { id: 'vegetarian', label: 'Vegetarian', description: 'No meat' },
    { id: 'vegan', label: 'Vegan', description: 'No animal products' },
    { id: 'keto', label: 'Keto', description: 'Low carb, high fat' },
    { id: 'paleo', label: 'Paleo', description: 'Whole foods only' },
    { id: 'mediterranean', label: 'Mediterranean', description: 'Heart-healthy' },
    { id: 'low_carb', label: 'Low-Carb', description: 'Reduced carbohydrates' },
    { id: 'gluten_free', label: 'Gluten-Free', description: 'No gluten' },
    { id: 'other', label: 'Other', description: 'Custom diet' }
  ];

  // Common allergies
  const commonAllergies = [
    { id: 'nuts', label: 'Nuts', icon: '🥜' },
    { id: 'dairy', label: 'Dairy', icon: '🥛' },
    { id: 'eggs', label: 'Eggs', icon: '🥚' },
    { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
    { id: 'soy', label: 'Soy', icon: '🫘' },
    { id: 'gluten', label: 'Gluten', icon: '🌾' },
    { id: 'fish', label: 'Fish', icon: '🐟' },
    { id: 'sesame', label: 'Sesame', icon: '🫰' }
  ];

  // Meal size options
  const mealSizes = [
    { id: 'individual', label: 'Individual', people: 1, description: 'Perfect for one' },
    { id: 'couple', label: 'Couple', people: 2, description: 'Great for two' },
    { id: 'small_family', label: 'Small Family', people: 4, description: '3-4 people' },
    { id: 'large_family', label: 'Large Family', people: 6, description: '5+ people' },
    { id: 'custom', label: 'Custom', people: profile.customMealSize, description: 'Your choice' }
  ];

  const handlePhotoUpload = async () => {
    setUploading(true);
    try {
      // Simulate photo upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockPhotoUrl = 'https://via.placeholder.com/150';
      setProfile(prev => ({ ...prev, profilePhoto: mockPhotoUrl }));
      Alert.alert('Success', 'Profile photo updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const toggleAllergy = (allergyId) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergyId)
        ? prev.allergies.filter(id => id !== allergyId)
        : [...prev.allergies, allergyId]
    }));
  };

  const addFoodDislike = () => {
    if (dislikeInput.trim() && !profile.foodDislikes.includes(dislikeInput.trim())) {
      setProfile(prev => ({
        ...prev,
        foodDislikes: [...prev.foodDislikes, dislikeInput.trim()]
      }));
      setDislikeInput('');
    }
  };

  const removeFoodDislike = (dislike) => {
    setProfile(prev => ({
      ...prev,
      foodDislikes: prev.foodDislikes.filter(d => d !== dislike)
    }));
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !profile.allergies.includes(customAllergy.trim())) {
      setProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, customAllergy.trim()]
      }));
      setCustomAllergy('');
    }
  };

  const saveProfile = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const cancelEdit = () => {
    Alert.alert(
      'Cancel Changes',
      'Are you sure you want to cancel? Your changes will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={cancelEdit} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Profile Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <TouchableOpacity 
            style={styles.photoUploadArea} 
            onPress={handlePhotoUpload}
            disabled={uploading}
          >
            {profile.profilePhoto ? (
              <Image source={{ uri: profile.profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={48} color={COLORS.primary} />
                <Text style={styles.photoPlaceholderText}>Upload Photo</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <Ionicons name="hourglass" size={24} color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={profile.displayName}
              onChangeText={(text) => setProfile(prev => ({ ...prev, displayName: text }))}
              placeholder="Enter your display name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={profile.email}
              onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Eating Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eating Preferences</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Menu Type</Text>
            <View style={styles.menuTypeGrid}>
              {menuTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.menuTypeOption,
                    profile.menuType === type.id && styles.menuTypeOptionSelected
                  ]}
                  onPress={() => setProfile(prev => ({ ...prev, menuType: type.id }))}
                >
                  <View style={styles.menuTypeContent}>
                    <Text style={[
                      styles.menuTypeLabel,
                      profile.menuType === type.id && styles.menuTypeLabelSelected
                    ]}>
                      {type.label}
                    </Text>
                    <Text style={[
                      styles.menuTypeDescription,
                      profile.menuType === type.id && styles.menuTypeDescriptionSelected
                    ]}>
                      {type.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Allergies & Restrictions</Text>
            <View style={styles.allergiesGrid}>
              {commonAllergies.map(allergy => (
                <TouchableOpacity
                  key={allergy.id}
                  style={[
                    styles.allergyOption,
                    profile.allergies.includes(allergy.id) && styles.allergyOptionSelected
                  ]}
                  onPress={() => toggleAllergy(allergy.id)}
                >
                  <Text style={styles.allergyIcon}>{allergy.icon}</Text>
                  <Text style={[
                    styles.allergyLabel,
                    profile.allergies.includes(allergy.id) && styles.allergyLabelSelected
                  ]}>
                    {allergy.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Custom Allergy Input */}
            <View style={styles.customAllergyInput}>
              <TextInput
                style={styles.textInput}
                value={customAllergy}
                onChangeText={setCustomAllergy}
                placeholder="Add custom allergy..."
                onSubmitEditing={addCustomAllergy}
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addCustomAllergy}
              >
                <Ionicons name="add" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Food Dislikes</Text>
            <View style={styles.dislikesInputWrapper}>
              <TextInput
                style={styles.dislikesInput}
                value={dislikeInput}
                onChangeText={setDislikeInput}
                placeholder="Search and add foods you don't like..."
                onSubmitEditing={addFoodDislike}
              />
              <TouchableOpacity 
                style={styles.addDislikeButton}
                onPress={addFoodDislike}
              >
                <Text style={styles.addDislikeButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dislikesTags}>
              {profile.foodDislikes.map(dislike => (
                <View key={dislike} style={styles.dislikeTag}>
                  <Text style={styles.dislikeTagText}>{dislike}</Text>
                  <TouchableOpacity 
                    onPress={() => removeFoodDislike(dislike)}
                    style={styles.removeTagButton}
                  >
                    <Ionicons name="close" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Default Meal Size</Text>
            <View style={styles.mealSizeOptions}>
              {mealSizes.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.mealSizeOption,
                    profile.mealSize === option.id && styles.mealSizeOptionSelected
                  ]}
                  onPress={() => setProfile(prev => ({ 
                    ...prev, 
                    mealSize: option.id,
                    customMealSize: option.people
                  }))}
                >
                  <View style={styles.mealSizeContent}>
                    <Text style={[
                      styles.mealSizeLabel,
                      profile.mealSize === option.id && styles.mealSizeLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.mealSizeDescription,
                      profile.mealSize === option.id && styles.mealSizeDescriptionSelected
                    ]}>
                      {option.description}
                    </Text>
                    {option.id === 'custom' && profile.mealSize === 'custom' && (
                      <View style={styles.customSizeInput}>
                        <Text style={styles.customSizeLabel}>people</Text>
                        <TextInput
                          style={styles.customSizeNumberInput}
                          value={profile.customMealSize.toString()}
                          onChangeText={(text) => setProfile(prev => ({ 
                            ...prev, 
                            customMealSize: parseInt(text) || 1 
                          }))}
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  photoUploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    position: 'relative',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoPlaceholderText: {
    marginTop: SPACING.sm,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  formGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  menuTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  menuTypeOption: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    minWidth: (width - 80) / 2 - SPACING.sm,
    marginBottom: SPACING.sm,
  },
  menuTypeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondaryLight,
  },
  menuTypeContent: {
    alignItems: 'center',
  },
  menuTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  menuTypeLabelSelected: {
    color: COLORS.primary,
  },
  menuTypeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  menuTypeDescriptionSelected: {
    color: COLORS.primary,
  },
  allergiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  allergyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    minWidth: 80,
  },
  allergyOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  allergyIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  allergyLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  allergyLabelSelected: {
    color: COLORS.white,
  },
  customAllergyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dislikesInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dislikesInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: 16,
  },
  addDislikeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  addDislikeButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  dislikesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dislikeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  dislikeTagText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  removeTagButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  mealSizeOptions: {
    gap: SPACING.sm,
  },
  mealSizeOption: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
  },
  mealSizeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondaryLight,
  },
  mealSizeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealSizeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  mealSizeLabelSelected: {
    color: COLORS.primary,
  },
  mealSizeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  mealSizeDescriptionSelected: {
    color: COLORS.primary,
  },
  customSizeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  customSizeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  customSizeNumberInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
}); 