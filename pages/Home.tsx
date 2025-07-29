import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { useFonts } from 'expo-font';

import ResourcesCard from '../components/Resources';
import Footer from '../components/BottomMenu';
import Header from '../components/Header';

interface User {
  username: string;
}

interface Update {
  id: number;
  heading: string;
  text: string;
  date: string;
  category: string | string[];
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<Update[]>([]);
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Monoton: require('../assets/fonts/Monoton-Regular.ttf'),
  });

  // Helper function to get the primary category for display
  const getPrimaryCategory = (category: string | string[] | undefined): string => {
    if (!category) return '';
    if (Array.isArray(category)) {
      return category[0] || '';
    }
    return category;
  };

  // Helper function to check if category exists
  const hasValidCategory = (category: string | string[] | undefined): boolean => {
    if (!category) return false;
    if (Array.isArray(category)) {
      return category.length > 0 && category[0] !== undefined && category[0] !== '';
    }
    return category !== undefined && category !== '';
  };

  useEffect(() => {
    const checkTokenAndFetchUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          navigation.navigate('Login' as never);
          return;
        }

        const decoded = jwtDecode(token) as { username: string };
        
        try {
          const res = await fetch(`https://nexuslearn-mu.vercel.app/api/user?username=${decoded.username}`);
          
          // Check if response is ok and content type is JSON
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
          }
          
          const data = await res.json();

          if (data.username) {
            setUser(data);
          } else {
            console.warn('Fallback to decoded username');
            setUser({ username: decoded.username });
          }
        } catch (fetchErr) {
          console.error('Error fetching user:', fetchErr);
          // Fallback to decoded username
          setUser({ username: decoded.username });
        }
      } catch (err) {
        console.error('Error decoding token:', err);
        // If token is invalid, redirect to login
        navigation.navigate('Login' as never);
      } finally {
        setLoading(false);
      }
    };

    const fetchUpdates = async () => {
      try {
        // Import the updates JSON file
        const updatesData = require('pages/Updates/updates.json');
        
        // Validate that updates exist and is an array
        if (!updatesData || !updatesData.updates || !Array.isArray(updatesData.updates)) {
          console.warn('Invalid updates data structure');
          setUpdates([]);
          return;
        }
        
        // Sort updates by date (newest first) and take only the latest 1
        const sortedUpdates = updatesData.updates
          .filter((update: Update) => 
            update && 
            update.date && 
            update.heading && 
            hasValidCategory(update.category)
          ) // Filter out invalid entries
          .sort((a: Update, b: Update) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 1);
          
        setUpdates(sortedUpdates);
      } catch (error) {
        console.error('Error fetching updates:', error);
        // Fallback to empty array if file doesn't exist or has issues
        setUpdates([]);
      }
    };

    checkTokenAndFetchUser();
    fetchUpdates();
  }, [navigation]);

  const handleViewStats = () => {
    navigation.navigate('Stats' as never);
  };

  const handleViewUpdates = () => {
    navigation.navigate('Updates' as never);
  };

  const handleContribute = () => {
    navigation.navigate('Contribute' as never);
  };

  const getUpdateTypeColor = (category: string | string[] | undefined) => {
    const primaryCategory = getPrimaryCategory(category);
    if (!primaryCategory) return '#757575'; // Default color for undefined category
    
    switch (primaryCategory.toLowerCase()) {
      case 'feature':
        return '#4CAF50';
      case 'content':
        return '#2196F3';
      case 'bug fix':
        return '#FF9800';
      case 'announcement':
        return '#9C27B0';
      case 'performance':
        return '#2196F3';
      case 'ui/ux':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const getUpdateTypeText = (category: string | string[] | undefined) => {
    const primaryCategory = getPrimaryCategory(category);
    if (!primaryCategory) return 'UPDATE'; // Default text for undefined category
    
    switch (primaryCategory.toLowerCase()) {
      case 'feature':
        return 'NEW';
      case 'content':
        return 'CONTENT';
      case 'bug fix':
        return 'FIX';
      case 'announcement':
        return 'NEWS';
      case 'performance':
        return 'PERF';
      case 'ui/ux':
        return 'UI';
      default:
        return 'UPDATE';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#ffaa00" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Header />

      <ScrollView style={styles.container}>
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>
            Welcome back {"\n"}
            {user?.username ? `${user.username}` : ''}!
          </Text>
          <Text style={styles.subText}>Explore resources and track your progress</Text>
          
          {/* What's New Section */}
          <View style={styles.whatsNewContainer}>
            <View style={styles.whatsNewHeader}>
              <Text style={styles.whatsNewTitle}>What's New</Text>
              <TouchableOpacity onPress={handleViewUpdates} style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.updatesContainer}>
              {updates.length > 0 ? (
                updates.map((update) => (
                  <View key={update.id} style={styles.updateItem}>
                    <View style={styles.updateHeader}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {(Array.isArray(update.category) ? update.category : [update.category]).map((tag, idx) => (
                          <View key={idx} style={[styles.updateBadge, { backgroundColor: getUpdateTypeColor(tag) }]}>
                            <Text style={styles.updateBadgeText}>{getUpdateTypeText(tag)}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.updateDate}>{formatDate(update.date)}</Text>
                    </View>
                    <Text style={styles.updateTitle}>{update.heading}</Text>
                    <Text style={styles.updateDescription}>
                      {update.text.length > 100 ? `${update.text.slice(0, 100)}...` : update.text}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.noUpdatesContainer}>
                  <Text style={styles.noUpdatesText}>No updates available</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Resources</Text>
          <View style={styles.grid}>
            <ResourcesCard title="O Level" route="Olevel" />
            <ResourcesCard title="A Level" route="Alevel" />
            <ResourcesCard title="IGCSE" route="IGCSE" />
            <ResourcesCard title="SAT" route="SAT" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.statsTitle}>Insights</Text>
          <TouchableOpacity onPress={handleViewStats} style={styles.statsCard}>
            <Text style={styles.statsCardText}>View Your Stats</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.contributeTitle}>FeedBack/Contribute</Text>
          <TouchableOpacity onPress={handleContribute} style={styles.contributeCard}>
            <Text style={styles.contributeCardText}>Share Your Feedback</Text>
          </TouchableOpacity>
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
  welcomeBox: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#111',
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Monoton',
    color: '#ffaa00',
    marginBottom: 4,
  },
  subText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
  },
  whatsNewContainer: {
    width: '100%',
    marginTop: 8,
  },
  whatsNewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  whatsNewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffaa00',
  },
  seeAllText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  updatesContainer: {
    gap: 12,
  },
  updateItem: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffaa00',
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  updateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  updateBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  updateDate: {
    color: '#888',
    fontSize: 11,
  },
  updateTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  updateDescription: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
  },
  noUpdatesContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noUpdatesText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    color: '#e67d7d',
    fontSize: 28,
    fontFamily: 'Monoton',
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    columnGap: 12,
  },
  statsTitle: {
    color: '#3d9fea',
    fontSize: 28,
    fontFamily: 'Monoton',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#ffaa00',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statsCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  contributeTitle: {
    color: '#85a978',
    fontSize: 28,
    fontFamily: 'Monoton',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  contributeCard: {
    backgroundColor: '#ffaa00',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contributeCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  lastSection: {
    marginBottom: 100,
  },
});