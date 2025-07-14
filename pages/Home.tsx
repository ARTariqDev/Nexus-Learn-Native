import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { useFonts } from 'expo-font';
import ResourcesCard from 'components/Resources';
import Footer from 'components/BottomMenu';
import Header from 'components/Header';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Monoton: require('../assets/fonts/Monoton-Regular.ttf'),
  });

  useEffect(() => {
    const checkTokenAndFetchUser = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        navigation.navigate('Login' as never);
        return;
      }

      try {
        const decoded = jwtDecode(token) as { username: string };
        const res = await fetch(`https://nexuslearn-mu.vercel.app/api/user?username=${decoded.username}`);
        const data = await res.json();

        if (res.ok && data.username) {
          setUser(data);
        } else {
          console.warn('Fallback to decoded username');
          setUser({ username: decoded.username });
        }
      } catch (err) {
        console.error('Error decoding token or fetching user:', err);
        try {
          const fallback = jwtDecode(token) as { username: string };
          setUser({ username: fallback.username });
        } catch (e) {
          console.error('Fallback decode failed:', e);
        }
      } finally {
        setLoading(false);
      }
    };

    checkTokenAndFetchUser();
  }, []);

  const handleViewStats = () => {
    navigation.navigate('Stats' as never);
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
      <Header />

      <ScrollView style={styles.container}>
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>
            Welcome back {"\n"}
            {user?.username ? `${user.username}` : ''}!
          </Text>
          <Text style={styles.subText}>Explore resources and track your progress</Text>
        </View>

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
          <Text style={styles.statsTitle}>Insights</Text>
          <TouchableOpacity onPress={handleViewStats} style={styles.statsCard}>
            <Text style={styles.statsCardText}>View Your Stats</Text>
          </TouchableOpacity>
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
    marginTop: 12,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  welcomeBox: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#111',
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monoton',
    color: '#ffaa00',
    marginBottom: 4,
  },
  subText: {
    color: '#ccc',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Monoton',
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    columnGap: 12,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Monoton',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#ffaa00',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statsCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
