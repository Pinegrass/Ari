import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useBiometric } from '../hooks/useBiometric';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import Icon from '../components/ui/Icon';
import { color, font } from '../theme/tokens';
import type { RootStackParamList } from './navigationTypes';

const Stack = createStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = 'ari_onboarding_done';

function BiometricLockScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={lockStyles.container}>
      <Icon name="lock" size={64} color={color.inkFaint} />
      <Text style={lockStyles.title}>Ari is Locked</Text>
      <Text style={lockStyles.subtitle}>Authenticate to continue</Text>
      <TouchableOpacity style={lockStyles.btn} onPress={onRetry} activeOpacity={0.85}>
        <Text style={lockStyles.btnText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const lockStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.cream,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 24, fontFamily: font.displayBold, color: color.ink },
  subtitle: { fontSize: 15, fontFamily: font.body, color: color.inkSoft, marginBottom: 24 },
  btn: {
    backgroundColor: color.forest,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: { fontSize: 16, fontFamily: font.bodyBold, color: color.cream },
});

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { isAuthenticated, isChecking, authenticate } = useBiometric();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val && !user) setShowOnboarding(true);
      setOnboardingChecked(true);
    });
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  if (loading || !onboardingChecked || isChecking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color.cream,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={color.forest} />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  // Show biometric lock screen if user is logged in but not authenticated
  if (user && !isAuthenticated) {
    return <BiometricLockScreen onRetry={authenticate} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
