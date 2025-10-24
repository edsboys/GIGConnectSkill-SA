import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import JobFeed from '../screens/JobFeed';
import JobDetail from '../screens/JobDetail';
import PostJobScreen from '../screens/PostJobScreen';
import SubmitProofScreen from '../screens/SubmitProofScreen';
import WalletScreen from '../screens/WalletScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import RatingScreen from '../screens/RatingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="JobFeed" component={JobFeed} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      {/* Add Profile screen here later */}
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }}/>
            <Stack.Screen name="JobDetail" component={JobDetail} />
            <Stack.Screen name="PostJob" component={PostJobScreen} />
            <Stack.Screen name="SubmitProof" component={SubmitProofScreen} />
            <Stack.Screen name="Rating" component={RatingScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
