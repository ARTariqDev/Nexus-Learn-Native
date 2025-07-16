import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
  const convertDriveLink = (url: string): string => {
    const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : url;
  };

  const handleOpenPDF = async (url: string) => {
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

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: 18 + (parseInt(size) || 1) * 2 }]}>
        {name || 'Untitled'}
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleOpenPDF(link1)}
        >
          <Text style={styles.buttonText}>{text1}</Text>
        </TouchableOpacity>

        {link2 && text2 && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleOpenPDF(link2)}
          >
            <Text style={styles.buttonText}>{text2}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderColor: '#6c6c6c',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '50%',
  },
  title: {
    color: '#ffaa00',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Monoton',
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
    flexGrow: 1,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  buttonText: {
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
