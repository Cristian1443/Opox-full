import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import useNetworkWatcher from './src/hooks/useNetworkWatcher';

function NetworkWatcher() {
  useNetworkWatcher();
  return null;
}

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <NetworkWatcher />
      <OnboardingNavigator />
    </NavigationContainer>
  );
}