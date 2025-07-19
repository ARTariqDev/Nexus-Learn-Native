import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import * as NavigationBar from 'expo-navigation-bar';

export default function BottomNavBar() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    // Hide the native navigation bar
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    
    // Set up interval to periodically hide the navigation bar if it becomes visible
    const hideNavInterval = setInterval(() => {
      NavigationBar.setVisibilityAsync('hidden');
    }, 2000); // Check every 2 seconds
    
    // Cleanup function to restore navigation bar when component unmounts
    return () => {
      clearInterval(hideNavInterval);
      NavigationBar.setVisibilityAsync('visible');
    };
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    setMenuVisible(false);
    navigation.navigate('Landing' as never);
  };

  return (
    <>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#ffaa00" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home' as never)}>
          <Ionicons name="home" size={26} color="#ffaa00" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={() => setMenuVisible(true)}>
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
              navigation.goBack();
            }}>
              <Text style={styles.menuItem}>Back</Text>
            </TouchableOpacity>
            
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
    bottom: 0,
    paddingBottom: 20, // Reduced since native nav is hidden
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
  navButton: {
    padding: 5, // Increased hit area
    borderRadius: 10, // Optional: rounded corners for visual feedback
    minWidth: 50, // Minimum width for better touch area
    minHeight: 30, // Minimum height for better touch area
    justifyContent: 'center',
    alignItems: 'center',
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