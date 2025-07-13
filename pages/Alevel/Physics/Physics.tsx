import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import Header from 'components/Header';
import Footer from 'components/BottomMenu';
import PDF from 'components/PDF';

export default function Physics() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBooks, setShowBooks] = useState(false);
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Monoton: require('../../../assets/fonts/Monoton-Regular.ttf'),
  });

  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        navigation.navigate('Login' as never);
      } else {
        setUser({ username: 'User' });
      }
      setLoading(false);
    };
    checkToken();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#ffaa00" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Header />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Books</Text>
            <TouchableOpacity
              onPress={() => setShowBooks(!showBooks)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>{showBooks ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {showBooks && (
            <View style={styles.grid}>
              <PDF
                name="Cambridge University Press 2nd Edition"
                text1="View Book"
                link1="https://drive.google.com/file/d/18N8o_MBGXdY8Qr_WrX9B0xrD5W2WzKus/view?usp=sharing"
                size={2}
              />
              <PDF
                name="Cambridge University Press 3rd Edition"
                text1="View Book"
                link1="https://drive.google.com/file/d/1Cx-Eg-1NvsACQsaaXL5MjbNy92XxVwCB/view?usp=sharing"
                size={2}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000',
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
  container: {
    padding: 16,
    paddingBottom: 80, // Space for footer
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Monoton',
  },
  toggleButton: {
    backgroundColor: '#ffaa00',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  toggleText: {
    color: '#000',
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
});
