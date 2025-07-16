import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

interface YearlyProps {
  name: string;
  size: string;
  qp?: string;
  ms?: string;
  sf?: string;
  text1?: string;
  text2?: string;
  text3?: string;
  id: string;
  subject: string;
}

const Yearly: React.FC<YearlyProps> = ({ 
  name, 
  size, 
  qp, 
  ms, 
  sf, 
  text1, 
  text2, 
  text3, 
  id, 
  subject 
}) => {
  const [username, setUsername] = useState<string | null>(null);
  const [scored, setScored] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [percentage, setPercentage] = useState<number | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) return;

        const decoded = jwtDecode<{ username: string }>(token);
        setUsername(decoded.username);

        const url = `https://nexuslearn-mu.vercel.app/api/scores?username=${decoded.username}&subject=${subject}&paper=${id}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          console.error('Failed to fetch score:', res.status);
          return;
        }

        const data = await res.json();

        if (data?.score !== undefined) {
          setScored(data.scored?.toString() || '');
          setTotal(data.total?.toString() || '');
          setPercentage(data.score);
        }
      } catch (err) {
        console.error('Token decode or fetch error:', err);
      }
    };

    fetchScore();
  }, [id, subject]);

  const convertDriveLink = (url: string): string => {
    const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : url;
  };

  const openPDF = async (url: string) => {
    try {
      const finalUrl = convertDriveLink(url);
      const supported = await Linking.canOpenURL(finalUrl);
      if (supported) {
        await Linking.openURL(finalUrl);
      } else {
        Alert.alert('Error', 'Cannot open the PDF link.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open file.');
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!username) {
      return Alert.alert('Error', 'You must be logged in to submit a score.');
    }

    const scoredNum = parseFloat(scored);
    const totalNum = parseFloat(total);
    
    if (isNaN(scoredNum) || isNaN(totalNum) || totalNum === 0) {
      return Alert.alert('Invalid Input', 'Please enter valid marks.');
    }

    if (scoredNum < 0 || scoredNum > totalNum) {
      return Alert.alert('Invalid Input', 'Scored marks cannot be negative or greater than total marks.');
    }

    const scorePercent = (scoredNum / totalNum) * 100;

    try {
      const res = await fetch('https://nexuslearn-mu.vercel.app/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          subject,
          paper: id,
          scored: scoredNum,
          total: totalNum,
          score: scorePercent,
          date: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setPercentage(scorePercent);
        setScored(scoredNum.toString());
        setTotal(totalNum.toString());
        Alert.alert('Success', `Score saved! You got ${scorePercent.toFixed(2)}%`);
      } else {
        Alert.alert('Error', data.error || 'Failed to save score');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
      console.error('Network error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: 18 + (parseInt(size) || 1) * 2 }]}>
        {name || 'Untitled'}
      </Text>

      {percentage !== null && (
        <Text style={styles.scoreText}>
          {scored} / {total} → {percentage.toFixed(2)}%
        </Text>
      )}

      <View style={styles.buttonRow}>
        {qp && text1 && (
          <TouchableOpacity onPress={() => openPDF(qp)} style={styles.button}>
            <Text style={styles.buttonText}>
              {text1 === 'View Question Paper' ? 'QP' : text1}
            </Text>
          </TouchableOpacity>
        )}
        {ms && text2 && (
          <TouchableOpacity onPress={() => openPDF(ms)} style={styles.button}>
            <Text style={styles.buttonText}>
              {text2 === 'View Mark Scheme' ? 'MS' : text2}
            </Text>
          </TouchableOpacity>
        )}
        {sf && text3 && (
          <TouchableOpacity onPress={() => openPDF(sf)} style={styles.button}>
            <Text style={styles.buttonText}>
              {text3 === 'View Source Files' ? 'SF' : text3}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={scored}
          onChangeText={setScored}
          placeholder="Scored"
          placeholderTextColor="#888"
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          value={total}
          onChangeText={setTotal}
          placeholder="Total"
          placeholderTextColor="#888"
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Save Score</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderColor: '#6c6c6c',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  title: {
    color: '#ffaa00',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Monoton',
  },
  scoreText: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 12,
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#ffaa00',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  buttonText: {
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#606060',
    color: '#ffffff',
    padding: 8,
    borderRadius: 6,
    borderColor: '#444',
    borderWidth: 1,
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#ffaa00',
    paddingVertical: 10,
    borderRadius: 6,
  },
  submitButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
    fontSize: 14,
  },
});

export default Yearly;