import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useFonts } from 'expo-font';
import ResourcesCard from 'components/Resources';
import { Ionicons } from '@expo/vector-icons';
import Footer from 'components/BottomMenu';
import Header from 'components/Header';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Monoton: require('../assets/fonts/Monoton-Regular.ttf'),
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

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    setMenuVisible(false);
    navigation.navigate('Landing' as never);
  };

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
      {/* Header */}
      <Header/>

      {/* Main Content */}
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.title}>Resources</Text>
          <View style={styles.grid}>
            <ResourcesCard title="O Levels" route="Olevels" />
            <ResourcesCard title="A Levels" route="Alevel" />
            <ResourcesCard title="IGCSE" route="IGCSE" />
            <ResourcesCard title="SAT" route="SAT" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>
            Under Construction, more{'\n'}features on the Way!
          </Text>
        </View>
      </ScrollView>
      <Footer/>
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
    marginTop: 12,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Monoton',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Monoton',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 24,
    fontFamily: 'Monoton',
    textAlign: 'center',
    lineHeight: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
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
