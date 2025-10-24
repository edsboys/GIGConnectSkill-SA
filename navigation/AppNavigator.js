import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { auth } from '../firebaseConfig';

import JobDetail from '../app/JobDetail';
import JobFeed from '../app/JobFeed';
import LeaderboardScreen from '../app/LeaderboardScreen';
import LoginScreen from '../app/LoginScreen';
import PostJobScreen from '../app/PostJobScreen';
import RatingScreen from '../app/RatingScreen';
import SignupScreen from '../app/SignupScreen';
import SubmitProofScreen from '../app/SubmitProofScreen';
import WalletScreen from '../app/WalletScreen';
import ProfileScreen from '../app/ProfileScreen'; 
import LandingScreen from '../app/LandingScreen';// Your landing page

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="JobFeed" 
        component={JobFeed}
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <NavigationContainer>
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#6200ee' },
      headerTintColor: 'white',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    {user ? (
      <>
        {/* Authenticated users: Main app */}
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        {/* other authenticated screens */}
      </>
    ) : (
      <>
        {/* Unauthenticated users: Landing first */}
        <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account', headerBackTitle: 'Back' }} />
      </>
    )}
  </Stack.Navigator>
</NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AppNavigator;
