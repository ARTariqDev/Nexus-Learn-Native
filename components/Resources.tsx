import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Props = {
  title: string;
  route: string;
};

export default function ResourcesCard({ title, route }: Props) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(route as never)}
    >
      <Text style={styles.cardText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '47%',
    marginBottom: 16,
    borderColor: '#ffaa00',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    color: '#ffaa00',
    fontSize: 18,
    fontFamily: 'Monoton',
    textAlign: 'center',
  },
});
