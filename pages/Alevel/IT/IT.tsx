import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import Footer from 'components/BottomMenu';
import PDF from 'components/PDF';
import books from './IT_Books.json';
import { useFonts } from 'expo-font';
import Header from 'components/Header';

export default function ITPage() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [showBooks, setShowBooks] = useState(false);

  const [fontsLoaded] = useFonts({
    Monoton: require('../../../assets/fonts/Monoton-Regular.ttf'),
  });

  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        navigation.navigate('Login');
      } else {
        setUser({ username: 'User' });
      }
    };
    checkToken();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#ffaa00" />
        <Text style={styles.loadingText}>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <Header />
      <Text style={[styles.pageTitle, { fontFamily: 'Monoton' }]}>
                            A Level IT 9626
      </Text>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Monoton' }]}>Books</Text>
            <TouchableOpacity onPress={() => setShowBooks(!showBooks)} style={styles.toggleButton}>
              <Text style={styles.toggleButtonText}>{showBooks ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {showBooks && (
            <View style={styles.cardColumn}>
              {books.map((book, index) => (
                <View key={index} style={styles.cardFullWidth}>
                  <PDF {...book} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.footerWrapper}>
        <Footer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  pageTitle: {
    color: '#ffaa00',
    fontSize: 28,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 24,
    letterSpacing: 1.5,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 160,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: '#ffaa00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  cardColumn: {
    flexDirection: 'column',
    gap: 16,
  },
  cardFullWidth: {
    marginLeft: 45,
    width: '150%',
  },
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
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#111',
  },
});
