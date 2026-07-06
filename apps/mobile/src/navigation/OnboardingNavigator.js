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

// Bloque 1 · Acceso
import EntradaScreen from '../screens/access/EntradaScreen';
import RegistroScreen from '../screens/access/RegistroScreen';
import LoginScreen from '../screens/access/LoginScreen';
import BioLinkScreen from '../screens/access/BioLinkScreen';
import RecuperarPasswordEmailScreen from '../screens/access/RecuperarPasswordEmailScreen';
import RecuperarPasswordEnviadoScreen from '../screens/access/RecuperarPasswordEnviadoScreen';
import RecuperarPasswordNuevaScreen from '../screens/access/RecuperarPasswordNuevaScreen';
import OtpScreen from '../screens/access/OtpScreen';
import TerminosScreen from '../screens/access/TerminosScreen';
import SesionIniciadaScreen from '../screens/access/SesionIniciadaScreen';

// Bloque 2 · Dashboard
import DashboardScreen from '../screens/DashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{ headerShown: false, animation: 'fade' }}
        >
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />

            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="SplashNoConnection" component={SplashNoConnectionScreen} />
            <Stack.Screen name="SplashUpdate" component={SplashUpdateScreen} />
            <Stack.Screen name="OnboardingSlider" component={OnboardingSliderScreen} />
            <Stack.Screen name="OppositionSelector" component={OppositionSelectorScreen} />
            <Stack.Screen name="LevelTestProposal" component={LevelTestProposalScreen} />
            <Stack.Screen name="LevelTestInProgress" component={LevelTestInProgressScreen} />
            <Stack.Screen name="LevelTestResult" component={LevelTestResultScreen} />
            <Stack.Screen name="Permissions" component={PermissionsScreen} />

            {/* Bloque 1 · Acceso */}
            <Stack.Screen name="Entrada" component={EntradaScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="BioLink" component={BioLinkScreen} />
            <Stack.Screen name="RecuperarPassword" component={RecuperarPasswordEmailScreen} />
            <Stack.Screen name="RecuperarPasswordEnviado" component={RecuperarPasswordEnviadoScreen} />
            <Stack.Screen name="RecuperarPasswordNueva" component={RecuperarPasswordNuevaScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
            <Stack.Screen name="Terminos" component={TerminosScreen} />
            <Stack.Screen name="SesionIniciada" component={SesionIniciadaScreen} />
        </Stack.Navigator>
    );
}