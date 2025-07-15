import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import Footer from 'components/BottomMenu';
import Header from 'components/Header';
import { useFonts } from 'expo-font';
import { LineChart } from 'react-native-gifted-charts';

const screenWidth = Dimensions.get('window').width;

const StatsPage = () => {
  const [username, setUsername] = useState(null);
  const [subject, setSubject] = useState('CS');
  const [paperFilter, setPaperFilter] = useState('1');
  const [timeRange, setTimeRange] = useState('all');
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Monoton: require('../assets/fonts/Monoton-Regular.ttf'),
  });

  useEffect(() => {
    let isMounted = true;

    const fetchUserAndScores = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token || !isMounted) return;

        const decoded = jwtDecode(token);
        if (typeof decoded === 'object' && decoded.username) {
          if (!isMounted) return;
          setUsername(decoded.username);

          const res = await fetch(`https://nexuslearn-mu.vercel.app/api/scores?username=${decoded.username}`);
          if (!res.ok || !isMounted) return;
          const data = await res.json();
          if (Array.isArray(data)) setScores(data);
        } else {
          console.error('Decoded token missing username:', decoded);
        }
      } catch (err) {
        console.error('Error decoding token or fetching scores:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserAndScores();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (username) {
      fetch(`/api/scores?username=${username}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setScores(data);
        })
        .catch(err => console.error('Error fetching scores:', err))
        .finally(() => setLoading(false));
    }
  }, [username]);

  const getTimeThreshold = () => {
    const now = new Date();
    switch (timeRange) {
      case '1d': return new Date(now.setDate(now.getDate() - 1));
      case '3d': return new Date(now.setDate(now.getDate() - 3));
      case '1w': return new Date(now.setDate(now.getDate() - 7));
      case '1m': return new Date(now.setMonth(now.getMonth() - 1));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return null;
    }
  };

  const timeThreshold = getTimeThreshold();
  const filtered = scores
    .filter(s => {
      const variant = s.paper?.split('_')[2] || '';
      const date = new Date(s.date);
      return (
        s.subject === subject &&
        variant.startsWith(paperFilter) &&
        (!timeThreshold || date >= timeThreshold)
      );
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const formatPaperLabel = (paper: string) => {
    const parts = paper?.split('_'); // ['november', '2024', '12']
    if (parts.length !== 3) return paper;

    const [month, year, variant] = parts;
    const monthCode = {
      june: 'S',
      may: 'S',
      november: 'W',
      october: 'W',
      march: 'M',
    }[month.toLowerCase()] || '?';

    return `${monthCode}${year.slice(2)}${variant}`;
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Performance Stats</Text>

        <View style={styles.pickerRow}>
          {[{
            value: subject,
            setter: setSubject,
            items: [
              ['Computer Science', 'CS'], ['Physics', 'Physics'], ['Maths', 'Maths'],
              ['English', 'English'], ['Further Maths', 'FM'], ['IT', 'IT']
            ]
          }, {
            value: paperFilter,
            setter: setPaperFilter,
            items: Array.from({ length: 5 }, (_, i) => [`Paper ${i + 1}`, `${i + 1}`])
          }, {
            value: timeRange,
            setter: setTimeRange,
            items: [
              ['All Time', 'all'], ['Past Day', '1d'], ['Past 3 Days', '3d'],
              ['Past Week', '1w'], ['Past Month', '1m'], ['Past Year', '1y']
            ]
          }].map((picker, index) => (
            <Picker
              key={index}
              selectedValue={picker.value}
              style={styles.picker}
              onValueChange={picker.setter}
              mode="dropdown"
              dropdownIconRippleColor="#ffaa00"
            >
              {picker.items.map(([label, value]) => (
                <Picker.Item key={value} label={label} value={value} />
              ))}
            </Picker>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color="#ffaa00" />
            <Text style={styles.loadingText}>Fetching your performance data...</Text>
          </View>
        ) : filtered.length ? (
          <ScrollView horizontal contentContainerStyle={{ paddingRight: 20 }}>
            <View style={styles.chartWrapper}>
              <LineChart
                data={filtered.map(s => ({
                  value: s.score,
                  label: formatPaperLabel(s.paper),
                  labelTextStyle: { color: '#fff', fontSize: 12 },
                  dataPointText: `${s.score}`,
                }))}
                width={Math.max(filtered.length * 100, screenWidth)}
                thickness={2.5}
                color="#ffaa00"
                hideDataPoints={false}
                areaChart
                startFillColor="rgba(255,170,0,0.3)"
                endFillColor="rgba(255,170,0,0.05)"
                startOpacity={1}
                endOpacity={0.1}
                xAxisLabelTextStyle={{ color: '#fff', fontSize: 11, maxWidth: 80 }}
                yAxisTextStyle={{ color: '#fff' }}
                rulesColor="#333"
                noOfSections={5}
                maxValue={100}
                backgroundColor="transparent"
                hideRules={false}
                initialSpacing={30}
                yAxisColor="#444"
                xAxisColor="#444"
                yAxisTextNumberOfLines={1}
                dataPointsColor="#ffaa00"
                curved
                isAnimated
              />
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.noData}>No data for this selection</Text>
        )}
      </ScrollView>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  title: {
    color: '#ffaa00',
    fontFamily: 'Monoton',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  pickerRow: {
    marginBottom: 24,
    gap: 12,
  },
  picker: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    marginVertical: 4,
    borderRadius: 8,
  },
  chartWrapper: {
    borderRadius: 16,
    backgroundColor: '#111',
    padding: 12,
    shadowColor: '#ffaa00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  noData: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 16,
    marginTop: 30,
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#ffaa00',
    fontSize: 16,
    marginTop: 10,
  },
});

export default StatsPage;
