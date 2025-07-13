import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  StyleSheet,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useFonts } from 'expo-font';

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Signup: undefined;
};

export default function LandingPage() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [fadeAnim] = useState(new Animated.Value(0));

  const [fontsLoaded] = useFonts({
    Monoton: require('../assets/fonts/Monoton-Regular.ttf'),
  });

  // Redirect if token is already present
  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        navigation.navigate('Home');
      }
    };
    checkToken();
  }, []);

  // Run fade-in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" />

      <Text style={[styles.title, { fontFamily: 'Monoton' }]}>
        Nexus Learn
      </Text>

      <Text style={styles.subtitle}>
        Your all-in-one platform to prepare for O Levels, IGCSE, A Levels, and the SAT. View past papers, track progress, and improve smarter.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginButton}
        >
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          style={styles.signupButton}
        >
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    color: '#fff',
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '90%',
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16, // React Native 0.71+ supports gap. If not, use marginRight manually
  },
  loginButton: {
    backgroundColor: '#ffaa00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  loginText: {
    color: '#000',
    fontWeight: '600',
  },
  signupButton: {
    borderColor: '#ffaa00',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  signupText: {
    color: '#fff',
  },
});
