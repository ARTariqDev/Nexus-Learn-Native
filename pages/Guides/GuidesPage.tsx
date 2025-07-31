import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';

import Header from '../../components/Header';
import Footer from '../../components/BottomMenu';
import Guide from './Guide';
import guidesData from './Guides.json';

interface GuideData {
  id: number;
  title: string;
  text: string;
  img?: string;
  imgPosition?: 'above' | 'below';
  category: string;
}

export default function GuidesPage() {
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Monoton: require('../../assets/fonts/Monoton-Regular.ttf'),
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Tutorial':
        return '#2196F3';
      case 'Tips':
        return '#9C27B0';
      case 'Setup':
        return '#4CAF50';
      case 'Troubleshooting':
        return '#FF5722';
      default:
        return '#ffaa00';
    }
  };

  const renderGuideItem = ({ item }: { item: GuideData }) => (
    <TouchableOpacity
      style={styles.guideCard}
      onPress={() => navigation.navigate('Guide', { guide: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category) },
            ]}
          >
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.guideTitle}>{item.title}</Text>
      <Text style={styles.guidePreview} numberOfLines={3}>
        {item.text}
      </Text>
      
      <View style={styles.readMoreContainer}>
        <Text style={styles.readMoreText}>Read Guide →</Text>
      </View>
    </TouchableOpacity>
  );

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
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Guides</Text>
          <Text style={styles.pageSubtitle}>
            Learn with step-by-step tutorials and helpful tips
          </Text>
        </View>

        <FlatList
          data={guidesData}
          renderItem={renderGuideItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.guidesContainer}
        />
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
  headerSection: {
    padding: 20,
    alignItems: 'center',
  },
  pageTitle: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Monoton',
    textAlign: 'center',
    marginBottom: 8,
  },
  pageSubtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  guidesContainer: {
    paddingHorizontal: 16,
  },
  guideCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffaa00',
  },
  cardHeader: {
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  guideTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  guidePreview: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreContainer: {
    alignItems: 'flex-end',
  },
  readMoreText: {
    color: '#ffaa00',
    fontSize: 14,
    fontWeight: '600',
  },
});