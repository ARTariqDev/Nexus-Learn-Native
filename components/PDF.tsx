import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';

interface PDFProps {
  name: string;
  size: string;
  link1: string;
  link2?: string;
  text1: string;
  text2?: string;
}

export default function PDF({
  name,
  size,
  link1,
  link2,
  text1,
  text2,
}: PDFProps) {
  const sizeMap: Record<string, number> = {
    '1': 12,
    '2': 16,
    '3': 20,
    '4': 24,
    '5': 26,
    '6': 30,
  };

  const fontSize = sizeMap[size] || 8;

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { fontSize }]}>{name}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => openLink(link1)}
      >
        <Text style={styles.buttonText}>{text1}</Text>
      </TouchableOpacity>

      {link2 && text2 && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => openLink(link2)}
        >
          <Text style={styles.buttonText}>{text2}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderColor: '#6c6c6c',
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    minHeight: 200,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Monoton',
    color: '#ffaa00',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#ffaa00',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
