import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../components/DesignSystem';

const { width } = Dimensions.get('window');

// Reduced to only the most important filter tags
const TAGS = ['Quick', 'Healthy', 'Vegetarian', 'Italian', 'Chicken', 'Spicy'];

const TAG_COLORS = {
  Quick: '#A3E635',
  Healthy: '#22D3EE',
  Vegetarian: '#4ADE80',
  Italian: '#F87171',
  Chicken: '#FBBF24',
  Spicy: '#F87171',
};

// No dummy data - only user-saved recipes will appear here
const savedRecipes = [];

export default function CookbookScreen() {
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState([]);

  const handleTagPress = tag => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const handleRemoveTag = tag => {
    setActiveTags(prev => prev.filter(t => t !== tag));
  };

  // Filter recipes by active tags
  const filteredRecipes = activeTags.length === 0
    ? savedRecipes
    : savedRecipes.filter(r => r.tags.some(tag => activeTags.includes(tag)));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.header}>My Cookbook</Text>
        
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* Filter Tags */}
        <View style={styles.tagsContainer}>
          {TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, activeTags.includes(tag) && styles.tagActive]}
              onPress={() => handleTagPress(tag)}
            >
              <Text style={[styles.tagText, activeTags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Tag Chips (with X) */}
        {activeTags.length > 0 && (
          <View style={styles.activeTagsRow}>
            {activeTags.map(tag => (
              <View key={tag} style={[styles.activeTagChip, { backgroundColor: TAG_COLORS[tag] || COLORS.primary }] }>
                <Text style={styles.activeTagText}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Ionicons name="close" size={16} color="#fff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Recipe Cards - Single Column */}
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="book-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateTitle}>No saved recipes yet</Text>
            <Text style={styles.emptyStateText}>
              Explore recipes and save your favorites to build your personal cookbook!
            </Text>
          </View>
        ) : (
          <View style={styles.recipesContainer}>
            {filteredRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.recipeCard}>
                <Image source={{ uri: recipe.image }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{recipe.title}</Text>
                    <View style={[styles.statusBadge, recipe.status === 'Can Make' ? styles.statusCanMake : recipe.status === 'Almost Can Make' ? styles.statusAlmost : styles.statusMissing]}>
                      <Text style={styles.statusBadgeText}>{recipe.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDescription}>{recipe.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  header: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary, 
    marginTop: 32, 
    marginBottom: 24, 
    marginLeft: 24 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    padding: 0,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  tag: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tagText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  tagTextActive: {
    color: COLORS.primaryDark,
  },
  activeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 10,
  },
  activeTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeTagText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  recipesContainer: {
    marginHorizontal: 24,
  },
  recipeCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...SHADOWS.large,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 0,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusCanMake: { backgroundColor: '#10B981' },
  statusAlmost: { backgroundColor: '#F59E0B' },
  statusMissing: { backgroundColor: '#EF4444' },
  statusBadgeText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 13 
  },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    zIndex: 10,
  },
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 