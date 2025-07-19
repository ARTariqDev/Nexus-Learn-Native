// components/Header.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';

export default function Header() {
  const [fontsLoaded] = useFonts({
    Monoton: require('../assets/fonts/Monoton-Regular.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Nexus Learn</Text>
      <View style={{ width: 28 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    textAlign: 'center',
    padding: 30,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    justifyContent: 'space-between',
    paddingTop : 50,
    paddingBottom: 30
  },
  headerTitle: {
    color: '#fff',
    fontSize: 35,
    fontFamily: 'Monoton',
    textAlign: 'center',
  },
});
