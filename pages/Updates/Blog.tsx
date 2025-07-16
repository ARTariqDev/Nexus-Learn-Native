import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts } from 'expo-font';

import Header from '../../components/Header';
import Footer from '../../components/BottomMenu';

interface Update {
  id: number;
  heading: string;
  text: string;
  date: string;
  category: string;
}

interface RouteParams {
  update: Update;
}

export default function Blog() {
  const navigation = useNavigation();
  const route = useRoute();
  const { update } = route.params as RouteParams;

  const [fontsLoaded] = useFonts({
    Monoton: require('../../assets/fonts/Monoton-Regular.ttf'),
  });

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

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Header />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← Back to Updates</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.articleContainer}>
          <View style={styles.articleHeader}>
            <View style={styles.categoryContainer}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor(update.category) },
                ]}
              >
                <Text style={styles.categoryText}>{update.category}</Text>
              </View>
            </View>
            
            <Text style={styles.dateText}>{formatDate(update.date)}</Text>
            
            <Text style={styles.articleTitle}>{update.heading}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.articleContent}>
            <Text style={styles.articleText}>{update.text}</Text>
          </View>

          <View style={styles.articleFooter}>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Stay Connected</Text>
              <Text style={styles.footerText}>
                Keep checking back for more updates and improvements to your learning experience.
              </Text>
            </View>

            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Feedback</Text>
              <Text style={styles.footerText}>
                Have suggestions,found a bug or want to contribute resources? We'd love to hear from you to make the app even better. Email me at artariqdev@gmail.com
              </Text>
            </View>
          </View>
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
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffaa00',
    fontSize: 14,
    fontWeight: '600',
  },
  articleContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    margin: 16,
    padding: 20,
  },
  articleHeader: {
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dateText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
  },
  articleTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Monoton',
    textAlign: 'center',
    lineHeight: 32,
  },
  divider: {
    height: 2,
    backgroundColor: '#ffaa00',
    marginVertical: 20,
    borderRadius: 1,
  },
  articleContent: {
    marginBottom: 30,
  },
  articleText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  articleFooter: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 20,
  },
  footerSection: {
    marginBottom: 20,
  },
  footerTitle: {
    color: '#ffaa00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  footerText: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
});