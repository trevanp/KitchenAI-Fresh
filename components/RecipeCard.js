import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming 
} from 'react-native-reanimated';
import { COLORS, SHADOWS } from './DesignSystem';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function RecipeCard({ recipe, onPress, onFavorite, pantryItems = [] }) {
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleFavorite = () => {
    heartScale.value = withSpring(1.3, {}, () => {
      heartScale.value = withSpring(1);
    });
    onFavorite?.(recipe);
  };

  // Calculate ingredient availability
  const getIngredientAvailability = () => {
    if (!recipe.extendedIngredients || !pantryItems.length) {
      return { available: 0, total: 0, percentage: 0 };
    }

    const available = recipe.extendedIngredients.filter(ingredient => {
      const normalizedIngredientName = ingredient.name.toLowerCase().trim();
      return pantryItems.some(item => {
        const normalizedItemName = item.name.toLowerCase().trim();
        return normalizedItemName.includes(normalizedIngredientName) || 
               normalizedIngredientName.includes(normalizedItemName);
      });
    }).length;

    const total = recipe.extendedIngredients.length;
    const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

    return { available, total, percentage };
  };

  const availability = getIngredientAvailability();
  const getAvailabilityColor = () => {
    if (availability.percentage >= 80) return '#10B981';
    if (availability.percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getAvailabilityText = () => {
    if (availability.percentage >= 80) return 'Ready to Cook!';
    if (availability.percentage >= 50) return 'Almost Ready';
    return 'Missing Ingredients';
  };

  return (
    <AnimatedTouchable
      style={[styles.card, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: recipe.image }} style={styles.image} />
        
        {/* Availability Badge */}
        <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor() }]}>
          <Text style={styles.availabilityText}>{getAvailabilityText()}</Text>
        </View>
        
        <AnimatedTouchable 
          style={[styles.favoriteButton, heartAnimatedStyle]}
          onPress={handleFavorite}
        >
          <Ionicons 
            name={recipe.isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={recipe.isFavorite ? "#FF6B6B" : "#fff"} 
          />
        </AnimatedTouchable>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{recipe.readyInMinutes || recipe.cookTime || 'N/A'} min</Text>
          </View>
          
          <View style={styles.difficultyContainer}>
            <Ionicons name="star-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{recipe.difficulty || 'Easy'}</Text>
          </View>
        </View>
        
        {/* Ingredient Availability Bar */}
        <View style={styles.availabilityContainer}>
          <View style={styles.availabilityBar}>
            <View 
              style={[
                styles.availabilityFill, 
                { 
                  width: `${availability.percentage}%`,
                  backgroundColor: getAvailabilityColor()
                }
              ]} 
            />
          </View>
          <Text style={styles.availabilityPercentage}>
            {availability.percentage}% ingredients available
          </Text>
        </View>
        
        {/* Used Ingredients Info */}
        {recipe.usedIngredientCount && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsLabel}>Uses {recipe.usedIngredientCount} of your ingredients</Text>
          </View>
        )}
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  availabilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  availabilityContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  availabilityBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  availabilityPercentage: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  ingredientsContainer: {
    marginTop: 8,
  },
  ingredientsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
}); 