// Bloque 3 · Salud — Onboarding wearable · paso 2 (selector)
// Lista de wearables + Otro. Al pulsar cada uno navegamos a la mini-guía
// específica (WearableGuide) o al pairing directo si es Apple Watch (iOS).
import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../../components/AppText';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import { colors, spacing } from '../../theme';

const FIGMA = {
    subtitleMuted: 'rgba(65,41,80,0.5)',
    cardBorder: 'rgba(65,41,80,0.3)',
    cardFill: 'rgba(255,255,255,0.5)',
};

// Marcas soportadas. `brand` es la clave que recibe WearableGuideScreen.
// `directPair` = iOS → Apple Watch va directo al pairing HealthKit sin guía.
const BRANDS_IOS = [
    { brand: 'apple',   icon: 'logo-apple',      label: 'Apple Watch',  directPair: true },
    { brand: 'other',   icon: 'help-circle-outline', label: 'Otro' },
];

const BRANDS_ANDROID = [
    { brand: 'wearos',  icon: 'watch',                label: 'Wear OS / Pixel Watch' },
    { brand: 'xiaomi',  icon: 'fitness',              label: 'Xiaomi / Mi Band' },
    { brand: 'amazfit', icon: 'fitness-outline',      label: 'Amazfit / Zepp' },
    { brand: 'fitbit',  icon: 'walk-outline',         label: 'Fitbit' },
    { brand: 'garmin',  icon: 'compass-outline',      label: 'Garmin' },
    { brand: 'samsung', icon: 'phone-portrait-outline', label: 'Samsung Health' },
    { brand: 'other',   icon: 'help-circle-outline',  label: 'Otro' },
];

export default function WearableSelectScreen({ navigation }) {
    const brands = Platform.OS === 'ios' ? BRANDS_IOS : BRANDS_ANDROID;

    const handlePick = (item) => {
        if (item.directPair) {
            navigation.replace('Pairing', {
                device: { name: 'Apple Salud', platform: 'ios_healthkit', icon: 'heart-circle-outline' },
            });
            return;
        }
        navigation.navigate('WearableGuide', { brand: item.brand, label: item.label });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top','left','right']}>
            <StatusBar barStyle="dark-content" />
            <HealthScreenHeader
                title="Conectar wearable"
                subtitle="¿Cuál usas?"
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {brands.map((item) => (
                    <TouchableOpacity
                        key={item.brand}
                        style={styles.card}
                        onPress={() => handlePick(item)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconWrap}>
                            <Ionicons name={item.icon} size={26} color={colors.accentOrange} />
                        </View>
                        <Text style={styles.cardLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={18} color={FIGMA.subtitleMuted} />
                    </TouchableOpacity>
                ))}

                <Text style={styles.footerNote}>
                    Cada opción abre una mini-guía con los 3 pasos exactos para tu app.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    scroll: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: FIGMA.cardBorder,
        backgroundColor: FIGMA.cardFill,
    },
    iconWrap: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(246,150,36,0.12)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardLabel: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.textDark,
    },
    footerNote: {
        marginTop: spacing.md,
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        color: FIGMA.subtitleMuted,
    },
});
