import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import Footer from 'components/BottomMenu';
import Header from 'components/Header';
import { useFonts } from 'expo-font';

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
    const fetchUser = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.username);
      } catch (err) {
        console.error('Invalid token:', err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (username) {
      fetch(`https://nexuslearn-mu.vercel.app/api/scores?username=${username}`)
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
  const filtered = scores.filter(s => {
    const variant = s.paper?.split('_')[2] || '';
    const date = new Date(s.date);
    return (
      s.subject === subject &&
      variant.startsWith(paperFilter) &&
      (!timeThreshold || date >= timeThreshold)
    );
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const chartData = {
    labels: filtered.map(s => new Date(s.date).toLocaleDateString()),
    datasets: [
      {
        data: filtered.map(s => parseFloat(s.score.toFixed(2))),
        color: () => '#ffaa00',
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Performance Stats</Text>

        <View style={styles.pickerRow}>
          <Picker
            selectedValue={subject}
            style={styles.picker}
            onValueChange={(itemValue) => setSubject(itemValue)}
            mode="dropdown"
            >
            <Picker.Item label="Computer Science" value="CS" />
            <Picker.Item label="Physics" value="Physics" />
            <Picker.Item label="Maths" value="Maths" />
            <Picker.Item label="English" value="English" />
            <Picker.Item label="Further Maths" value="FM" />
            <Picker.Item label="IT" value="IT" />
          </Picker>

          <Picker
            selectedValue={paperFilter}
            style={styles.picker}
            onValueChange={(itemValue) => setPaperFilter(itemValue) }  mode="dropdown" dropdownIconRippleColor="#ffaa00">
            {[1, 2, 3, 4, 5].map(num => (
              <Picker.Item
                key={num}
                label={`Paper ${num}`}
                value={String(num)}
              />
            ))}
          </Picker>

          <Picker
            selectedValue={timeRange}
            style={styles.picker}
            onValueChange={(itemValue) => setTimeRange(itemValue)}  mode="dropdown" dropdownIconRippleColor="#ffaa00">
            <Picker.Item label="All Time" value="all" />
            <Picker.Item label="Past Day" value="1d" />
            <Picker.Item label="Past 3 Days" value="3d" />
            <Picker.Item label="Past Week" value="1w" />
            <Picker.Item label="Past Month" value="1m" />
            <Picker.Item label="Past Year" value="1y" />
          </Picker>
        </View>

        {loading ? (
          <ActivityIndicator color="#ffaa00" />
        ) : filtered.length ? (
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={250}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noData}>No data for this selection</Text>
        )}
      </ScrollView>
      <Footer />
    </View>
  );
};

const chartConfig = {
  backgroundColor: '#000',
  backgroundGradientFrom: '#1a1a1a',
  backgroundGradientTo: '#1a1a1a',
  decimalPlaces: 0,
  color: () => `#ffaa00`,
  labelColor: () => `#ffffff`,
  propsForDots: {
    r: '4',
    strokeWidth: '1',
    stroke: '#ffaa00',
  },
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
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  pickerRow: {
    marginBottom: 20,
  },
  picker: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    marginVertical: 6,
  },
  chart: {
    borderRadius: 12,
  },
  noData: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 16,
    marginTop: 30,
  },
});

export default StatsPage;
