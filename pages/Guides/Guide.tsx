import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts } from 'expo-font';

import Header from '../../components/Header';
import Footer from '../../components/BottomMenu';

interface GuideData {
  id: number;
  title: string;
  text: string;
  img?: string;
  imgPosition?: 'above' | 'below';
  category: string;
}

interface RouteParams {
  guide: GuideData;
}

export default function Guide() {
  const navigation = useNavigation();
  const route = useRoute();
  const { guide } = route.params as RouteParams;

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
      case 'FAQ':
        return '#ffffff';
      default:
        return '#ffaa00';
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderImage = () => {
    if (!guide.img) return null;

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: guide.img }}
          style={styles.guideImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const renderContent = () => {
    const textContent = (
      <View style={styles.textContent}>
        <Text style={styles.guideText}>{guide.text}</Text>
      </View>
    );

    if (!guide.img) {
      return textContent;
    }

    if (guide.imgPosition === 'above') {
      return (
        <>
          {renderImage()}
          {textContent}
        </>
      );
    } else {
      return (
        <>
          {textContent}
          {renderImage()}
        </>
      );
    }
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
            <Text style={styles.backButtonText}>← Back to Guides</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guideContainer}>
          <View style={styles.guideHeader}>
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor(guide.category) },
                ]}
              >
                <Text style={styles.badgeText}>{guide.category}</Text>
              </View>
            </View>
            
            <Text style={styles.guideTitle}>{guide.title}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.guideContent}>
            {renderContent()}
          </View>

          <View style={styles.guideFooter}>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Need More Help?</Text>
              <Text style={styles.footerText}>
                Check out our other guides or reach out if you're still having trouble.
              </Text>
            </View>

            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Feedback</Text>
              <Text style={styles.footerText}>
                Was this guide helpful? Have suggestions for improvement? We'd love to hear from you at artariqdev@gmail.com
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
  guideContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    margin: 16,
    padding: 20,
  },
  guideHeader: {
    marginBottom: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  guideTitle: {
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
  guideContent: {
    marginBottom: 30,
  },
  textContent: {
    marginVertical: 10,
  },
  guideText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  imageContainer: {
    marginVertical: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  guideImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  guideFooter: {
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