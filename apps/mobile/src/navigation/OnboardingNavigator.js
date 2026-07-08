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

// Bloque 3 · Salud
import HomeHealthScreen from '../screens/health/HomeHealthScreen';
import ConnectDeviceScreen from '../screens/health/ConnectDeviceScreen';
import PairingScreen from '../screens/health/PairingScreen';
import MetricDetailScreen from '../screens/health/MetricDetailScreen';
import FatigueEngineScreen from '../screens/health/FatigueEngineScreen';
import BreathingExerciseScreen from '../screens/health/BreathingExerciseScreen';
import AdviceHomeScreen from '../screens/health/AdviceHomeScreen';
import StudyTipsScreen from '../screens/health/StudyTipsScreen';
import FoodHomeScreen from '../screens/health/FoodHomeScreen';
import MenusScreen from '../screens/health/MenusScreen';
import MenuDetailScreen from '../screens/health/MenuDetailScreen';
import MeditationListScreen from '../screens/health/MeditationListScreen';
import MeditationPlayerScreen from '../screens/health/MeditationPlayerScreen';
import AITutorPlaceholderScreen from '../screens/health/AITutorPlaceholderScreen';

// Bloque 4 · Planificación
import PlanningHomeScreen from '../screens/planning/PlanningHomeScreen';
import PlanningTodayScreen from '../screens/planning/PlanningTodayScreen';
import PlanningWeekScreen from '../screens/planning/PlanningWeekScreen';
import PlanningMacroScreen from '../screens/planning/PlanningMacroScreen';
import PlanningAgendaScreen from '../screens/planning/PlanningAgendaScreen';
import PlanningEditScreen from '../screens/planning/PlanningEditScreen';

// Bloque 5 · Motivación
import MotivationHomeScreen from '../screens/motivation/MotivationHomeScreen';
import StreakDetailScreen from '../screens/motivation/StreakDetailScreen';
import RankingsScreen from '../screens/motivation/RankingsScreen';
import ClansListScreen from '../screens/motivation/ClansListScreen';
import ClanDetailScreen from '../screens/motivation/ClanDetailScreen';
import ClanChatScreen from '../screens/motivation/ClanChatScreen';
import ChallengesScreen from '../screens/motivation/ChallengesScreen';
import GloryWallScreen from '../screens/motivation/GloryWallScreen';
import DuelsPlaceholderScreen from '../screens/motivation/DuelsPlaceholderScreen';

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

            {/* Bloque 3 · Salud */}
            <Stack.Screen name="HomeHealth" component={HomeHealthScreen} />
            <Stack.Screen name="ConnectDevice" component={ConnectDeviceScreen} />
            <Stack.Screen name="Pairing" component={PairingScreen} />
            <Stack.Screen name="MetricDetail" component={MetricDetailScreen} />
            <Stack.Screen name="FatigueEngine" component={FatigueEngineScreen} />
            <Stack.Screen name="BreathingExercise" component={BreathingExerciseScreen} />
            <Stack.Screen name="AdviceHome" component={AdviceHomeScreen} />
            <Stack.Screen name="StudyTips" component={StudyTipsScreen} />
            <Stack.Screen name="FoodHome" component={FoodHomeScreen} />
            <Stack.Screen name="Menus" component={MenusScreen} />
            <Stack.Screen name="MenuDetail" component={MenuDetailScreen} />
            <Stack.Screen name="MeditationList" component={MeditationListScreen} />
            <Stack.Screen name="MeditationPlayer" component={MeditationPlayerScreen} />
            <Stack.Screen name="AITutor" component={AITutorPlaceholderScreen} />

            {/* Bloque 4 · Planificación */}
            <Stack.Screen name="PlanningHome" component={PlanningHomeScreen} />
            <Stack.Screen name="PlanningToday" component={PlanningTodayScreen} />
            <Stack.Screen name="PlanningWeek" component={PlanningWeekScreen} />
            <Stack.Screen name="PlanningMacro" component={PlanningMacroScreen} />
            <Stack.Screen name="PlanningAgenda" component={PlanningAgendaScreen} />
            <Stack.Screen name="PlanningEdit" component={PlanningEditScreen} />

            {/* Bloque 5 · Motivación */}
            <Stack.Screen name="MotivationHome" component={MotivationHomeScreen} />
            <Stack.Screen name="StreakDetail" component={StreakDetailScreen} />
            <Stack.Screen name="Rankings" component={RankingsScreen} />
            <Stack.Screen name="ClansList" component={ClansListScreen} />
            <Stack.Screen name="ClanDetail" component={ClanDetailScreen} />
            <Stack.Screen name="ClanChat" component={ClanChatScreen} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} />
            <Stack.Screen name="GloryWall" component={GloryWallScreen} />
            <Stack.Screen name="DuelsPlaceholder" component={DuelsPlaceholderScreen} />
        </Stack.Navigator>
    );
}