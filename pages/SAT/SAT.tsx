import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFonts } from 'expo-font';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import PDF from 'components/PDF';
import data from './SAT.json';
import { Ionicons } from '@expo/vector-icons';
import Header from 'components/Header';
import Footer from 'components/BottomMenu';

export default function SATPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fontsLoaded] = useFonts({
    Monoton: require('../../assets/fonts/Monoton-Regular.ttf'),
  });

  const navigation = useNavigation();
  const [showEnglish, setShowEnglish] = useState(false);
  const [showMaths, setShowMaths] = useState(false);
  const [showCombined, setShowCombined] = useState(false);

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

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    setMenuVisible(false);
    navigation.navigate('Landing' as never);
  };

  const renderSection = (
    title: string,
    dataArray: any[],
    showState: boolean,
    setShowState: any
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity
          onPress={() => setShowState(!showState)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>{showState ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      {showState && (
        <View style={styles.grid}>
          {dataArray.map((item, idx) => (
            <PDF key={idx} {...item} />
          ))}
        </View>
      )}
    </View>
  );

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
      <Header/>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSection('SAT - English', data.english, showEnglish, setShowEnglish)}
        {renderSection('SAT - Maths', data.maths, showMaths, setShowMaths)}
        {renderSection('SAT - Combined Resources', data.combined, showCombined, setShowCombined)}
      </ScrollView>
      
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding to account for bottom navigation
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
  header: {
    textAlign: 'center',
    marginTop: 40,
    padding: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 30,
    fontFamily: 'Monoton',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Monoton',
    flexShrink: 1,
    paddingRight: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  menu: {
    backgroundColor: '#111',
    padding: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    width: '70%',
  },
  menuTitle: {
    fontSize: 20,
    color: '#ffaa00',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  menuItem: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 10,
  },
});