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
import Yearly from 'components/Yearly';
import PDF from 'components/PDF';
import fmYearlyData from './FM_Yearly.json';
import books from './FM_Books.json';
import sirAmjad from './FM_SA.json';
import { useFonts } from 'expo-font';
import Header from 'components/Header';
import { Picker } from '@react-native-picker/picker';

export default function FurtherMathsPage() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [year, setYear] = useState('2024');
  const [session, setSession] = useState('november');
  const [paperGroup, setPaperGroup] = useState('1');
  const [showBooks, setShowBooks] = useState(false);
  const [showSA, setShowSA] = useState(false);
  const [showFM2, setShowFM2] = useState(false);
  const [showPapers, setShowPapers] = useState(false);

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

  const allYears = [...new Set(fmYearlyData.map((item) => item.id.split('_')[1]))].sort().reverse();
  const filtered = fmYearlyData.filter((item) => {
    const [sess, yr, code] = item.id.split('_');
    return sess === session.toLowerCase() && yr === year && code.startsWith(paperGroup);
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
    <View style={styles.pageContainer}>
      <Header />
      <Text style={[styles.pageTitle, { fontFamily: 'Monoton' }]}>
                      A Level FM 9231
      </Text>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Sir Amjad Section */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Monoton' }]}>Topicals - Sir Amjad</Text>
            <TouchableOpacity onPress={() => setShowSA(!showSA)} style={styles.toggleButton}>
              <Text style={styles.toggleButtonText}>{showSA ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {showSA && (
            <View style={styles.cardColumn}>
              {sirAmjad.map((item, index) => (
                <View key={index} style={styles.cardFullWidth}>
                  <PDF {...item} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 2012–2021 Topicals */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Monoton' }]}>Topicals 2012–2021</Text>
            <TouchableOpacity onPress={() => setShowFM2(!showFM2)} style={styles.toggleButton}>
              <Text style={styles.toggleButtonText}>{showFM2 ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {showFM2 && (
            <View style={styles.cardColumn}>
              <View style={styles.cardFullWidth}>
                <PDF
                  name="Topicals (2012–2021)"
                  text1="Question paper"
                  link1="https://drive.google.com/file/d/1v3pu28h3QXz0WAdP7Q4v8omZN5McwCUD/view?usp=sharing"
                  size="4"
                />
              </View>
            </View>
          )}
        </View>

        {/* FM Books */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Monoton' }]}>Further Maths Books</Text>
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

        {/* FM Past Papers */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
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
                  </Picker>
                </View>
              </View>
              <View style={styles.cardColumn}>
                {filtered.length > 0 ? (
                  filtered.map((item, index) => (
                    <View key={index} style={{marginLeft: -36, width: "110%"}}>
                      <Yearly {...item} subject="FM" />
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
    marginLeft: 45,
    gap: 16,
  },
  cardFullWidth: {
    width: '185%',
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