import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';

import Header from '../../components/Header';
import Footer from '../../components/BottomMenu';
import updatesData from './updates.json';

interface Update {
  id: number;
  heading: string;
  text: string;
  date: string;
  category: string | string[]; // Allow both single string and array
}

export default function Updates() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Monoton: require('../../assets/fonts/Monoton-Regular.ttf'),
  });

  useEffect(() => {
    const sortedUpdates = updatesData.updates.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setUpdates(sortedUpdates);
    setLoading(false);
  }, []);

  const handleReadMore = (update: Update) => {
    navigation.navigate('Blog' as never, { update } as never);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Feature':
        return '#ffaa00';
      case 'Content':
        return '#4CAF50';
      case 'Performance':
        return '#2196F3';
      case 'UI/UX':
        return '#9C27B0';
      case 'Bug Fix':
        return '#FF5722';
      default:
        return '#ffaa00';
    }
  };

  const getCategories = (category: string | string[]): string[] => {
    return Array.isArray(category) ? category : [category];
  };

  const renderCategoryBadges = (categories: string[]) => {
    return (
      <View style={styles.categoriesWrapper}>
        {categories.map((cat, index) => (
          <View
            key={index}
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(cat) },
              index > 0 && styles.categoryBadgeSpacing
            ]}
          >
            <Text style={styles.categoryText}>{cat}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#ffaa00" />
        <Text style={styles.loadingText}>Loading Updates...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Header />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>What's New</Text>
          <Text style={styles.subtitle}>
            Stay updated with the latest features and improvements
          </Text>
        </View>

        <View style={styles.updatesContainer}>
          {updates.map((update, index) => {
            const categories = getCategories(update.category);
            
            return (
              <View 
                key={update.id} 
                style={[
                  styles.updateCard,
                  index === updates.length - 1 && styles.lastUpdateCard
                ]}
              >
                <View style={styles.updateHeader}>
                  <View style={styles.categoryContainer}>
                    {renderCategoryBadges(categories)}
                    <Text style={styles.dateText}>{formatDate(update.date)}</Text>
                  </View>
                </View>

                <Text style={styles.updateHeading}>{update.heading}</Text>
                <Text style={styles.updateText} numberOfLines={3}>
                  {update.text}
                </Text>

                <TouchableOpacity
                  style={styles.readMoreButton}
                  onPress={() => handleReadMore(update)}
                >
                  <Text style={styles.readMoreText}>Read More</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingBottom: 100, // Add padding to prevent bottom menu overlap
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#111',
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Monoton',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  updatesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  updateCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffaa00',
  },
  lastUpdateCard: {
    marginBottom: 0, // Remove bottom margin from last card since we have scroll padding
  },
  updateHeader: {
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryBadgeSpacing: {
    marginLeft: 6,
  },
  categoryText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#999',
    fontSize: 12,
    alignSelf: 'flex-start',
  },
  updateHeading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  updateText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffaa00',
    borderRadius: 6,
  },
  readMoreText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});