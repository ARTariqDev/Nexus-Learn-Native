import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-screens/reanimated';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HomePage from './pages/Home';
import SATPage from './pages/SAT/SAT';
import AlevelPage from 'pages/Alevel/Alevel';
import Physics from 'pages/Alevel/Physics/Physics';
import CSPage from 'pages/Alevel/CS/CS';
import StatsPage from 'pages/Stats';
import MathsPage from 'pages/Alevel/Maths/Maths';
import FurtherMathsPage from 'pages/Alevel/FM/FM';
import ITPage from 'pages/Alevel/IT/IT';
import IGCSEPage from 'pages/IGCSE/IGCSE';
import OlevelPage from 'pages/Olevel/Olevel';
import Updates from 'pages/Updates/Updates';
import Blog from 'pages/Updates/Blog';
import Contribute from 'pages/Contribute';
import AccOPage from 'pages/Olevel/AccO/AccO';
import MathsOPage from 'pages/Olevel/MathsO/MathsO';


const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('token');
      setInitialRoute(token ? 'Home' : 'Landing');
    };
    checkToken();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffaa00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Landing" component={LandingPage} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomePage} options={{ headerShown: false }} />
        <Stack.Screen name="SAT" component={SATPage} options={{ headerShown: false }} />
        <Stack.Screen name="Alevel" component={AlevelPage} options={{ headerShown: false }} />
        <Stack.Screen name="Physics" component={Physics} options={{ headerShown: false }} />
        <Stack.Screen name="CS" component={CSPage} options={{ headerShown: false }} />
        <Stack.Screen name="Stats" component={StatsPage} options={{ headerShown: false }} />
        <Stack.Screen name="Maths" component={MathsPage} options={{ headerShown: false }} />
        <Stack.Screen name="FM" component={FurtherMathsPage} options={{ headerShown: false }} />
        <Stack.Screen name="IT" component={ITPage} options={{ headerShown: false }} />
        <Stack.Screen name="IGCSE" component={IGCSEPage} options={{ headerShown: false }} />
        <Stack.Screen name="Olevel" component={OlevelPage} options={{ headerShown: false }} />
        <Stack.Screen name="Blog" component={Blog} options={{ headerShown: false }} />
        <Stack.Screen name="Updates" component={Updates} options={{ headerShown: false }} />
        <Stack.Screen name="Contribute" component={Contribute} options={{ headerShown: false }} />
        <Stack.Screen name="AccO" component={AccOPage} options={{ headerShown: false }} />
        <Stack.Screen name="MathsO" component={MathsOPage} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
