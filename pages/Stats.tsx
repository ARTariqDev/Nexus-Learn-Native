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


// Types
interface Score {
  subject: string;
  paper: string;
  date: string;
  score: number;
}

interface DecodedToken {
  username: string;
  [key: string]: any;
}

const StatsPage = () => {
  // Add level state
  const [level, setLevel] = useState<'O' | 'A'>('O');
  // add subjects here (im adding O at the end to indicate O level subjects)
  const subjects = [
    { label: 'Accounting (O Level)', value: 'AccO' },
    { label: 'Maths (O Level)', value: 'MathsO' },
    { label: 'Accounting (A Level)', value: 'Acc' },
    { label: 'Further Maths (A Level)', value: 'FM' },
    { label: 'Computer Science (A Level)', value: 'CS' },
  ];
  // Paper groups for O level (since they MAX go to 33)
  const oLevelPapers = [
    { label: 'P1 (11,12,13)', value: '1' },
    { label: 'P2 (21,22,23)', value: '2' },
    { label: 'P3 (31,32,33)', value: '3' },
  ];
  // Paper groups for A level (since they MAX go to 63 but will be 43 for now)
  const aLevelPapers = [
    { label: 'Paper 1', value: '1' },
    { label: 'Paper 2', value: '2' },
    { label: 'Paper 3', value: '3' },
    { label: 'Paper 4', value: '4' },
  ];

  const [username, setUsername] = useState<string | null>(null);
  const [subject, setSubject] = useState('AccO');
  const [paperFilter, setPaperFilter] = useState('1');
  const [timeRange, setTimeRange] = useState('all');
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Monoton: require('../assets/fonts/Monoton-Regular.ttf'),
  });
  // Update subject and paper when level changes
  useEffect(() => {
    if (level === 'O') {
      setSubject('AccO');
      setPaperFilter('1');
    } else {
      setSubject('AccA');
      setPaperFilter('1');
    }
  }, [level]);

  useEffect(() => {
    let isMounted = true;

    const fetchUserAndScores = async () => {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync('token');
        if (!token || !isMounted) return;

        const decoded = jwtDecode(token) as DecodedToken;
        if (typeof decoded === 'object' && decoded.username) {
          if (!isMounted) return;
          setUsername(decoded.username);

          const res = await fetch(`https://nexuslearn-mu.vercel.app/api/scores?username=${decoded.username}`);
          if (!res.ok || !isMounted) return;
          const data = await res.json();
          if (Array.isArray(data)) setScores(data as Score[]);
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

  // Separate effect to handle filter changes and show data loading
  useEffect(() => {
    if (!loading && scores.length > 0) {
      setDataLoading(true);
      // Small delay to show loading state when filters change
      const timer = setTimeout(() => {
        setDataLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [subject, paperFilter, timeRange, loading, scores.length]);

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

  const renderChartContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#ffaa00" />
          <Text style={styles.loadingText}>Fetching your performance data...</Text>
        </View>
      );
    }

    if (dataLoading) {
      return (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#ffaa00" />
          <Text style={styles.loadingText}>Updating chart data...</Text>
        </View>
      );
    }

    if (filtered.length === 0) {
      return <Text style={styles.noData}>No data for this selection</Text>;
    }

    return (
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
            height={300} // Add explicit height
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
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Performance Stats</Text>

        {/* Level Picker */}
        <View style={styles.pickerRow}>
          <Picker
            selectedValue={level}
            style={styles.picker}
            onValueChange={setLevel}
            mode="dropdown"
            dropdownIconRippleColor="#ffaa00"
          >
            <Picker.Item label="O Level" value="O" />
            <Picker.Item label="A Level" value="A" />
          </Picker>
        </View>

        {/* Subject and Paper Picker */}
        <View style={styles.pickerRow}>
          <Picker
            selectedValue={subject}
            style={styles.picker}
            onValueChange={setSubject}
            mode="dropdown"
            dropdownIconRippleColor="#ffaa00"
            enabled={true}
          >
            {subjects
              .filter(s => (level === 'O' ? s.value.endsWith('O') : !s.value.endsWith('O')))
              .map(s => (
                <Picker.Item key={s.value} label={s.label} value={s.value} />
              ))}
          </Picker>
          <Picker
            selectedValue={paperFilter}
            style={styles.picker}
            onValueChange={setPaperFilter}
            mode="dropdown"
            dropdownIconRippleColor="#ffaa00"
          >
            {(level === 'O' ? oLevelPapers : aLevelPapers).map(p => (
              <Picker.Item key={p.value} label={p.label} value={p.value} />
            ))}
          </Picker>
          <Picker
            selectedValue={timeRange}
            style={styles.picker}
            onValueChange={setTimeRange}
            mode="dropdown"
            dropdownIconRippleColor="#ffaa00"
          >
            <Picker.Item label="All Time" value="all" />
            <Picker.Item label="Past Day" value="1d" />
            <Picker.Item label="Past 3 Days" value="3d" />
            <Picker.Item label="Past Week" value="1w" />
            <Picker.Item label="Past Month" value="1m" />
            <Picker.Item label="Past Year" value="1y" />
          </Picker>
        </View>

        {renderChartContent()}
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
    paddingBottom: 120, // Extra space for chart and footer
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
    marginBottom: 20, // Add margin bottom
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