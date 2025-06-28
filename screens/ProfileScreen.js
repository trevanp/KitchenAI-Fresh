import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your personal settings</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcome}>👤 Your Profile</Text>
        <Text style={styles.description}>
          Manage your preferences, dietary restrictions, cooking skill level, and account settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 24,
  },
}); 