import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export default function BottomNavBar() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    setMenuVisible(false);
    navigation.navigate('Landing' as never);
  };

  return (
    <>
      {/* Bottom Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Home' as never)}>
          <Ionicons name="home" size={26} color="#ffaa00" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Dashboard' as never)}>
          <Ionicons name="grid" size={26} color="#ffaa00" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={28} color="#ffaa00" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal visible={menuVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.menu}>
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.menuTitle}>Menu</Text>

            <TouchableOpacity onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Home' as never);
            }}>
              <Text style={styles.menuItem}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Dashboard' as never);
            }}>
              <Text style={styles.menuItem}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout}>
              <Text style={[styles.menuItem, { color: '#f87171' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 20, // Add margin from bottom to avoid overlap with phone UI
    left: 0,
    right: 0,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  menu: {
    backgroundColor: '#111',
    padding: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    width: '70%',
  },
  menuTitle: {
    fontSize: 20,
    color: '#ffaa00',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  menuItem: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 10,
  },
});
