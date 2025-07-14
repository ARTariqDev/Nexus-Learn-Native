import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import Header from 'components/Header';
import Footer from 'components/BottomMenu';
import PDF from 'components/PDF';
import topicals from './Maths_Topicals.json';

export default function MathsPage() {
  const [user, setUser] = useState(null);
  const [showTopicals, setShowTopicals] = useState(false);
  const [showP3Topicals, setShowP3Topicals] = useState(false);
  const navigation = useNavigation();

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

  const toggleTopicals = () => {
    setShowTopicals(prev => !prev);
    setShowP3Topicals(false);
  };

  const toggleP3Topicals = () => {
    setShowP3Topicals(prev => !prev);
    setShowTopicals(false);
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Topicals P1 Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Monoton' }]}>Topicals P1</Text>
            <TouchableOpacity onPress={toggleTopicals} style={styles.toggleButton}>
              <Text style={styles.toggleButtonText}>{showTopicals ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {showTopicals && (
            <View style={styles.grid}>
              {topicals.p1.map((item, idx) => (
                <View key={idx} style={styles.pdfCard}>
                  <PDF {...item} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Topicals P3 Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Monoton' }]}>Topicals P3</Text>
            <TouchableOpacity onPress={toggleP3Topicals} style={styles.toggleButton}>
              <Text style={styles.toggleButtonText}>{showP3Topicals ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {showP3Topicals && (
            <View style={styles.grid}>
              {topicals.p3.map((item, idx) => (
                <View key={idx} style={styles.pdfCard}>
                  <PDF {...item} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
  },
  toggleButton: {
    backgroundColor: '#ffaa00',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
grid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},

pdfCard: {
  marginLeft : 42,
  marginRight : 'auto',
  width: '155%',
  aspectRatio: 3 / 4,
  borderRadius: 8,
  marginBottom: 16,
  overflow: 'hidden',
},
});
