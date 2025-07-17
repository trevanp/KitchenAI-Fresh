import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../components/DesignSystem';

const { width, height } = Dimensions.get('window');

// No dummy data - only user-saved recipes will appear here
const savedRecipes = [];
const recipeDatabase = [];

const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

// Dynamic date functions
function getCurrentWeek() {
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day; // Sunday = 0
  startOfWeek.setDate(diff);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return {
    start: startOfWeek,
    end: endOfWeek,
    today: today
  };
}

function formatWeekRange(startDate, endDate) {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}

function getDayData(date, today) {
  const isToday = date.toDateString() === today.toDateString();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return {
    dayName,
    monthDay,
    isToday,
    fullDate: date,
    dateString: date.toISOString().split('T')[0]
  };
}

function generateWeekData(startDate = null) {
  const week = startDate ? {
    start: startDate,
    end: new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000)),
    today: new Date()
  } : getCurrentWeek();
  
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(week.start);
    date.setDate(week.start.getDate() + i);
    
    const dayData = getDayData(date, week.today);
    days.push(dayData);
  }
  
  return {
    weekRange: formatWeekRange(week.start, week.end),
    days: days,
    currentWeek: week
  };
}

function isSameWeek(date1, date2) {
  const week1 = getCurrentWeek();
  return date1.toDateString() === week1.start.toDateString();
}

export default function MealPlanScreen() {
  // Initialize with current week data
  const [weekData, setWeekData] = useState(() => generateWeekData());
  const [mealPlan, setMealPlan] = useState(() => {
    const plan = {};
    weekData.days.forEach(day => {
      plan[day.dateString] = { Breakfast: null, Lunch: null, Dinner: null };
    });
    return plan;
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [activeTab, setActiveTab] = useState('cookbook'); // 'cookbook' or 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [savedRecipes, setSavedRecipes] = useState(savedRecipes);

  const openRecipeModal = (day, mealType) => {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setModalVisible(true);
    setActiveTab('cookbook'); // Default to cookbook tab
    setSearchQuery(''); // Clear search when opening
  };

  const handleSelectRecipe = (recipe) => {
    setMealPlan(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [selectedMealType]: recipe,
      },
    }));

    // If recipe is from search and not already in cookbook, add it
    if (activeTab === 'search' && !savedRecipes.find(r => r.id === recipe.id)) {
      setSavedRecipes(prev => [...prev, recipe]);
    }

    setModalVisible(false);
    setSelectedDay(null);
    setSelectedMealType(null);
    setSearchQuery('');
  };

  const handlePrevWeek = () => {
    const newStartDate = new Date(weekData.currentWeek.start);
    newStartDate.setDate(weekData.currentWeek.start.getDate() - 7);
    const newWeekData = generateWeekData(newStartDate);
    setWeekData(newWeekData);
    
    // Update meal plan for new week
    const newMealPlan = {};
    newWeekData.days.forEach(day => {
      newMealPlan[day.dateString] = { Breakfast: null, Lunch: null, Dinner: null };
    });
    setMealPlan(newMealPlan);
  };

  const handleNextWeek = () => {
    const newStartDate = new Date(weekData.currentWeek.start);
    newStartDate.setDate(weekData.currentWeek.start.getDate() + 7);
    const newWeekData = generateWeekData(newStartDate);
    setWeekData(newWeekData);
    
    // Update meal plan for new week
    const newMealPlan = {};
    newWeekData.days.forEach(day => {
      newMealPlan[day.dateString] = { Breakfast: null, Lunch: null, Dinner: null };
    });
    setMealPlan(newMealPlan);
  };

  const jumpToCurrentWeek = () => {
    const currentWeekData = generateWeekData();
    setWeekData(currentWeekData);
    
    // Update meal plan for current week
    const newMealPlan = {};
    currentWeekData.days.forEach(day => {
      newMealPlan[day.dateString] = { Breakfast: null, Lunch: null, Dinner: null };
    });
    setMealPlan(newMealPlan);
  };

  const isCurrentWeek = isSameWeek(weekData.currentWeek.start, new Date());

  // Filter recipes based on search query - only show results when actively searching
  const filteredSearchRecipes = searchQuery.trim() === '' 
    ? [] 
    : recipeDatabase.filter(recipe => 
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const renderRecipeCard = (recipe) => (
    <TouchableOpacity 
      key={recipe.id} 
      style={styles.recipeCard}
      onPress={() => handleSelectRecipe(recipe)}
    >
      <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
      <View style={styles.recipeCardContent}>
        <View style={styles.recipeCardHeader}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <View style={[
            styles.statusBadge, 
            recipe.status === 'Can Make' ? styles.statusCanMake : 
            recipe.status === 'Almost Can Make' ? styles.statusAlmost : 
            styles.statusMissing
          ]}>
            <Text style={styles.statusBadgeText}>{recipe.status}</Text>
          </View>
        </View>
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (activeTab === 'cookbook') {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.tabSubtitle}>Your saved recipes</Text>
          <FlatList
            data={savedRecipes}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => renderRecipeCard(item)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recipeList}
          />
        </View>
      );
         } else {
       return (
         <View style={styles.tabContent}>
           <View style={styles.searchContainer}>
             <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
             <TextInput
               style={styles.searchInput}
               placeholder="Search recipes..."
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholderTextColor={COLORS.textSecondary}
               autoFocus={true}
             />
           </View>
           {searchQuery ? (
             <>
               <Text style={styles.tabSubtitle}>
                 Search results ({filteredSearchRecipes.length})
               </Text>
               <FlatList
                 data={filteredSearchRecipes}
                 keyExtractor={item => item.id.toString()}
                 renderItem={({ item }) => renderRecipeCard(item)}
                 showsVerticalScrollIndicator={false}
                 contentContainerStyle={styles.recipeList}
               />
             </>
           ) : (
             <View style={styles.emptySearchState}>
               <Ionicons name="search-outline" size={64} color={COLORS.textSecondary} />
               <Text style={styles.emptySearchTitle}>Search for recipes</Text>
               <Text style={styles.emptySearchText}>
                 Find new recipes to add to your meal plan and cookbook
               </Text>
             </View>
           )}
         </View>
       );
     }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header Section */}
        <Text style={styles.header}>Meal Plan</Text>
        <View style={styles.weekInfoContainer}>
          <Text style={styles.weekRange}>{weekData.weekRange}</Text>
          {isCurrentWeek && (
            <View style={styles.currentWeekBadge}>
              <Text style={styles.currentWeekBadgeText}>This Week</Text>
            </View>
          )}
        </View>
        <View style={styles.weekNavRow}>
          <TouchableOpacity style={styles.weekNavBtn} onPress={handlePrevWeek}>
            <Ionicons name="chevron-back" size={18} color={COLORS.textSecondary} />
            <Text style={styles.weekNavText}>Previous Week</Text>
          </TouchableOpacity>
          
          {!isCurrentWeek && (
            <TouchableOpacity style={styles.todayButton} onPress={jumpToCurrentWeek}>
              <Ionicons name="calendar" size={16} color={COLORS.white} />
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.weekNavBtn} onPress={handleNextWeek}>
            <Text style={styles.weekNavText}>Next Week</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        {/* Day Cards */}
        {weekData.days.map(day => {
          return (
            <View
              key={day.dateString}
              style={[styles.dayCard, day.isToday && styles.dayCardToday]}
            >
              <View style={styles.dayHeaderRow}>
                <Text style={[styles.dayHeaderText, day.isToday && styles.dayHeaderTextToday]}>
                  {day.dayName} <Text style={[styles.dayHeaderDate, day.isToday && styles.dayHeaderDateToday]}>{day.monthDay}</Text>
                </Text>
                {day.isToday && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Today</Text>
                  </View>
                )}
              </View>
              {mealTypes.map(mealType => {
                const meal = mealPlan[day.dateString][mealType];
                return (
                  <View key={mealType} style={styles.mealSection}>
                    <View style={styles.mealRow}>
                      <Text style={styles.mealType}>{mealType}</Text>
                      <TouchableOpacity onPress={() => openRecipeModal(day.dateString, mealType)}>
                        <Text style={styles.changeBtn}>{meal ? 'Change' : ''}</Text>
                      </TouchableOpacity>
                    </View>
                    {meal ? (
                      <View style={styles.mealCardAssigned}>
                        <Image source={{ uri: meal.image }} style={styles.mealImage} />
                        <View style={styles.mealOverlay}>
                          <Text style={styles.mealName}>{meal.title}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.mealCardEmpty}>
                        <Text style={styles.mealEmptyText}>No {mealType.toLowerCase()} planned</Text>
                        <TouchableOpacity style={styles.addRecipeBtn} onPress={() => openRecipeModal(day.dateString, mealType)}>
                          <Text style={styles.addRecipeBtnText}>Add Recipe</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Enhanced Recipe Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Add {selectedMealType} for {weekData.days.find(d => d.dateString === selectedDay)?.dayName}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'cookbook' && styles.activeTab]}
              onPress={() => setActiveTab('cookbook')}
            >
              <Text style={[styles.tabText, activeTab === 'cookbook' && styles.activeTabText]}>
                My Cookbook
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'search' && styles.activeTab]}
              onPress={() => setActiveTab('search')}
            >
              <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
                Search Recipes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 24, marginBottom: 4, marginLeft: 20 },
  weekInfoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: 20, 
    marginBottom: 8 
  },
  weekRange: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginRight: 12 },
  currentWeekBadge: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    paddingHorizontal: 10, 
    paddingVertical: 4 
  },
  currentWeekBadgeText: { 
    color: COLORS.white, 
    fontWeight: '700', 
    fontSize: 12 
  },
  weekNavRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginHorizontal: 20, 
    marginBottom: 18 
  },
  weekNavBtn: { flexDirection: 'row', alignItems: 'center' },
  weekNavText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 15 },
  todayButton: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 6
  },
  todayButtonText: { 
    color: COLORS.white, 
    fontWeight: '700', 
    fontSize: 14 
  },
  dayCard: { 
    backgroundColor: COLORS.background, 
    borderRadius: 18, 
    marginHorizontal: 16, 
    marginBottom: 22, 
    padding: 18, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 4, 
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  dayCardToday: { 
    borderColor: COLORS.primary, 
    backgroundColor: '#FFF5F5',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dayHeaderText: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginRight: 8 },
  dayHeaderTextToday: { color: COLORS.primary },
  dayHeaderDate: { fontSize: 15, fontWeight: '500', color: COLORS.textSecondary },
  dayHeaderDateToday: { color: COLORS.primary, fontWeight: '600' },
  todayBadge: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, marginLeft: 8 },
  todayBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  mealSection: { marginBottom: 16 },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  mealType: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  changeBtn: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
  mealCardAssigned: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 2,
    marginTop: 2,
    ...SHADOWS.medium,
  },
  mealImage: { width: '100%', height: 110, resizeMode: 'cover' },
  mealOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', paddingVertical: 8, paddingHorizontal: 14 },
  mealName: { color: '#fff', fontWeight: 'bold', fontSize: 18, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  mealCardEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.border, borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 110, marginBottom: 2, marginTop: 2, backgroundColor: '#f3f4f6' },
  mealEmptyText: { color: COLORS.textSecondary, fontSize: 15, marginBottom: 6 },
  addRecipeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  addRecipeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tabSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  recipeList: {
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  recipeImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  recipeCardContent: {
    padding: 16,
  },
  recipeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  recipeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusCanMake: { backgroundColor: '#10B981' },
  statusAlmost: { backgroundColor: '#F59E0B' },
  statusMissing: { backgroundColor: '#EF4444' },
  statusBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  emptySearchState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptySearchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
}); 