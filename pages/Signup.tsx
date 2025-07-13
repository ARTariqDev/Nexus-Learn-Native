import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SignupPage() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('https://nexuslearn-mu.vercel.app/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        navigation.navigate('Login');
      } else {
        const data = await res.json();
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Network error');
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Sign Up</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          style={styles.signupButton}
        >
          <Text style={styles.signupText}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        {error !== '' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
          >
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  form: {
    backgroundColor: '#121212',
    padding: 24,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  error: {
    color: '#f87171',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#111',
    borderColor: '#444',
    borderWidth: 1,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  signupButton: {
    backgroundColor: '#ffaa00',
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  signupText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#ffaa00',
    paddingVertical: 12,
    borderRadius: 6,
  },
  loginText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
