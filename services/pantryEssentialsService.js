import AsyncStorage from '@react-native-async-storage/async-storage';

// Default pantry essentials that most households have
export const PANTRY_ESSENTIALS = [
  // Seasonings & Basics
  { 
    name: 'Salt', 
    category: 'Spices & Seasonings', 
    subcategory: 'basic_spices', 
    icon: '🧂',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Black Pepper', 
    category: 'Spices & Seasonings', 
    subcategory: 'basic_spices', 
    icon: '🌶️',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Olive Oil', 
    category: 'Oils, Vinegars & Fats', 
    subcategory: 'cooking_oils', 
    icon: '🫒',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Garlic', 
    category: 'Produce', 
    subcategory: 'aromatics', 
    icon: '🧄',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  
  // Baking Essentials
  { 
    name: 'All-Purpose Flour', 
    category: 'Baking & Flours', 
    subcategory: 'flour', 
    icon: '🌾',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Sugar', 
    category: 'Baking & Flours', 
    subcategory: 'sweeteners', 
    icon: '🍯',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Baking Powder', 
    category: 'Baking & Flours', 
    subcategory: 'leavening', 
    icon: '🥄',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Baking Soda', 
    category: 'Baking & Flours', 
    subcategory: 'leavening', 
    icon: '🥄',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  
  // Dairy Basics
  { 
    name: 'Eggs', 
    category: 'Dairy', 
    subcategory: 'eggs', 
    icon: '🥚',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Milk', 
    category: 'Dairy', 
    subcategory: 'milk', 
    icon: '🥛',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Butter', 
    category: 'Dairy', 
    subcategory: 'butter', 
    icon: '🧈',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  
  // Additional Essentials
  { 
    name: 'Onion', 
    category: 'Produce', 
    subcategory: 'aromatics', 
    icon: '🧅',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Vegetable Oil', 
    category: 'Oils, Vinegars & Fats', 
    subcategory: 'cooking_oils', 
    icon: '🛢️',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  },
  { 
    name: 'Vanilla Extract', 
    category: 'Baking & Flours', 
    subcategory: 'extracts', 
    icon: '🌟',
    quantity: 'Available',
    unit: 'as needed',
    notes: 'Common household staple'
  }
];

// Storage keys
const ESSENTIALS_ENABLED_KEY = 'pantry_essentials_enabled';
const ESSENTIALS_ADDED_DATE_KEY = 'pantry_essentials_added_date';

class PantryEssentialsManager {
  // Check if essentials are enabled for the user
  static async areEssentialsEnabled() {
    try {
      const enabled = await AsyncStorage.getItem(ESSENTIALS_ENABLED_KEY);
      // Default to false for new users
      return enabled === null ? false : enabled === 'true';
    } catch (error) {
      console.error('Failed to check essentials status:', error);
      return false; // Default to disabled
    }
  }

  // Enable pantry essentials
  static async enableEssentials() {
    try {
      await AsyncStorage.setItem(ESSENTIALS_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(ESSENTIALS_ADDED_DATE_KEY, new Date().toISOString());
      console.log('✅ Pantry essentials enabled');
      return true;
    } catch (error) {
      console.error('Failed to enable essentials:', error);
      return false;
    }
  }

  // Disable pantry essentials
  static async disableEssentials() {
    try {
      await AsyncStorage.setItem(ESSENTIALS_ENABLED_KEY, 'false');
      console.log('✅ Pantry essentials disabled');
      return true;
    } catch (error) {
      console.error('Failed to disable essentials:', error);
      return false;
    }
  }

  // Get essentials that should be included in recipe matching
  static async getEssentialsForMatching() {
    try {
      const enabled = await this.areEssentialsEnabled();
      if (!enabled) {
        return [];
      }
      return PANTRY_ESSENTIALS;
    } catch (error) {
      console.error('Failed to get essentials for matching:', error);
      return [];
    }
  }

  // Check if an item is an essential
  static isEssential(itemName) {
    return PANTRY_ESSENTIALS.some(essential => 
      essential.name.toLowerCase() === itemName.toLowerCase()
    );
  }

  // Get essential by name
  static getEssentialByName(itemName) {
    return PANTRY_ESSENTIALS.find(essential => 
      essential.name.toLowerCase() === itemName.toLowerCase()
    );
  }

  // Handle duplicate detection when adding items
  static async handleDuplicateDetection(newItem, existingPantryItems) {
    try {
      // Check if this item matches an essential
      const matchingEssential = this.getEssentialByName(newItem.name);
      
      if (matchingEssential) {
        // Check if essential version exists
        const existingEssential = existingPantryItems.find(item =>
          item.name.toLowerCase() === newItem.name.toLowerCase() &&
          item.isEssential
        );
        
        if (existingEssential) {
          console.log(`Found existing essential: ${newItem.name}`);
          return {
            isDuplicate: true,
            existingItem: existingEssential,
            isEssential: true,
            shouldUpdate: true
          };
        }
      }
      
      // Check for regular duplicates
      const existingItem = existingPantryItems.find(item =>
        item.name.toLowerCase() === newItem.name.toLowerCase()
      );
      
      if (existingItem) {
        return {
          isDuplicate: true,
          existingItem,
          isEssential: false,
          shouldUpdate: false
        };
      }
      
      return { isDuplicate: false };
      
    } catch (error) {
      console.error('Failed to handle duplicate detection:', error);
      return { isDuplicate: false };
    }
  }

  // Convert essential to user-added item
  static convertEssentialToUserItem(essentialItem, userData) {
    return {
      ...essentialItem,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isEssential: false,
      source: userData.source || 'user_added',
      quantity: userData.quantity || essentialItem.quantity,
      addedAt: new Date().toISOString(),
      notes: userData.notes || essentialItem.notes
    };
  }

  // Get all available ingredients for recipe matching (user items + essentials)
  static async getAllAvailableIngredients(userPantryItems) {
    try {
      const enabled = await this.areEssentialsEnabled();
      let allIngredients = [...userPantryItems];
      
      console.log('🔧 getAllAvailableIngredients - enabled:', enabled);
      console.log('🔧 User pantry items count:', userPantryItems.length);
      
      if (enabled) {
        // Add essentials that aren't already in user's pantry
        const userItemNames = userPantryItems.map(item => item.name.toLowerCase());
        const missingEssentials = PANTRY_ESSENTIALS.filter(essential =>
          !userItemNames.includes(essential.name.toLowerCase())
        );
        
        console.log('🔧 Missing essentials count:', missingEssentials.length);
        console.log('🔧 Missing essentials:', missingEssentials.map(e => e.name));
        
        // Convert essentials to pantry item format
        const essentialItems = missingEssentials.map(essential => ({
          ...essential,
          id: `essential_${essential.name.toLowerCase().replace(/\s+/g, '_')}`,
          isEssential: true,
          source: 'pantry_essentials',
          addedAt: new Date().toISOString()
        }));
        
        allIngredients = [...allIngredients, ...essentialItems];
        
        console.log('🔧 Total ingredients (including essentials):', allIngredients.length);
        console.log('🔧 Essential items added:', essentialItems.map(e => e.name));
      }
      
      return allIngredients;
      
    } catch (error) {
      console.error('Failed to get all available ingredients:', error);
      return userPantryItems;
    }
  }

  // Initialize essentials for new users
  static async initializeForNewUser() {
    try {
      const enabled = await this.areEssentialsEnabled();
      if (enabled) {
        console.log('✅ Pantry essentials initialized for new user');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize essentials for new user:', error);
      return false;
    }
  }

  // Get essentials statistics
  static async getEssentialsStats() {
    try {
      const enabled = await this.areEssentialsEnabled();
      const addedDate = await AsyncStorage.getItem(ESSENTIALS_ADDED_DATE_KEY);
      
      return {
        enabled,
        totalEssentials: PANTRY_ESSENTIALS.length,
        addedDate: addedDate ? new Date(addedDate) : null,
        categories: [...new Set(PANTRY_ESSENTIALS.map(e => e.category))]
      };
    } catch (error) {
      console.error('Failed to get essentials stats:', error);
      return {
        enabled: false,
        totalEssentials: 0,
        addedDate: null,
        categories: []
      };
    }
  }
}

export default PantryEssentialsManager; 