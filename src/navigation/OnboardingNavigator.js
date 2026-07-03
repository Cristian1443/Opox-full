import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/onboarding/SplashScreen';
import SplashNoConnectionScreen from '../screens/onboarding/SplashNoConnectionScreen';
import SplashUpdateScreen from '../screens/onboarding/SplashUpdateScreen';
import OnboardingSliderScreen from '../screens/onboarding/OnboardingSliderScreen';
import OppositionSelectorScreen from '../screens/onboarding/OppositionSelectorScreen';
import LevelTestProposalScreen from '../screens/onboarding/LevelTestProposalScreen';
import LevelTestInProgressScreen from '../screens/onboarding/LevelTestInProgressScreen';
import LevelTestResultScreen from '../screens/onboarding/LevelTestResultScreen';
import PermissionsScreen from '../screens/onboarding/PermissionsScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="SplashNoConnection" component={SplashNoConnectionScreen} />
            <Stack.Screen name="SplashUpdate" component={SplashUpdateScreen} />
            <Stack.Screen name="OnboardingSlider" component={OnboardingSliderScreen} />
            <Stack.Screen name="OppositionSelector" component={OppositionSelectorScreen} />
            <Stack.Screen name="LevelTestProposal" component={LevelTestProposalScreen} />
            <Stack.Screen name="LevelTestInProgress" component={LevelTestInProgressScreen} />
            <Stack.Screen name="LevelTestResult" component={LevelTestResultScreen} />
            <Stack.Screen name="Permissions" component={PermissionsScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
    );
}