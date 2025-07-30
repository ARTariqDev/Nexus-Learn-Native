import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import topicals from './Maths_Topicals.json';
import mathsYearlyData from './Maths_Yearly.json';

export default function MathsPage() {
  const [user, setUser] = useState(null);
  const [showTopicals, setShowTopicals] = useState(false);
  const [showP3Topicals, setShowP3Topicals] = useState(false);
  const [showPapers, setShowPapers] = useState(false);
  const [year, setYear] = useState('2024');
  const [session, setSession] = useState('november');
  const [paperGroup, setPaperGroup] = useState('1');
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

  // Get all unique years from the yearly data and sort them
  const allYears = [...new Set(mathsYearlyData.map((item) => item.id.split('_')[1]))].sort().reverse();
  
  // Filter yearly data based on selected criteria
  const filtered = mathsYearlyData.filter((item) => {
    const [sess, yr, code] = item.id.split('_');
    // Handle different session naming conventions
    const sessionMatch = sess === session.toLowerCase() || 
                         (session === 'march' && (sess === 'march' || sess === 'february'));
    return sessionMatch && yr === year && code.startsWith(paperGroup);
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#ffaa00" />
        <Text style={styles.loadingText}>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <Text style={[styles.pageTitle, { fontFamily: 'Monoton' }]}>
                                  A Level Maths 9709
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContainer}>

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

        {/* Yearly Past Papers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Monoton' }]}>Yearly Past Papers</Text>
            <TouchableOpacity onPress={() => setShowPapers(!showPapers)} style={styles.toggleButton}>
              <Text style={styles.toggleButtonText}>{showPapers ? 'Hide' : 'Show'}</Text>
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
                    <Picker.Item label="P3 (31,32,33)" value="3" />
                    <Picker.Item label="P4 (41,42,43)" value="4" />
                    <Picker.Item label="P4 (51,52,53)" value="5" />
                    <Picker.Item label="P6 (61,62,63)" value="6" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.cardColumn}>
                {filtered.length > 0 ? (
                  filtered.map((item, index) => (
                    <View key={index} style={{marginLeft: -36, width: "110%"}}>
                      <Yearly {...item} subject="Maths" />
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
  container: {
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
    flex: 1,
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
    marginLeft: 42,
    marginRight: 'auto',
    width: '155%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
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
  cardColumn: {
    flexDirection: 'column',
    marginLeft: 45,
    gap: 16,
  },
  noResultsText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
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
});