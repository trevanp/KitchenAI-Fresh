import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { usePantry } from '../PantryContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { extractTextFromImage, getOcrStatus, testApiKey } from '../ocrService';
import { GOOGLE_VISION_API_KEY } from '@env';
import {
  Header,
  SearchBar,
  FilterButton,
  FilterRow,
  Button,
  Card,
  LoadingState,
  EmptyState,
  Badge,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../components/DesignSystem';
import { processReceiptImage } from '../ocrService';
import openaiService from '../services/openaiService';
import smartPantry from '../services/smartPantrySystem';
import GroceryListScreen from './GroceryListScreen';

// No dummy data - only user-added items will appear here
const sampleItems = [];

// New 12-category pantry system with icons and colors
const FOOD_GROUPS = {
  'Produce': { icon: '🥬', color: '#22C55E', backgroundColor: '#F0FDF4' },
  'Protein': { icon: '🥩', color: '#F87171', backgroundColor: '#FEF2F2' },
  'Dairy': { icon: '🥛', color: '#60A5FA', backgroundColor: '#EFF6FF' },
  'Grains & Breads': { icon: '🍞', color: '#8B5CF6', backgroundColor: '#F5F3FF' },
  'Canned & Jarred Goods': { icon: '🥫', color: '#F59E0B', backgroundColor: '#FFFBEB' },
  'Baking & Flours': { icon: '🧁', color: '#EC4899', backgroundColor: '#FDF2F8' },
  'Spices & Seasonings': { icon: '🧂', color: '#A855F7', backgroundColor: '#FAF5FF' },
  'Oils, Vinegars & Fats': { icon: '🫒', color: '#F97316', backgroundColor: '#FFF7ED' },
  'Condiments & Sauces': { icon: '🍯', color: '#EAB308', backgroundColor: '#FEFCE8' },
  'Frozen': { icon: '🧊', color: '#06B6D4', backgroundColor: '#ECFEFF' },
  'Snacks & Treats': { icon: '🍿', color: '#10B981', backgroundColor: '#ECFDF5' },
  'Drinks & Beverages': { icon: '🥤', color: '#6366F1', backgroundColor: '#EEF2FF' },
};

// Mock receipt scan results
const mockReceiptItems = [
  { id: 'r1', name: 'Whole Milk', category: 'Dairy & Eggs', quantity: '1 gallon', checked: true },
  { id: 'r2', name: 'Bread', category: 'Grains & Starches', quantity: '1 loaf', checked: true },
  { id: 'r3', name: 'Bananas', category: 'Produce', quantity: '1 bunch', checked: true },
  { id: 'r4', name: 'Eggs', category: 'Dairy & Eggs', quantity: '1 dozen', checked: true },
  { id: 'r5', name: 'Chicken Breast', category: 'Proteins', quantity: '2 lbs', checked: true },
];

// Mock barcode product data
const mockBarcodeProduct = {
  name: 'Whole Milk',
  category: 'Dairy & Eggs',
  image: null, // Would be product image URL
  defaultQuantity: '1 gallon'
};

const categories = [
  'All',
  'Produce',
  'Protein',
  'Dairy',
  'Grains & Breads',
  'Canned & Jarred Goods',
  'Baking & Flours',
  'Spices & Seasonings',
  'Oils, Vinegars & Fats',
  'Condiments & Sauces',
  'Frozen',
  'Snacks & Treats',
  'Drinks & Beverages',
  'Other'
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Migration mapping from old categories to new categories
const CATEGORY_MIGRATION_MAP = {
  // Direct mappings
  'Proteins': 'Protein',
  'Grains & Starches': 'Grains & Breads',
  'Dairy & Eggs': 'Dairy',
  'Pantry Staples': 'Canned & Jarred Goods',
  'Condiments & Seasonings': 'Spices & Seasonings',
  'Oils & Vinegars': 'Oils, Vinegars & Fats',
  'Baking': 'Baking & Flours',
  
  // Fallback mappings for any other old categories
  'Produce': 'Produce', // No change
  'Spices': 'Spices & Seasonings',
  'Oils': 'Oils, Vinegars & Fats',
  'Vinegars': 'Oils, Vinegars & Fats',
  'Fats': 'Oils, Vinegars & Fats',
  'Flours': 'Baking & Flours',
  'Baking Supplies': 'Baking & Flours',
  'Canned Goods': 'Canned & Jarred Goods',
  'Jarred Goods': 'Canned & Jarred Goods',
  'Sauces': 'Condiments & Sauces',
  'Condiments': 'Condiments & Sauces',
  'Snacks': 'Snacks & Treats',
  'Treats': 'Snacks & Treats',
  'Beverages': 'Drinks & Beverages',
  'Drinks': 'Drinks & Beverages',
  'Frozen Foods': 'Frozen',
  'Frozen Items': 'Frozen',
};

// Function to migrate old category names to new ones
const migrateCategory = (oldCategory) => {
  if (!oldCategory) return 'Produce'; // Default fallback
  
  const newCategory = CATEGORY_MIGRATION_MAP[oldCategory];
  if (newCategory) {
    return newCategory;
  }
  
  // If no direct mapping, try to intelligently assign based on category name
  const lowerCategory = oldCategory.toLowerCase();
  
  if (lowerCategory.includes('meat') || lowerCategory.includes('chicken') || lowerCategory.includes('beef') || lowerCategory.includes('fish')) {
    return 'Protein';
  }
  if (lowerCategory.includes('dairy') || lowerCategory.includes('milk') || lowerCategory.includes('cheese') || lowerCategory.includes('egg')) {
    return 'Dairy';
  }
  if (lowerCategory.includes('grain') || lowerCategory.includes('bread') || lowerCategory.includes('pasta') || lowerCategory.includes('rice')) {
    return 'Grains & Breads';
  }
  if (lowerCategory.includes('can') || lowerCategory.includes('jar') || lowerCategory.includes('preserved')) {
    return 'Canned & Jarred Goods';
  }
  if (lowerCategory.includes('bake') || lowerCategory.includes('flour') || lowerCategory.includes('sugar') || lowerCategory.includes('spice')) {
    return 'Baking & Flours';
  }
  if (lowerCategory.includes('oil') || lowerCategory.includes('vinegar') || lowerCategory.includes('fat')) {
    return 'Oils, Vinegars & Fats';
  }
  if (lowerCategory.includes('sauce') || lowerCategory.includes('condiment') || lowerCategory.includes('dressing')) {
    return 'Condiments & Sauces';
  }
  if (lowerCategory.includes('frozen') || lowerCategory.includes('ice')) {
    return 'Frozen';
  }
  if (lowerCategory.includes('snack') || lowerCategory.includes('treat') || lowerCategory.includes('candy')) {
    return 'Snacks & Treats';
  }
  if (lowerCategory.includes('drink') || lowerCategory.includes('beverage') || lowerCategory.includes('juice')) {
    return 'Drinks & Beverages';
  }
  
  return 'Produce'; // Default fallback
};

// Removed expiration-related functions for cleaner UI

export default function PantryScreen({ navigation, route }) {
  const { 
    pantryItems, 
    addPantryItem, 
    removePantryItem, 
    updatePantryItem, 
    quizCompleted,
    essentialsEnabled,
    essentialsStats,
    toggleEssentials,
    getAllAvailableIngredients
  } = usePantry();
  const items = pantryItems; // Use pantry items from context
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showStats, setShowStats] = useState(true);
  
  // Unified modal state management
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [optimizedImage, setOptimizedImage] = useState(null);
  
  // AI-powered features
  const [aiInsights, setAiInsights] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Load AI insights when pantry items change
  useEffect(() => {
    loadPantryInsights();
  }, [items]);
  const [imageOptimizing, setImageOptimizing] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);
  const [barcodeProcessing, setBarcodeProcessing] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [barcodeQuantity, setBarcodeQuantity] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Full-screen image viewer state
  const [fullScreenImageVisible, setFullScreenImageVisible] = useState(false);
  const [fullScreenImageUri, setFullScreenImageUri] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Produce',
    quantity: '',
    expirationDate: '',
    notes: ''
  });

  const [groceryListVisible, setGroceryListVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [highlightNewItems, setHighlightNewItems] = useState(false);
  const [newlyAddedItems, setNewlyAddedItems] = useState([]);
  const [bannerVisible, setBannerVisible] = useState(false);
  const bannerAnimation = useRef(new Animated.Value(-100)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Swipe-to-delete state
  const [deletedItems, setDeletedItems] = useState([]);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoToastAnimation] = useState(new Animated.Value(0));

  // Handle route parameters for success messages
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = route?.params;
      console.log('📱 PantryScreen focus - route params:', params);
      
      if (params?.showSuccessMessage) {
        console.log('🎉 Showing success banner with message:', params.message);
        setSuccessMessage(params.message || 'Items added successfully!');
        setHighlightNewItems(params.highlightNewItems || false);
        setShowSuccessMessage(true);
        setBannerVisible(true);
        
        // Animate banner in
        Animated.parallel([
          Animated.timing(bannerAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(bannerOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Clear the params after handling
        navigation.setParams({});
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          console.log('⏰ Auto-hiding success banner');
          // Animate banner out
          Animated.parallel([
            Animated.timing(bannerAnimation, {
              toValue: -100,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(bannerOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setBannerVisible(false);
            setShowSuccessMessage(false);
            setSuccessMessage('');
            setHighlightNewItems(false);
          });
        }, 3000);
      }
    });

    return unsubscribe;
  }, [navigation, route, bannerAnimation, bannerOpacity]);

  // Highlight newly added items when coming from quiz
  useEffect(() => {
    if (highlightNewItems) {
      // Get items added in the last 2 minutes (from quiz)
      const recentItems = pantryItems.filter(item => {
        const addedTime = new Date(item.addedAt);
        const now = new Date();
        const diffMinutes = (now - addedTime) / (1000 * 60);
        return diffMinutes < 2; // Items added in last 2 minutes
      });
      
      setNewlyAddedItems(recentItems.map(item => item.id));
      
      // Start pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      // Remove highlight after 5 seconds
      setTimeout(() => {
        pulse.stop();
        setNewlyAddedItems([]);
        pulseAnimation.setValue(1);
      }, 5000);
    }
  }, [highlightNewItems, pantryItems, pulseAnimation]);

  // Cleanup undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }
    };
  }, [undoTimeout]);

  // Calculate pantry statistics (simplified without expiration)
  const calculateStats = () => {
    // Add safety check for combinedItems
    if (!combinedItems || !Array.isArray(combinedItems)) {
      console.warn('combinedItems is not available for stats calculation');
      return {
        total: 0,
        lowQuantity: 0
      };
    }
    
    const lowQuantityItems = combinedItems.filter(item => {
      const qty = parseInt(item.quantity);
      return !isNaN(qty) && qty <= 2;
    });

    return {
      total: combinedItems.length,
      lowQuantity: lowQuantityItems.length
    };
  };

  const stats = calculateStats();

  // Get combined items (user items + essentials when enabled)
  const getCombinedItems = () => {
    console.log('🔍 getCombinedItems - essentialsEnabled:', essentialsEnabled);
    console.log('🔍 getCombinedItems - user items count:', items ? items.length : 'undefined');
    
    // Ensure items is always an array and migrate categories
    const safeItems = (items || []).map(item => ({
      ...item,
      category: migrateCategory(item.category) // Apply migration to existing items
    }));
    
    if (!essentialsEnabled) {
      console.log('🔍 Essentials disabled, returning user items only');
      return safeItems;
    }
    
    try {
      // Get essentials from the service
      const { PANTRY_ESSENTIALS } = require('../services/pantryEssentialsService');
      
      // Create essential items with proper formatting and updated categories
      const essentialItems = PANTRY_ESSENTIALS.map(essential => ({
        ...essential,
        id: `essential_${essential.name.toLowerCase().replace(/\s+/g, '_')}`,
        isEssential: true,
        source: 'pantry_essentials',
        addedAt: new Date().toISOString(),
        daysUntilExpiration: null, // Essentials don't expire
        category: migrateCategory(essential.category) // Apply migration to essentials
      }));
      
      // Combine user items with essentials, avoiding duplicates
      const userItemNames = safeItems.map(item => item.name.toLowerCase());
      const uniqueEssentials = essentialItems.filter(essential => 
        !userItemNames.includes(essential.name.toLowerCase())
      );
      
      console.log('🔍 Essential items count:', essentialItems.length);
      console.log('🔍 Unique essentials to add:', uniqueEssentials.length);
      console.log('🔍 Combined items count:', safeItems.length + uniqueEssentials.length);
      
      return [...safeItems, ...uniqueEssentials];
    } catch (error) {
      console.error('🔍 Error in getCombinedItems:', error);
      return safeItems; // Return user items only if essentials fail
    }
  };

  const combinedItems = getCombinedItems() || [];
  
  // Debug logging
  console.log('🔍 PANTRY DEBUG ===');
  console.log('🔍 items:', items);
  console.log('🔍 items type:', typeof items);
  console.log('🔍 items is array:', Array.isArray(items));
  console.log('🔍 combinedItems:', combinedItems);
  console.log('🔍 combinedItems type:', typeof combinedItems);
  console.log('🔍 combinedItems is array:', Array.isArray(combinedItems));
  console.log('🔍 ==================');

  // Group items by category
  const groupedItems = (combinedItems || []).reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
  
  // Ensure categories are displayed in the correct order
  const orderedCategories = [
    'Produce',
    'Protein', 
    'Dairy',
    'Grains & Breads',
    'Canned & Jarred Goods',
    'Baking & Flours',
    'Spices & Seasonings',
    'Oils, Vinegars & Fats',
    'Condiments & Sauces',
    'Frozen',
    'Snacks & Treats',
    'Drinks & Beverages'
  ];
  
  // Create ordered grouped items object
  const orderedGroupedItems = {};
  orderedCategories.forEach(category => {
    if (groupedItems[category]) {
      orderedGroupedItems[category] = groupedItems[category];
    }
  });
  
  // Add any remaining categories that weren't in the ordered list
  Object.keys(groupedItems).forEach(category => {
    if (!orderedCategories.includes(category)) {
      orderedGroupedItems[category] = groupedItems[category];
    }
  });

  // Sort items within each category by expiration urgency
  Object.keys(groupedItems).forEach(category => {
    if (groupedItems[category] && Array.isArray(groupedItems[category])) {
      groupedItems[category].sort((a, b) => {
        if (a.daysUntilExpiration === null && b.daysUntilExpiration === null) return 0;
        if (a.daysUntilExpiration === null) return 1;
        if (b.daysUntilExpiration === null) return -1;
        return a.daysUntilExpiration - b.daysUntilExpiration;
      });
    }
  });

  const toggleSection = (category) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Produce',
      quantity: '',
      expirationDate: '',
      notes: ''
    });
    setEditingItem(null);
  };

  const closeAllModals = () => {
    setCurrentModal(null);
    setSelectedImage(null);
    setOptimizedImage(null);
    setImageLoading(false);
    setImageOptimizing(false);
    setImageError(null);
    setReceiptProcessing(false);
    setReceiptItems([]);
    setBarcodeProcessing(false);
    setBarcodeProduct(null);
    setBarcodeQuantity('');
    setFullScreenImageVisible(false);
    setFullScreenImageUri(null);
    resetForm();
  };

  const openSmartInputModal = () => {
    console.log('Opening smart input modal');
    setAddItemModalVisible(true);
  };

  const handleScanReceipt = () => {
    setAddItemModalVisible(false);
    setCurrentModal('receiptScan');
    // Reset any previous state
    setSelectedImage(null);
    setOptimizedImage(null);
    setImageError(null);
    setReceiptItems([]);
  };

  const handleScanBarcode = () => {
    setAddItemModalVisible(false);
    setCurrentModal('barcodeScan');
    // Reset any previous state
    setBarcodeProduct(null);
    setBarcodeQuantity('');
  };

  const handleEnterManually = () => {
    setAddItemModalVisible(false);
    setManualEntryVisible(true);
    resetForm();
  };

  const handleTakePantryQuiz = () => {
    setAddItemModalVisible(false);
    
    if (quizCompleted) {
      // Show retake confirmation
      Alert.alert(
        'Retake Pantry Quiz?',
        'You\'ve already completed the pantry quiz. Taking it again will add new items to your existing pantry.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retake Quiz',
            style: 'default',
            onPress: () => {
              navigation.navigate('PantryQuiz', { 
                source: 'plus_menu_retake',
                returnTo: 'pantry',
                isRetake: true
              });
            }
          }
        ]
      );
    } else {
      // Navigate to quiz for first time
      navigation.navigate('PantryQuiz', { 
        source: 'plus_menu',
        returnTo: 'pantry'
      });
    }
  };

  // AI-powered pantry insights
  const loadPantryInsights = async () => {
    if (!aiEnabled || items.length === 0) return;
    
    setIsAiLoading(true);
    try {
      const insights = await openaiService.getPantryInsights(items);
      setAiInsights(insights);
      console.log('🤖 Pantry insights loaded:', insights);
    } catch (error) {
      console.log('🤖 AI insights unavailable:', error.message);
      setAiEnabled(false);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Smart pantry categorization
  const smartCategorizeItem = async (itemName) => {
    if (!aiEnabled || !itemName || itemName.length < 2) return null;
    
    try {
      const validation = await smartPantry.validateAndCategorizeItem(itemName);
      console.log('🤖 Smart categorization:', validation);
      return validation;
    } catch (error) {
      console.log('🤖 Smart categorization failed:', error.message);
      return null;
    }
  };

  const suggestCategory = (itemName) => {
    const name = itemName.toLowerCase();
    
    // Produce
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
        name.includes('tomato') || name.includes('lettuce') || name.includes('carrot') ||
        name.includes('onion') || name.includes('garlic') || name.includes('potato') ||
        name.includes('broccoli') || name.includes('spinach') || name.includes('cucumber') ||
        name.includes('pepper') || name.includes('mushroom') || name.includes('celery')) {
      return 'Produce';
    }
    
    // Protein
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
        name.includes('fish') || name.includes('salmon') || name.includes('tofu') ||
        name.includes('turkey') || name.includes('lamb') || name.includes('shrimp') ||
        name.includes('bacon') || name.includes('ham') || name.includes('sausage')) {
      return 'Protein';
    }
    
    // Dairy
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') ||
        name.includes('butter') || name.includes('cream') || name.includes('egg') ||
        name.includes('sour cream') || name.includes('cottage cheese') || name.includes('heavy cream')) {
      return 'Dairy';
    }
    
    // Grains & Breads
    if (name.includes('rice') || name.includes('pasta') || name.includes('bread') ||
        name.includes('flour') || name.includes('oat') || name.includes('quinoa') ||
        name.includes('cereal') || name.includes('tortilla') || name.includes('bagel') ||
        name.includes('noodle') || name.includes('couscous')) {
      return 'Grains & Breads';
    }
    
    // Canned & Jarred Goods
    if (name.includes('can') || name.includes('bean') || name.includes('tomato') ||
        name.includes('corn') || name.includes('peas') || name.includes('soup') ||
        name.includes('tuna') || name.includes('sardine') || name.includes('pickle')) {
      return 'Canned & Jarred Goods';
    }
    
    // Baking & Flours
    if (name.includes('sugar') || name.includes('baking') || name.includes('vanilla') ||
        name.includes('chocolate') || name.includes('cocoa') || name.includes('yeast') ||
        name.includes('baking powder') || name.includes('baking soda') || name.includes('cornstarch')) {
      return 'Baking & Flours';
    }
    
    // Spices & Seasonings
    if (name.includes('salt') || name.includes('pepper') || name.includes('spice') ||
        name.includes('herb') || name.includes('cumin') || name.includes('oregano') ||
        name.includes('basil') || name.includes('thyme') || name.includes('paprika')) {
      return 'Spices & Seasonings';
    }
    
    // Oils, Vinegars & Fats
    if (name.includes('oil') || name.includes('vinegar') || name.includes('fat') ||
        name.includes('olive') || name.includes('vegetable oil') || name.includes('sesame oil')) {
      return 'Oils, Vinegars & Fats';
    }
    
    // Condiments & Sauces
    if (name.includes('sauce') || name.includes('ketchup') || name.includes('mustard') ||
        name.includes('mayo') || name.includes('soy sauce') || name.includes('hot sauce') ||
        name.includes('bbq') || name.includes('ranch') || name.includes('dressing')) {
      return 'Condiments & Sauces';
    }
    
    // Frozen
    if (name.includes('frozen') || name.includes('ice cream') || name.includes('popsicle')) {
      return 'Frozen';
    }
    
    // Snacks & Treats
    if (name.includes('chip') || name.includes('cracker') || name.includes('popcorn') ||
        name.includes('candy') || name.includes('chocolate') || name.includes('cookie') ||
        name.includes('nut') || name.includes('trail mix')) {
      return 'Snacks & Treats';
    }
    
    // Drinks & Beverages
    if (name.includes('drink') || name.includes('juice') || name.includes('soda') ||
        name.includes('water') || name.includes('tea') || name.includes('coffee') ||
        name.includes('beer') || name.includes('wine') || name.includes('milk')) {
      return 'Drinks & Beverages';
    }
    
    return 'Produce'; // Default
  };

  const handleItemNameChange = (text) => {
    setFormData(prev => ({
      ...prev,
      name: text
    }));
    
    // Use smart categorization if name is long enough
    if (text.length > 2) {
      smartCategorizeItem(text).then(validation => {
        if (validation && validation.confidence === 'high') {
          setFormData(prev => ({
            ...prev,
            name: validation.corrected_name,
            category: validation.category
          }));
          console.log('🤖 Smart categorization applied:', validation);
        } else {
          // Fallback to basic categorization
          const suggestedCategory = suggestCategory(text);
          setFormData(prev => ({
            ...prev,
            category: suggestedCategory
          }));
        }
      }).catch(error => {
        // Fallback to basic categorization
        const suggestedCategory = suggestCategory(text);
        setFormData(prev => ({
          ...prev,
          category: suggestedCategory
        }));
      });
    }
  };

  const setQuickExpiration = (days) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    setFormData(prev => ({
      ...prev,
      expirationDate: expirationDate.toISOString().split('T')[0]
    }));
  };

  const handleSaveManualItem = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    const newItem = {
      name: formData.name.trim(),
      category: formData.category,
      quantity: formData.quantity.trim(),
      expirationDate: formData.expirationDate || null,
      notes: formData.notes.trim(),
      daysUntilExpiration: formData.expirationDate ? 
        Math.ceil((new Date(formData.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };

    // Check for duplicates
    const existingItem = findDuplicate(newItem, pantryItems);
    
    if (existingItem) {
      if (existingItem.name.toLowerCase() === newItem.name.toLowerCase()) {
        // Exact match - auto-merge
        const mergedQuantity = parseInt(existingItem.quantity || 1) + parseInt(newItem.quantity || 1);
        updatePantryItem(existingItem.id, { 
          quantity: mergedQuantity.toString() 
        });
        setManualEntryVisible(false);
        resetForm();
        Alert.alert('Success', `Updated ${existingItem.name} quantity to ${mergedQuantity}!`);
      } else {
        // Similar item - ask user
        Alert.alert(
          'Similar Item Found',
          `"${existingItem.name}" already exists in your pantry. Would you like to add "${newItem.name}" anyway?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Anyway',
              onPress: () => {
                addPantryItem(newItem);
                setManualEntryVisible(false);
                resetForm();
                Alert.alert('Success', `${newItem.name} added to pantry!`);
              }
            }
          ]
        );
      }
    } else {
      // No duplicate - add normally
      addPantryItem(newItem);
      setManualEntryVisible(false);
      resetForm();
      Alert.alert('Success', `${newItem.name} added to pantry!`);
    }
  };

  const openManualForm = () => {
    console.log('Opening manual form');
    closeAllModals();
    resetForm();
    setCurrentModal('manualForm');
  };

  const openReceiptOptions = () => {
    console.log('Opening receipt options');
    setCurrentModal('receiptOptions');
  };

  const openBarcodeScan = () => {
    console.log('Opening barcode scan');
    closeAllModals();
    setCurrentModal('barcodeScan');
  };

  // Unified image selection function
  const selectImage = async (source) => {
    try {
      console.log('Selecting image from:', source);
      setImageLoading(true);
      setImageError(null);

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Photo library permission is required to select images.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Image selected:', imageUri);
        setSelectedImage(imageUri);
        setCurrentModal('receiptScan');
      }
    } catch (error) {
      console.error('Image selection error:', error);
      setImageError('Failed to select image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const takeReceiptPhoto = () => selectImage('camera');
  const pickImageFromLibrary = () => selectImage('library');

  const processReceipt = async () => {
    try {
      console.log('🔍 RECEIPT DEBUG - Starting receipt processing...');
      setReceiptProcessing(true);
      setImageError(null);

      const imageToProcess = optimizedImage || selectedImage;
      if (!imageToProcess) {
        throw new Error('No image to process');
      }

      console.log('📸 RECEIPT DEBUG - Processing image:', imageToProcess);
      console.log('🔄 RECEIPT DEBUG - Image source:', {
        hasOptimizedImage: !!optimizedImage,
        hasSelectedImage: !!selectedImage,
        usingOptimized: !!optimizedImage
      });

      // Test API key first
      console.log('🧪 RECEIPT DEBUG - Testing API key before processing...');
      const apiTest = await testApiKey();
      console.log('🔑 RECEIPT DEBUG - API test result:', apiTest);

      // Use real Google Vision API OCR
      console.log('🌐 RECEIPT DEBUG - Calling extractTextFromImage...');
      const ocrResult = await extractTextFromImage(imageToProcess);
      
      console.log('📡 RECEIPT DEBUG - OCR result received:', {
        success: ocrResult.success,
        message: ocrResult.message,
        itemsCount: ocrResult.items ? ocrResult.items.length : 0,
        hasDebugInfo: !!ocrResult.debugInfo,
        debugInfo: ocrResult.debugInfo
      });
      
      // Store debug information
      setDebugInfo({
        apiTest: apiTest,
        ocrResult: ocrResult,
        timestamp: new Date().toISOString(),
        imageUri: imageToProcess
      });
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.message || 'Failed to extract text from receipt');
      }

      console.log('✅ RECEIPT DEBUG - OCR successful, extracted items:', ocrResult.items);

      // Convert OCR items to receipt items format with enhanced structure
      const receiptItems = ocrResult.items.map((item, index) => ({
        id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
        name: item.name,
        category: item.category,
        quantity: item.quantity || '1',
        checked: true,
        confidence: item.confidence || 0.8,
        isEditing: false,
        isManual: false
      }));

      console.log('📋 RECEIPT DEBUG - Processed receipt items:', receiptItems);

      if (receiptItems.length === 0) {
        setImageError('No grocery items found in the receipt. Please try a clearer image or add items manually.');
        return;
      }

      setReceiptItems(receiptItems);
      setCurrentModal('results');
      
    } catch (error) {
      console.error('💥 RECEIPT DEBUG - Receipt processing error:', error);
      console.error('💥 RECEIPT DEBUG - Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setImageError(error.message || 'Failed to process receipt. Please try again.');
    } finally {
      setReceiptProcessing(false);
    }
  };

  const retakePhoto = () => {
    setSelectedImage(null);
    setOptimizedImage(null);
    setCurrentModal('receiptScan');
  };

  const scanBarcode = () => {
    // Mock barcode scanning
    setBarcodeProduct(mockBarcodeProduct);
    setBarcodeQuantity(mockBarcodeProduct.defaultQuantity);
    setCurrentModal('barcodeResults');
  };

  const addBarcodeItem = async () => {
    if (barcodeProduct && barcodeQuantity) {
      const newItem = {
        name: barcodeProduct.name,
        category: barcodeProduct.category,
        quantity: barcodeQuantity,
        expirationDate: null,
        notes: '',
        daysUntilExpiration: null
      };

      // Check for duplicates
      const existingItem = findDuplicate(newItem, pantryItems);
      
      if (existingItem) {
        if (existingItem.name.toLowerCase() === newItem.name.toLowerCase()) {
          // Exact match - auto-merge
          const mergedQuantity = parseInt(existingItem.quantity || 1) + parseInt(newItem.quantity || 1);
          updatePantryItem(existingItem.id, { 
            quantity: mergedQuantity.toString() 
          });
          closeAllModals();
          Alert.alert('Success', `Updated ${existingItem.name} quantity to ${mergedQuantity}!`);
        } else {
          // Similar item - ask user
          Alert.alert(
            'Similar Item Found',
            `"${existingItem.name}" already exists in your pantry. Would you like to add "${newItem.name}" anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Add Anyway',
                onPress: () => {
                  addPantryItem(newItem);
                  closeAllModals();
                  Alert.alert('Success', `${newItem.name} added to pantry!`);
                }
              }
            ]
          );
        }
      } else {
        // No duplicate - add normally
        addPantryItem(newItem);
        closeAllModals();
        Alert.alert('Success', `${newItem.name} added to pantry!`);
      }
    }
  };

  // Duplicate detection and handling functions
  const findDuplicate = (newItem, existingItems) => {
    return existingItems.find(existing => {
      // Exact name match (case insensitive)
      if (existing.name.toLowerCase() === newItem.name.toLowerCase()) {
        return true;
      }
      
      // Fuzzy matching for similar items (85% similarity)
      const similarity = calculateSimilarity(existing.name.toLowerCase(), newItem.name.toLowerCase());
      if (similarity > 0.85) {
        return true;
      }
      
      // Category + similar name matching (70% similarity)
      if (existing.category === newItem.category) {
        const nameSimilarity = calculateSimilarity(existing.name.toLowerCase(), newItem.name.toLowerCase());
        if (nameSimilarity > 0.7) {
          return true;
        }
      }
      
      return false;
    });
  };

  const calculateSimilarity = (str1, str2) => {
    if (str1 === str2) return 1.0;
    if (str1.length === 0) return 0.0;
    if (str2.length === 0) return 0.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const processPantryItems = async (newItems, existingPantry) => {
    const mergedItems = [];
    const duplicateActions = [];
    const updates = [];

    // Use smart pantry system to process scanned items
    try {
      const scannedItemNames = newItems.map(item => item.name);
      const smartProcessing = await smartPantry.processScannedIngredients(scannedItemNames);
      
      for (let i = 0; i < newItems.length; i++) {
        const newItem = newItems[i];
        const processed = smartProcessing.processed_items[i];
        
        // Use smart processing results if available
        const processedItem = {
          ...newItem,
          name: processed.corrected_name || newItem.name,
          category: processed.category || newItem.category,
          quantity: processed.quantity || newItem.quantity,
          scanConfidence: processed.confidence
        };
        
        const existingItem = findDuplicate(processedItem, existingPantry);
        
        if (existingItem) {
          // Found duplicate - handle intelligently
          const action = {
            type: 'duplicate_found',
            existing: existingItem,
            new: processedItem,
            suggestedAction: 'merge',
            mergedQuantity: parseInt(existingItem.quantity || 1) + parseInt(processedItem.quantity || 1),
            message: `Found existing "${existingItem.name}". Update quantity from ${existingItem.quantity || 1} to ${parseInt(existingItem.quantity || 1) + parseInt(processedItem.quantity || 1)}?`
          };
          duplicateActions.push(action);
          
          // Auto-merge for exact matches
          if (existingItem.name.toLowerCase() === processedItem.name.toLowerCase()) {
            updates.push({
              id: existingItem.id,
              newQuantity: action.mergedQuantity.toString(),
              addedQuantity: processedItem.quantity
            });
          }
        } else {
          // New item - add to pantry
          mergedItems.push(processedItem);
        }
      }
    } catch (error) {
      console.log('🤖 Smart processing failed, using basic processing:', error.message);
      
      // Fallback to basic processing
      for (const newItem of newItems) {
        const existingItem = findDuplicate(newItem, existingPantry);
        
        if (existingItem) {
          const action = {
            type: 'duplicate_found',
            existing: existingItem,
            new: newItem,
            suggestedAction: 'merge',
            mergedQuantity: parseInt(existingItem.quantity || 1) + parseInt(newItem.quantity || 1),
            message: `Found existing "${existingItem.name}". Update quantity from ${existingItem.quantity || 1} to ${parseInt(existingItem.quantity || 1) + parseInt(newItem.quantity || 1)}?`
          };
          duplicateActions.push(action);
          
          if (existingItem.name.toLowerCase() === newItem.name.toLowerCase()) {
            updates.push({
              id: existingItem.id,
              newQuantity: action.mergedQuantity.toString(),
              addedQuantity: newItem.quantity
            });
          }
        } else {
          mergedItems.push(newItem);
        }
      }
    }

    return { mergedItems, duplicateActions, updates };
  };

  const addReceiptItems = async () => {
    const checkedItems = receiptItems.filter(item => item.checked && item.name.trim());
    
    if (checkedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item with a valid name to add to your pantry.');
      return;
    }

    // Validate items before adding
    const invalidItems = checkedItems.filter(item => !item.name.trim());
    if (invalidItems.length > 0) {
      Alert.alert('Invalid Items', 'Some items have empty names. Please edit or remove them before adding to pantry.');
      return;
    }

    // Process items with duplicate detection
    const itemsToAdd = checkedItems.map(item => {
      const expirationDate = getSmartExpirationDate(item.category);
      const daysUntilExpiration = expirationDate ? 
        Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

      return {
        name: item.name.trim(),
        category: item.category,
        quantity: item.quantity || '1',
        expirationDate: expirationDate,
        notes: item.isManual ? 'Added manually from receipt scan' : 'Added from receipt scan',
        daysUntilExpiration: daysUntilExpiration
      };
    });

    const { mergedItems, duplicateActions, updates } = await processPantryItems(itemsToAdd, pantryItems);

    // Handle duplicates
    if (duplicateActions.length > 0) {
      const duplicateNames = duplicateActions.map(d => d.new.name).join(', ');
      const exactMatches = duplicateActions.filter(d => 
        d.existing.name.toLowerCase() === d.new.name.toLowerCase()
      );
      
      if (exactMatches.length > 0) {
        // Auto-merge exact matches
        exactMatches.forEach(match => {
          updatePantryItem(match.existing.id, { 
            quantity: match.mergedQuantity.toString() 
          });
        });
        
        // Show success message for merged items
        const mergedCount = exactMatches.length;
        const newCount = mergedItems.length;
        
        let message = '';
        if (mergedCount > 0 && newCount > 0) {
          message = `Updated ${mergedCount} existing item${mergedCount > 1 ? 's' : ''} and added ${newCount} new item${newCount > 1 ? 's' : ''} to your pantry.`;
        } else if (mergedCount > 0) {
          message = `Updated ${mergedCount} existing item${mergedCount > 1 ? 's' : ''} in your pantry.`;
        } else {
          message = `Added ${newCount} new item${newCount > 1 ? 's' : ''} to your pantry.`;
        }
        
        Alert.alert('Items Processed Successfully!', message, [
          { text: 'OK', onPress: () => closeAllModals() }
        ]);
      } else {
        // Show confirmation for potential duplicates
        Alert.alert(
          'Duplicate Items Found',
          `The following items may already exist in your pantry: ${duplicateNames}\n\nWould you like to add them anyway?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Anyway',
              onPress: () => {
                // Add all items including potential duplicates
                mergedItems.forEach(item => addPantryItem(item));
                duplicateActions.forEach(action => addPantryItem(action.new));
                
                const totalCount = mergedItems.length + duplicateActions.length;
                Alert.alert(
                  'Items Added Successfully!',
                  `Added ${totalCount} item${totalCount > 1 ? 's' : ''} to your pantry.`,
                  [{ text: 'OK', onPress: () => closeAllModals() }]
                );
              }
            }
          ]
        );
      }
    } else {
      // No duplicates - add all items
      mergedItems.forEach(item => addPantryItem(item));
      
      Alert.alert(
        'Items Added Successfully!',
        `Added ${mergedItems.length} item${mergedItems.length > 1 ? 's' : ''} to your pantry from the receipt scan.`,
        [{ text: 'OK', onPress: () => closeAllModals() }]
      );
    }
  };

  // Smart expiration date assignment based on food category
  const getSmartExpirationDate = (category) => {
    const today = new Date();
    
    switch (category) {
      case 'Produce':
        return new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 7 days
      case 'Dairy':
        return new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 14 days
      case 'Protein':
        return new Date(today.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 5 days
      case 'Grains & Breads':
        return new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 14 days
      case 'Canned & Jarred Goods':
        return new Date(today.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 365 days
      case 'Baking & Flours':
        return new Date(today.getTime() + (180 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 180 days
      case 'Spices & Seasonings':
        return new Date(today.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 365 days
      case 'Oils, Vinegars & Fats':
        return new Date(today.getTime() + (180 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 180 days
      case 'Condiments & Sauces':
        return new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 90 days
      case 'Frozen':
        return new Date(today.getTime() + (180 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 180 days
      case 'Snacks & Treats':
        return new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 90 days
      case 'Drinks & Beverages':
        return new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 30 days
      default:
        return new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 30 days
    }
  };

  const toggleReceiptItem = (itemId) => {
    setReceiptItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const editReceiptItem = (item) => {
    // Set the form data to edit the receipt item
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      expirationDate: '',
      notes: ''
    });
    setEditingItem(item);
    setCurrentModal('manualForm');
  };

  const openEditModal = (item) => {
    // Prevent editing of essential items
    if (item.isEssential || item.source === 'pantry_essentials') {
      Alert.alert(
        'Essential Item',
        'This is a pantry essential and cannot be edited. You can add your own version of this item if needed.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      expirationDate: item.expirationDate || '',
      notes: item.notes || ''
    });
    setCurrentModal('manualForm');
  };

  const saveItem = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    const updatedItem = {
      name: formData.name.trim(),
      category: formData.category,
      quantity: formData.quantity.trim(),
      expirationDate: formData.expirationDate || null,
      notes: formData.notes.trim(),
      daysUntilExpiration: formData.expirationDate ? 
        Math.ceil((new Date(formData.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };

    if (editingItem) {
      updatePantryItem(editingItem.id, updatedItem);
    } else {
      addPantryItem(updatedItem);
    }

    closeAllModals();
  };

  const deleteItem = (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => removePantryItem(itemId)
        }
      ]
    );
  };

  // Swipe-to-delete functions
  const handleSwipeDelete = (item) => {
    // Prevent deletion of essential items
    if (item.isEssential || item.source === 'pantry_essentials') {
      Alert.alert(
        'Essential Item',
        'This is a pantry essential and cannot be deleted. You can disable essentials in the toggle above.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Store the deleted item for potential undo
    const deletedItem = { ...item, deletedAt: new Date() };
    setDeletedItems(prev => [...prev, deletedItem]);
    
    // Remove from pantry
    removePantryItem(item.id);
    
    // Show undo toast
    setShowUndoToast(true);
    Animated.timing(undoToastAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Set timeout for permanent deletion
    const timeout = setTimeout(() => {
      setDeletedItems(prev => prev.filter(di => di.id !== item.id));
      setShowUndoToast(false);
      Animated.timing(undoToastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 5000);
    
    setUndoTimeout(timeout);
  };

  const handleUndo = () => {
    if (deletedItems.length > 0) {
      const lastDeletedItem = deletedItems[deletedItems.length - 1];
      
      // Restore the item
      addPantryItem({
        name: lastDeletedItem.name,
        category: lastDeletedItem.category,
        quantity: lastDeletedItem.quantity,
        notes: lastDeletedItem.notes,
        expirationDate: lastDeletedItem.expirationDate,
        daysUntilExpiration: lastDeletedItem.daysUntilExpiration
      });
      
      // Remove from deleted items
      setDeletedItems(prev => prev.slice(0, -1));
      
      // Clear timeout
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }
      
      // Hide toast
      setShowUndoToast(false);
      Animated.timing(undoToastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const SwipeableItem = ({ item }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const deleteButtonOpacity = useRef(new Animated.Value(0)).current;
    
    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );
    
    const onHandlerStateChange = (event) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const { translationX } = event.nativeEvent;
        
        if (translationX < -100) {
          // Swipe threshold reached, show delete button
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -80,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(deleteButtonOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // Reset position
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(deleteButtonOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    };

    const handleDeletePress = () => {
      handleSwipeDelete(item);
      // Reset position
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(deleteButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const isNewlyAdded = newlyAddedItems.includes(item.id);
    const isEssential = item.isEssential || item.source === 'pantry_essentials';

    const ItemComponent = isNewlyAdded ? Animated.View : View;
    const itemStyle = [
      styles.itemCard,
      isNewlyAdded && styles.newlyAddedItem,
      isEssential && styles.essentialItem,
      isNewlyAdded && {
        transform: [{ scale: pulseAnimation }],
      }
    ];

    return (
      <View style={styles.swipeableContainer}>
        {/* Delete Button Background */}
        <Animated.View 
          style={[
            styles.deleteButton,
            {
              opacity: deleteButtonOpacity,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.deleteButtonTouchable}
            onPress={handleDeletePress}
          >
            <Ionicons name="trash" size={24} color={COLORS.white} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Swipeable Item */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              itemStyle,
              {
                transform: [{ translateX }],
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.itemTouchable}
              onPress={() => openEditModal(item)}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {isEssential && (
                      <View style={styles.essentialBadge}>
                        <Text style={styles.essentialBadgeIcon}>⭐</Text>
                        <Text style={styles.essentialBadgeText}>Essential</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                {/* Removed expiration tags for cleaner UI */}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    return <SwipeableItem item={item} />;
  };

  const renderCategorySection = (category) => {
    const items = orderedGroupedItems[category] || [];
    const isExpanded = expandedSections[category] !== false; // Default to expanded
    const foodGroup = FOOD_GROUPS[category] || { icon: '📦', color: '#6B7280', backgroundColor: '#F9FAFB' };

    if (items.length === 0) {
      return (
        <View key={category} style={styles.categorySection}>
                  <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => toggleSection(category)}
        >
            <View style={styles.categoryHeaderContent}>
              <Text style={styles.categoryIcon}>{foodGroup.icon}</Text>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categoryCount}>0 items</Text>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={foodGroup.color} 
            />
          </TouchableOpacity>
          {isExpanded && (
            <View style={styles.emptyCategory}>
              <Text style={styles.emptyCategoryText}>
                No {category.toLowerCase()} yet - scan your next grocery receipt!
              </Text>
              <TouchableOpacity style={styles.quickAddButton} onPress={openSmartInputModal}>
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.quickAddText}>Quick Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    return (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => toggleSection(category)}
        >
          <View style={styles.categoryHeaderContent}>
            <Text style={styles.categoryIcon}>{foodGroup.icon}</Text>
            <Text style={styles.categoryTitle}>{category}</Text>
            <Text style={styles.categoryCount}>{items.length} items</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={foodGroup.color} 
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.categoryItems}>
            {items.map(item => (
              <View key={item.id}>
                {renderItem({ item })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Success Banner */}
      {bannerVisible && (
        <Animated.View 
          style={[
            styles.successBanner,
            {
              transform: [{ translateY: bannerAnimation }],
              opacity: bannerOpacity,
            }
          ]}
        >
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
            <Text style={styles.successText}>{successMessage}</Text>
            <TouchableOpacity 
              style={styles.closeBanner} 
              onPress={() => {
                // Animate banner out on manual close
                Animated.parallel([
                  Animated.timing(bannerAnimation, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                  Animated.timing(bannerOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  setBannerVisible(false);
                  setShowSuccessMessage(false);
                  setSuccessMessage('');
                  setHighlightNewItems(false);
                });
              }}
            >
              <Ionicons name="close" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Undo Toast */}
      {showUndoToast && (
        <Animated.View 
          style={[
            styles.undoToast,
            {
              opacity: undoToastAnimation,
              transform: [{ translateY: undoToastAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0]
              })}],
            }
          ]}
        >
          <View style={styles.undoToastContent}>
            <Ionicons name="information-circle" size={20} color={COLORS.white} />
            <Text style={styles.undoToastText}>Item deleted</Text>
            <TouchableOpacity 
              style={styles.undoButton}
              onPress={handleUndo}
            >
              <Text style={styles.undoButtonText}>UNDO</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Header - Clean title only */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pantry</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Bar - Moved down with more spacing */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search pantry items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Action Buttons Row - NEW LAYOUT */}
        <View style={styles.pantryActions}>
          <TouchableOpacity 
            style={styles.groceryListBtn}
            onPress={() => setGroceryListVisible(true)}
          >
            <Ionicons name="list" size={16} color="#DC3545" />
            <Text style={styles.groceryListBtnText}>Grocery List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.essentialsToggleBtn,
              essentialsEnabled ? styles.essentialsToggleBtnEnabled : styles.essentialsToggleBtnDisabled
            ]}
            onPress={async () => {
              console.log('🔧 Essentials toggle pressed - current state:', essentialsEnabled);
              const result = await toggleEssentials();
              console.log('🔧 Toggle result:', result);
              
              if (result.success) {
                setSuccessMessage(result.message);
                setShowSuccessMessage(true);
                setBannerVisible(true);
                
                // Animate banner in
                Animated.parallel([
                  Animated.timing(bannerAnimation, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                  Animated.timing(bannerOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                ]).start();
                
                // Auto-hide after 3 seconds
                setTimeout(() => {
                  Animated.parallel([
                    Animated.timing(bannerAnimation, {
                      toValue: -100,
                      duration: 300,
                      useNativeDriver: true,
                    }),
                    Animated.timing(bannerOpacity, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }),
                  ]).start(() => {
                    setBannerVisible(false);
                    setShowSuccessMessage(false);
                    setSuccessMessage('');
                  });
                }, 3000);
              } else {
                Alert.alert('Error', result.message);
              }
            }}
          >
            <Ionicons 
              name={essentialsEnabled ? "star" : "star-outline"} 
              size={16} 
              color={essentialsEnabled ? "#212529" : "#6C757D"} 
            />
            <Text style={[
              styles.essentialsToggleBtnText,
              { color: essentialsEnabled ? "#212529" : "#6C757D" }
            ]}>
              Essentials {essentialsEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Insights Section */}
        {aiInsights && aiInsights.insights && aiInsights.insights.length > 0 && (
          <View style={styles.aiInsightsSection}>
            <View style={styles.aiInsightsHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.primary} />
              <Text style={styles.aiInsightsTitle}>AI Kitchen Insights</Text>
              {isAiLoading && (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
              )}
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.aiInsightsScroll}
            >
              {aiInsights.insights.map((insight, index) => (
                <View key={index} style={[styles.insightCard, styles[`insight${insight.type}`]]}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <Text style={styles.insightText}>{insight.message}</Text>
                </View>
              ))}
            </ScrollView>

            {aiInsights.quick_stats && (
              <View style={styles.quickStatsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{aiInsights.quick_stats.total_possible_meals}</Text>
                  <Text style={styles.statLabel}>Possible Meals</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{aiInsights.quick_stats.expiring_soon}</Text>
                  <Text style={styles.statLabel}>Expiring Soon</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Most Versatile</Text>
                  <Text style={styles.statIngredient}>{aiInsights.quick_stats.most_versatile_ingredient}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Category Sections */}
                  {Object.keys(orderedGroupedItems).length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="basket-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>Your pantry is empty</Text>
              <Text style={styles.emptyStateText}>
                Add items to your pantry to get recipe suggestions and track your ingredients!
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={openSmartInputModal}>
                <Ionicons name="add" size={20} color={COLORS.white} />
                <Text style={styles.emptyStateButtonText}>Add Your First Item</Text>
              </TouchableOpacity>
              
              {/* Helpful tip about essentials */}
              <View style={styles.essentialsTip}>
                <Text style={styles.essentialsTipText}>
                  💡 <Text style={styles.essentialsTipBold}>Tip:</Text> Enable "Essentials" above to add common household items like salt, oil, and eggs automatically!
                </Text>
              </View>
            </View>
          ) : (
          Object.keys(orderedGroupedItems).map(category => renderCategorySection(category))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openSmartInputModal}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Grocery List Modal */}
      <Modal
        visible={groceryListVisible}
        animationType="slide"
        onRequestClose={() => setGroceryListVisible(false)}
      >
        <GroceryListScreen onClose={() => setGroceryListVisible(false)} />
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={addItemModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddItemModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddItemModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Pantry Items</Text>
              <TouchableOpacity 
                onPress={() => setAddItemModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.modalOptions}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleScanReceipt}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Scan Receipt</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleScanBarcode}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="scan-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Scan Barcode</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleEnterManually}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Enter Manually</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleTakePantryQuiz}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="clipboard-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Take Pantry Quiz</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Manual Entry Form Modal */}
      <Modal
        visible={manualEntryVisible}
        animationType="slide"
        onRequestClose={() => setManualEntryVisible(false)}
      >
        <SafeAreaView style={styles.manualEntryContainer}>
          {/* Header */}
          <View style={styles.manualEntryHeader}>
            <TouchableOpacity 
              onPress={() => setManualEntryVisible(false)}
              style={styles.manualEntryBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.manualEntryTitle}>Add Item to Pantry</Text>
            <View style={styles.manualEntrySpacer} />
          </View>

          <ScrollView style={styles.manualEntryScroll} showsVerticalScrollIndicator={false}>
            {/* Item Details Section */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Item Details</Text>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Item Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={handleItemNameChange}
                  placeholder="e.g., Chicken Breast, Apples, Milk"
                  autoCapitalize="words"
                  autoFocus={true}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Quantity</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
                  placeholder="e.g., 2 lbs, 1 dozen, 500g"
                  keyboardType="default"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryPickerContainer}>
                  {[...orderedCategories, 'Other'].map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        formData.category === category && styles.categoryOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category }))}
                    >
                      <Text style={styles.categoryIcon}>
                        {FOOD_GROUPS[category] ? FOOD_GROUPS[category].icon : '📦'}
                      </Text>
                      <Text style={[
                        styles.categoryOptionText,
                        formData.category === category && styles.categoryOptionTextSelected
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Expiration Section */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Expiration</Text>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Expiration Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.expirationDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, expirationDate: text }))}
                  placeholder="YYYY-MM-DD (optional)"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.quickExpirationContainer}>
                <Text style={styles.quickExpirationLabel}>Quick Select:</Text>
                <View style={styles.quickExpirationButtons}>
                  <TouchableOpacity 
                    style={styles.quickExpirationButton}
                    onPress={() => setQuickExpiration(3)}
                  >
                    <Text style={styles.quickExpirationButtonText}>3 days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickExpirationButton}
                    onPress={() => setQuickExpiration(7)}
                  >
                    <Text style={styles.quickExpirationButtonText}>1 week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickExpirationButton}
                    onPress={() => setQuickExpiration(30)}
                  >
                    <Text style={styles.quickExpirationButtonText}>1 month</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Optional Details Section */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Optional Details</Text>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="Brand, storage location, special instructions..."
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.manualEntryFooter}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveManualItem}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Add to Pantry</Text>
            </TouchableOpacity>
          </View>
    </SafeAreaView>
      </Modal>

      {/* Enhanced OCR Results Confirmation Modal */}
      <Modal
        visible={currentModal === 'results'}
        animationType="slide"
        onRequestClose={() => setCurrentModal(null)}
      >
        <SafeAreaView style={styles.ocrResultsContainer}>
          {/* Header */}
          <View style={styles.ocrResultsHeader}>
            <TouchableOpacity 
              onPress={() => setCurrentModal(null)}
              style={styles.ocrResultsCloseButton}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.ocrResultsTitleContainer}>
              <Text style={styles.ocrResultsTitle}>Review Receipt Items</Text>
              <Text style={styles.ocrResultsSubtitle}>Edit or remove items before adding to pantry</Text>
            </View>
            <View style={styles.ocrResultsSpacer} />
          </View>

          <ScrollView style={styles.ocrResultsScroll} showsVerticalScrollIndicator={false}>
            {/* Success Summary */}
            <View style={styles.ocrSuccessSummary}>
              <View style={styles.ocrSuccessIcon}>
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              </View>
              <Text style={styles.ocrSuccessTitle}>Receipt Processed Successfully!</Text>
              <Text style={styles.ocrSuccessText}>
                Found {receiptItems.length} potential items. Review and edit as needed.
              </Text>
            </View>

            {/* Add Manual Item Button */}
            <TouchableOpacity 
              style={styles.addManualItemButton}
              onPress={() => {
                const newItem = {
                  id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: '',
                  category: 'Produce',
                  quantity: '1',
                  checked: true,
                  isEditing: true,
                  isManual: true
                };
                setReceiptItems(prev => [...prev, newItem]);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addManualItemButtonText}>Add Missing Item</Text>
            </TouchableOpacity>

            {/* Items List */}
            <View style={styles.ocrItemsContainer}>
              {receiptItems.map((item, index) => (
                <View key={item.id} style={styles.ocrItemCard}>
                  {/* Item Selection and Main Info */}
                  <View style={styles.ocrItemHeader}>
                    <TouchableOpacity 
                      style={styles.ocrItemCheckbox}
                      onPress={() => toggleReceiptItem(item.id)}
                    >
                      <Ionicons 
                        name={item.checked ? "checkmark-circle" : "ellipse-outline"} 
                        size={24} 
                        color={item.checked ? COLORS.primary : COLORS.textSecondary} 
                      />
                    </TouchableOpacity>
                    
                    <View style={styles.ocrItemMainInfo}>
                      {/* Editable Item Name */}
                      {item.isEditing ? (
                        <TextInput
                          style={styles.ocrItemNameInput}
                          value={item.name}
                          onChangeText={(text) => {
                            setReceiptItems(prev => prev.map(i => 
                              i.id === item.id ? { ...i, name: text } : i
                            ));
                          }}
                          placeholder="Enter item name"
                          placeholderTextColor={COLORS.textSecondary}
                          autoFocus={true}
                          onBlur={() => {
                            setReceiptItems(prev => prev.map(i => 
                              i.id === item.id ? { ...i, isEditing: false } : i
                            ));
                          }}
                        />
                      ) : (
                        <TouchableOpacity 
                          style={styles.ocrItemNameContainer}
                          onPress={() => {
                            setReceiptItems(prev => prev.map(i => 
                              i.id === item.id ? { ...i, isEditing: true } : i
                            ));
                          }}
                        >
                          <Text style={styles.ocrItemName}>{item.name || 'Tap to edit'}</Text>
                          <Ionicons name="create-outline" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      )}
                      
                      {/* Category Selector */}
                      <View style={styles.ocrItemCategoryContainer}>
                        <TouchableOpacity 
                          style={styles.ocrItemCategoryButton}
                          onPress={() => {
                            // Show category picker
                            const categoryOptions = [...orderedCategories, 'Other'];
                            Alert.alert(
                              'Select Category',
                              'Choose a category for this item:',
                              categoryOptions.map(cat => ({
                                text: cat,
                                onPress: () => {
                                  setReceiptItems(prev => prev.map(i => 
                                    i.id === item.id ? { ...i, category: cat } : i
                                  ));
                                }
                              })).concat([{ text: 'Cancel', style: 'cancel' }])
                            );
                          }}
                        >
                          <Text style={styles.ocrItemCategoryText}>{item.category}</Text>
                          <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity 
                      style={styles.ocrItemDeleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Remove Item',
                          'Are you sure you want to remove this item?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Remove', 
                              style: 'destructive',
                              onPress: () => {
                                setReceiptItems(prev => prev.filter(i => i.id !== item.id));
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Item Details */}
                  <View style={styles.ocrItemDetails}>
                    <View style={styles.ocrItemDetailRow}>
                      <Text style={styles.ocrItemDetailLabel}>Quantity:</Text>
                      <TextInput
                        style={styles.ocrItemQuantityInput}
                        value={item.quantity}
                        onChangeText={(text) => {
                          setReceiptItems(prev => prev.map(i => 
                            i.id === item.id ? { ...i, quantity: text } : i
                          ));
                        }}
                        placeholder="1"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    {/* Confidence level removed for cleaner UI */}
                  </View>
                </View>
              ))}
            </View>

            {/* No Items Found */}
            {receiptItems.length === 0 && (
              <View style={styles.ocrNoItemsContainer}>
                <Ionicons name="receipt-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.ocrNoItemsTitle}>No Items Found</Text>
                <Text style={styles.ocrNoItemsText}>
                  We couldn't detect any grocery items in your receipt. Try taking a clearer photo or add items manually.
                </Text>
              </View>
            )}

            {/* Debug Information for OCR Results */}
            <View style={styles.debugSection}>
              <TouchableOpacity 
                style={styles.debugHeader}
                onPress={() => {
                  // Show debug info
                  Alert.alert(
                    'OCR Debug Info',
                    `Items Found: ${receiptItems.length}\nProcessing: ${receiptProcessing ? 'Yes' : 'No'}\nAPI Key: ${GOOGLE_VISION_API_KEY ? 'Configured' : 'Missing'}`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="bug-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.debugHeaderText}>OCR Debug Info</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              <View style={styles.debugContent}>
                <Text style={styles.debugLabel}>Items Detected:</Text>
                <Text style={styles.debugValue}>{receiptItems.length}</Text>
                
                <Text style={styles.debugLabel}>API Key Status:</Text>
                <Text style={styles.debugValue}>
                  {GOOGLE_VISION_API_KEY ? 
                    `Configured (${GOOGLE_VISION_API_KEY.length} chars)` : 
                    'Not configured'
                  }
                </Text>
                
                {debugInfo && (
                  <>
                    <Text style={styles.debugLabel}>API Test Result:</Text>
                    <Text style={styles.debugValue}>
                      {debugInfo.apiTest?.valid ? '✅ Valid' : '❌ Invalid'} - {debugInfo.apiTest?.message}
                    </Text>
                    
                    <Text style={styles.debugLabel}>OCR Success:</Text>
                    <Text style={styles.debugValue}>
                      {debugInfo.ocrResult?.success ? '✅ Yes' : '❌ No'}
                    </Text>
                    
                    <Text style={styles.debugLabel}>OCR Message:</Text>
                    <Text style={styles.debugValue} numberOfLines={2}>
                      {debugInfo.ocrResult?.message || 'No message'}
                    </Text>
                    
                    {debugInfo.ocrResult?.debugInfo?.rawText && (
                      <>
                        <Text style={styles.debugLabel}>Raw OCR Text:</Text>
                        <Text style={styles.debugValue} numberOfLines={3}>
                          {debugInfo.ocrResult.debugInfo.rawText.substring(0, 200)}...
                        </Text>
                      </>
                    )}
                  </>
                )}
                
                <TouchableOpacity 
                  style={styles.testApiButton}
                  onPress={async () => {
                    try {
                      const result = await testApiKey();
                      Alert.alert(
                        'API Test Results',
                        `Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}\n\nMessage: ${result.message}\n\nType: ${result.type}`,
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      Alert.alert('Test Failed', error.message);
                    }
                  }}
                >
                  <Text style={styles.testApiButtonText}>Test API Connection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.ocrResultsFooter}>
            <TouchableOpacity 
              style={styles.ocrRetakeButton}
              onPress={retakePhoto}
            >
              <Ionicons name="camera-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.ocrRetakeButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.ocrAddItemsButton,
                receiptItems.filter(item => item.checked).length === 0 && styles.ocrAddItemsButtonDisabled
              ]}
              onPress={addReceiptItems}
              disabled={receiptItems.filter(item => item.checked).length === 0}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.ocrAddItemsButtonText}>
                Add {receiptItems.filter(item => item.checked).length} Items to Pantry
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Receipt Scan Modal */}
      <Modal
        visible={currentModal === 'receiptScan'}
        animationType="slide"
        onRequestClose={() => setCurrentModal(null)}
      >
        <SafeAreaView style={styles.receiptScanContainer}>
          {/* Header */}
          <View style={styles.receiptScanHeader}>
            <TouchableOpacity 
              onPress={() => setCurrentModal(null)}
              style={styles.receiptScanBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.receiptScanTitle}>Scan Receipt</Text>
            <View style={styles.receiptScanSpacer} />
          </View>

          <ScrollView style={styles.receiptScanScroll} showsVerticalScrollIndicator={false}>
            {/* Instructions */}
            <View style={styles.receiptScanInstructions}>
              <Ionicons name="receipt-outline" size={64} color={COLORS.primary} />
              <Text style={styles.receiptScanInstructionsTitle}>Take a Clear Photo</Text>
              <Text style={styles.receiptScanInstructionsText}>
                Position your receipt on a flat surface with good lighting. Make sure all text is clearly visible.
              </Text>
            </View>

            {/* Process Receipt Button - ABOVE image when image exists */}
            {selectedImage && (
              <TouchableOpacity 
                style={styles.processReceiptButtonTop}
                onPress={() => {
                  console.log('🔘 RECEIPT DEBUG - Process Receipt button pressed');
                  console.log('🔘 RECEIPT DEBUG - Selected image:', selectedImage);
                  console.log('🔘 RECEIPT DEBUG - Processing state:', receiptProcessing);
                  processReceipt();
                }}
                disabled={receiptProcessing}
              >
                {receiptProcessing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="scan" size={20} color={COLORS.white} />
                )}
                <Text style={styles.processReceiptButtonText}>
                  {receiptProcessing ? 'Processing...' : 'Process Receipt'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.imagePreviewActions}>
                  <TouchableOpacity 
                    style={styles.retakeButton}
                    onPress={retakePhoto}
                  >
                    <Ionicons name="refresh" size={20} color={COLORS.white} />
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.viewFullSizeButton}
                    onPress={() => {
                      setFullScreenImageUri(selectedImage);
                      setFullScreenImageVisible(true);
                    }}
                  >
                    <Ionicons name="expand-outline" size={20} color={COLORS.white} />
                    <Text style={styles.viewFullSizeButtonText}>Full Size</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.receiptScanActions}>
              <TouchableOpacity 
                style={styles.receiptScanButton}
                onPress={takeReceiptPhoto}
              >
                <Ionicons name="camera" size={24} color={COLORS.white} />
                <Text style={styles.receiptScanButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.receiptScanButtonSecondary}
                onPress={pickImageFromLibrary}
              >
                <Ionicons name="images" size={24} color={COLORS.primary} />
                <Text style={styles.receiptScanButtonSecondaryText}>Choose from Library</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {imageError && (
              <View style={styles.receiptScanError}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={styles.receiptScanErrorText}>{imageError}</Text>
              </View>
            )}

            {/* Debug Information */}
            <View style={styles.debugSection}>
              <TouchableOpacity 
                style={styles.debugHeader}
                onPress={() => {
                  // Test API key and show results
                  testApiKey().then(result => {
                    Alert.alert(
                      'API Test Results',
                      `Status: ${result.valid ? 'Valid' : 'Invalid'}\nMessage: ${result.message}\nType: ${result.type}`,
                      [{ text: 'OK' }]
                    );
                  });
                }}
              >
                <Ionicons name="bug-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.debugHeaderText}>Debug Info</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              <View style={styles.debugContent}>
                <Text style={styles.debugLabel}>API Key Status:</Text>
                <Text style={styles.debugValue}>
                  {GOOGLE_VISION_API_KEY ? 
                    `Configured (${GOOGLE_VISION_API_KEY.length} chars)` : 
                    'Not configured'
                  }
                </Text>
                
                <Text style={styles.debugLabel}>Image Selected:</Text>
                <Text style={styles.debugValue}>
                  {selectedImage ? 'Yes' : 'No'}
                </Text>
                
                {selectedImage && (
                  <>
                    <Text style={styles.debugLabel}>Image URI:</Text>
                    <Text style={styles.debugValue} numberOfLines={2}>
                      {selectedImage}
                    </Text>
                  </>
                )}
                
                <Text style={styles.debugLabel}>Processing Status:</Text>
                <Text style={styles.debugValue}>
                  {receiptProcessing ? 'Processing...' : 'Ready'}
                </Text>
                
                <TouchableOpacity 
                  style={styles.testApiButton}
                  onPress={async () => {
                    try {
                      const result = await testApiKey();
                      Alert.alert(
                        'API Test Results',
                        `Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}\n\nMessage: ${result.message}\n\nType: ${result.type}`,
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      Alert.alert('Test Failed', error.message);
                    }
                  }}
                >
                  <Text style={styles.testApiButtonText}>Test API Connection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={fullScreenImageVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setFullScreenImageVisible(false)}
      >
        <View style={styles.fullScreenImageContainer}>
          <View style={styles.fullScreenImageHeader}>
            <TouchableOpacity 
              style={styles.fullScreenImageCloseButton}
              onPress={() => setFullScreenImageVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.fullScreenImageTitle}>Receipt Image</Text>
            <View style={styles.fullScreenImageSpacer} />
          </View>
          
          <ScrollView 
            style={styles.fullScreenImageScroll}
            contentContainerStyle={styles.fullScreenImageScrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            maximumZoomScale={3.0}
            minimumZoomScale={1.0}
          >
            {fullScreenImageUri && (
              <Image 
                source={{ uri: fullScreenImageUri }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Barcode Scan Modal */}
      <Modal
        visible={currentModal === 'barcodeScan'}
        animationType="slide"
        onRequestClose={() => setCurrentModal(null)}
      >
        <SafeAreaView style={styles.barcodeScanContainer}>
          {/* Header */}
          <View style={styles.barcodeScanHeader}>
            <TouchableOpacity 
              onPress={() => setCurrentModal(null)}
              style={styles.barcodeScanBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.barcodeScanTitle}>Scan Barcode</Text>
            <View style={styles.barcodeScanSpacer} />
          </View>

          <ScrollView style={styles.barcodeScanScroll} showsVerticalScrollIndicator={false}>
            {/* Instructions */}
            <View style={styles.barcodeScanInstructions}>
              <Ionicons name="scan-outline" size={64} color={COLORS.primary} />
              <Text style={styles.barcodeScanInstructionsTitle}>Scan Product Barcode</Text>
              <Text style={styles.barcodeScanInstructionsText}>
                Point your camera at the product barcode to automatically add it to your pantry.
              </Text>
            </View>

            {/* Barcode Results */}
            {barcodeProduct && (
              <View style={styles.barcodeResultsContainer}>
                <View style={styles.barcodeProductCard}>
                  <Text style={styles.barcodeProductName}>{barcodeProduct.name}</Text>
                  <Text style={styles.barcodeProductCategory}>{barcodeProduct.category}</Text>
                  
                  <View style={styles.barcodeQuantityContainer}>
                    <Text style={styles.barcodeQuantityLabel}>Quantity:</Text>
                    <TextInput
                      style={styles.barcodeQuantityInput}
                      value={barcodeQuantity}
                      onChangeText={setBarcodeQuantity}
                      placeholder="e.g., 1, 2 lbs, 500g"
                      keyboardType="default"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.barcodeScanActions}>
              <TouchableOpacity 
                style={styles.barcodeScanButton}
                onPress={scanBarcode}
              >
                <Ionicons name="scan" size={24} color={COLORS.white} />
                <Text style={styles.barcodeScanButtonText}>Scan Barcode</Text>
              </TouchableOpacity>

              {barcodeProduct && (
                <TouchableOpacity 
                  style={styles.addBarcodeItemButton}
                  onPress={addBarcodeItem}
                >
                  <Ionicons name="add" size={20} color={COLORS.white} />
                  <Text style={styles.addBarcodeItemButtonText}>Add to Pantry</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Error Message */}
            {imageError && (
              <View style={styles.barcodeScanError}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={styles.barcodeScanErrorText}>{imageError}</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20, // Increased top padding
    paddingBottom: 36, // Increased spacing before search
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  menuButton: {
    padding: 8,
  },
      searchContainer: {
      paddingHorizontal: 20,
      marginTop: 8, // Add extra top margin
      marginBottom: 24, // Increased space before action buttons
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14, // Increased padding for better touch target
      borderWidth: 1,
      borderColor: COLORS.border,
    },
      searchInput: {
      flex: 1,
      fontSize: 16,
      color: COLORS.textPrimary,
      padding: 0,
    },
    pantryActions: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    groceryListBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.white,
      borderWidth: 2,
      borderColor: '#DC3545',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 6,
    },
    groceryListBtnText: {
      color: '#DC3545',
      fontWeight: '600',
      fontSize: 14,
    },
    essentialsToggleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      gap: 6,
    },
    essentialsToggleBtnEnabled: {
      backgroundColor: '#FFC107',
      borderColor: '#FFC107',
    },
    essentialsToggleBtnDisabled: {
      backgroundColor: COLORS.white,
      borderColor: '#6C757D',
    },
    essentialsToggleBtnText: {
      fontWeight: '600',
      fontSize: 14,
    },
  statsContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  groceryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 24,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  groceryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  categorySection: {
    marginBottom: 16,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  categoryHeader: {
    padding: 16,
    marginBottom: 0,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryItems: {
    padding: 16,
    paddingTop: 8,
  },
  emptyCategory: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    margin: 16,
    borderRadius: 12,
  },
  emptyCategoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickAddText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 16, // Reduced padding for cleaner look
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 24,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  essentialItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    backgroundColor: '#FFFBF0',
  },
  essentialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  essentialBadgeIcon: {
    fontSize: 10,
  },
  essentialBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B4513',
  },
  itemQty: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemRight: {
    alignItems: 'flex-end',
    // Removed expiration-related styles for cleaner UI
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
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
      emptyStateButtonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    essentialsTip: {
      marginTop: 20,
      paddingHorizontal: 20,
    },
    essentialsTipText: {
      fontSize: 14,
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    essentialsTipBold: {
      fontWeight: '600',
      color: COLORS.textPrimary,
    },
  // Enhanced OCR Results Modal styles
  ocrResultsContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  ocrResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ocrResultsCloseButton: {
    padding: 8,
  },
  ocrResultsTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  ocrResultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  ocrResultsSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  ocrResultsSpacer: {
    width: 40,
  },
  ocrResultsScroll: {
    flex: 1,
  },
  ocrSuccessSummary: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F0FDF4',
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  ocrSuccessIcon: {
    marginBottom: 12,
  },
  ocrSuccessTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  ocrSuccessText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addManualItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  addManualItemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  ocrItemsContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  ocrItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  ocrItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ocrItemCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  ocrItemMainInfo: {
    flex: 1,
  },
  ocrItemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ocrItemName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 24,
  },
  ocrItemNameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  ocrItemCategoryContainer: {
    marginBottom: 4,
  },
  ocrItemCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ocrItemCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  ocrItemDeleteButton: {
    padding: 10,
    marginLeft: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  ocrItemDetails: {
    marginLeft: 36,
    marginTop: 8,
  },
  ocrItemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ocrItemDetailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 90,
  },
  ocrItemQuantityInput: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    minWidth: 80,
    textAlign: 'center',
  },
  // Confidence display removed for cleaner UI
  ocrNoItemsContainer: {
    alignItems: 'center',
    padding: 40,
    margin: 16,
  },
  ocrNoItemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  ocrNoItemsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  ocrResultsFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 16,
    backgroundColor: COLORS.white,
  },
  ocrRetakeButton: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    minWidth: 120,
  },
  ocrRetakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  ocrAddItemsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ocrAddItemsButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  ocrAddItemsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 8,
  },
  // Debug section styles
  debugSection: {
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  debugHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  debugContent: {
    padding: 12,
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  debugValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  testApiButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testApiButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Receipt Scan Modal styles
  receiptScanContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  receiptScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiptScanBackButton: {
    padding: 8,
  },
  receiptScanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  receiptScanSpacer: {
    width: 40,
  },
  receiptScanScroll: {
    flex: 1,
  },
  receiptScanInstructions: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
  },
  receiptScanInstructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  receiptScanInstructionsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  imagePreviewContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageWrapper: {
    width: '100%',
    minHeight: 200,
    maxHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    minHeight: 200,
    maxHeight: 400,
  },
  imagePreviewActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  retakeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewFullSizeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewFullSizeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  receiptScanActions: {
    padding: 16,
    gap: 12,
  },
  receiptScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  receiptScanButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  receiptScanButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  receiptScanButtonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  processReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    margin: 16,
  },
  processReceiptButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  processReceiptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  receiptScanError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  receiptScanErrorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  // Barcode Scan Modal styles
  barcodeScanContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  barcodeScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  barcodeScanBackButton: {
    padding: 8,
  },
  barcodeScanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  barcodeScanSpacer: {
    width: 40,
  },
  barcodeScanScroll: {
    flex: 1,
  },
  barcodeScanInstructions: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
  },
  barcodeScanInstructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  barcodeScanInstructionsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  barcodeResultsContainer: {
    padding: 16,
  },
  barcodeProductCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  barcodeProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  barcodeProductCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  barcodeQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeQuantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 12,
  },
  barcodeQuantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  barcodeScanActions: {
    padding: 16,
    gap: 12,
  },
  barcodeScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  barcodeScanButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addBarcodeItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addBarcodeItemButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  barcodeScanError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  barcodeScanErrorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 32,
    width: '85%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalOptions: {
    gap: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  // Manual Entry Form styles
  manualEntryContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  manualEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  manualEntryBackButton: {
    padding: 4,
  },
  manualEntryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  manualEntrySpacer: {
    width: 32,
  },
  manualEntryScroll: {
    flex: 1,
  },
  manualEntryFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  formTextArea: {
    height: 80,
    paddingTop: 14,
  },
  categoryPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  categoryOptionTextSelected: {
    color: COLORS.primaryDark,
  },
  quickExpirationContainer: {
    marginTop: 12,
  },
  quickExpirationLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  quickExpirationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickExpirationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickExpirationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primaryDark,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  // Full-Screen Image Viewer styles
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullScreenImageCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullScreenImageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  fullScreenImageSpacer: {
    width: 40,
  },
  fullScreenImageScroll: {
    flex: 1,
  },
  fullScreenImageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
  // Success Message styles
  successBanner: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    marginLeft: 8,
    flex: 1,
  },
  closeBanner: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  newlyAddedItem: {
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Swipe-to-delete styles
  swipeableContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 1,
  },
  deleteButtonTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  itemTouchable: {
    flex: 1,
  },
  undoToast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1000,
    ...SHADOWS.large,
  },
  undoToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undoToastText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  undoButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  undoButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  // AI Insights Styles
  aiInsightsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiInsightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  aiInsightsScroll: {
    paddingRight: 20,
  },
  insightCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  insightopportunity: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  insightwarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  insightsuggestion: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  insightinfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#6B7280',
  },
  insightIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statIngredient: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
}); 