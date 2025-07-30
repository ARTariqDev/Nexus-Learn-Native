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
import { Picker } from '@react-native-picker/picker';
import Header from 'components/Header';
import Footer from 'components/BottomMenu';
import PDF from 'components/PDF';
import Yearly from 'components/Yearly';
import physicsYearlyData from './Physics_Yearly.json';

export default function Physics() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBooks, setShowBooks] = useState(false);
  const [showPapers, setShowPapers] = useState(false);
  const [year, setYear] = useState('2025');
  const [session, setSession] = useState('march');
  const [paperGroup, setPaperGroup] = useState('1');
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

  // Extract all years from the data and sort them in descending order
  const allYears = [...new Set(physicsYearlyData.map((item) => item.id.split('_')[1]))].sort().reverse();
  
  // Filter data based on selected year, session, and paper group
  const filtered = physicsYearlyData.filter((item) => {
    const [sess, yr, code] = item.id.split('_');
    return sess === session.toLowerCase() && yr === year && code.startsWith(paperGroup);
  });

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

      <Text style={[styles.pageTitle, { fontFamily: 'Monoton' }]}>
        A Level Physics 9702
      </Text>
      
      <ScrollView contentContainerStyle={styles.container}>
        {/* Books Section */}
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

        {/* Physics Past Papers Section */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Monoton' }]}>Yearly Past Papers</Text>
            <TouchableOpacity onPress={() => setShowPapers(!showPapers)} style={styles.toggleButton}>
              <Text style={styles.toggleText}>{showPapers ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {showPapers && (
            <>
              <View style={styles.selectorRow}>
                <Text style={styles.selectorLabel}>Year:</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={year}
                    onValueChange={(itemValue) => setYear(itemValue)}
                    style={styles.picker}
                    mode="dropdown"
                    dropdownIconRippleColor="#ffaa00"
                  >
                    {allYears.map((y) => (
                      <Picker.Item key={y} label={y} value={y} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={styles.selectorRow}>
                <Text style={styles.selectorLabel}>Session:</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={session}
                    onValueChange={(itemValue) => setSession(itemValue)}
                    style={styles.picker}
                    mode="dropdown"
                    dropdownIconRippleColor="#ffaa00"
                  >
                    <Picker.Item label="Feb/March" value="march" />
                    <Picker.Item label="May/June" value="june" />
                    <Picker.Item label="Oct/Nov" value="november" />
                  </Picker>
                </View>
              </View>
              <View style={styles.selectorRow}>
                <Text style={styles.selectorLabel}>Paper:</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={paperGroup}
                    onValueChange={(itemValue) => setPaperGroup(itemValue)}
                    style={styles.picker}
                    mode="dropdown"
                    dropdownIconRippleColor="#ffaa00"
                  >
                    <Picker.Item label="P1 (11,12,13)" value="1" />
                    <Picker.Item label="P2 (21,22,23)" value="2" />
                    <Picker.Item label="P3 (31-36)" value="3" />
                    <Picker.Item label="P4 (41,42,43)" value="4" />
                    <Picker.Item label="P5 (51,52,53)" value="5" />
                  </Picker>
                </View>
              </View>
              <View style={styles.cardColumn}>
                {filtered.length > 0 ? (
                  filtered.map((item, index) => (
                    <View key={index} style={{marginLeft: -36, width: "110%"}}>
                      <Yearly {...item} subject="Physics" />
                    </View>
                  ))
                ) : (
                  <Text style={styles.noResultsText}>No papers found for this selection.</Text>
                )}
              </View>
            </>
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
  pageTitle: {
    color: '#ffaa00',
    fontSize: 28,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 24,
    letterSpacing: 1.5,
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
    paddingBottom: 160,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
    flex: 1,
  },
  toggleButton: {
    backgroundColor: '#ffaa00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
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
  cardColumn: {
    flexDirection: 'column',
    marginLeft: 45,
    gap: 16,
  },
  selectorRow: {
    marginBottom: 12,
  },
  selectorLabel: {
    color: '#aaa',
    marginBottom: 4,
    fontSize: 14,
  },
  pickerWrapper: {
    backgroundColor: '#1a1a1a',
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  picker: {
    color: '#fff',
    height: 55,
    width: '100%',
  },
  noResultsText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});