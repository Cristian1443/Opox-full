import React, { useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    StatusBar,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import OpoxWordmark from '../../../assets/opoxLogo';
import MasCopLogo from '../../../assets/masCopLogo';
import camoImg from '../../imports/CargaInicial/3e43d7dd7590060c7fd1b2f8e506e66fc41fe1d7.png';

// ─── MásCOP badge ──────────────────────────────────────────────────────────────
// Lockup vectorizado real "MásCOP · Formación Policial" (paths exactos extraídos
// de Figma vía API REST — ver apps/mobile/assets/masCopLogo.js).
function MascopBadge() {
    return (
        <View style={s.badgeRow}>
            <Text style={s.badgeLabel}>La APP de</Text>
            <MasCopLogo width={80} />
        </View>
    );
}

// ─── SplashScreen ─────────────────────────────────────────────────────────────
export default function SplashScreen({ navigation }) {
    useEffect(() => {
        let cancelled = false;

        const timer = setTimeout(async () => {
            const state = await NetInfo.fetch();
            const hasConnection = state.isConnected && state.isInternetReachable !== false;
            const isUpdated = true; // reemplaza con tu lógica de versión

            if (cancelled) return;
            if (!hasConnection) return navigation.replace('SplashNoConnection');
            if (!isUpdated) return navigation.replace('SplashUpdate');
            navigation.replace('OnboardingSlider');
        }, 2500);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, []);

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Fondo de camuflaje real del Figma */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Image
                    source={camoImg}
                    style={s.camo}
                    resizeMode="cover"
                />
            </View>

            {/* Centro: wordmark OPOX AI */}
            <View style={s.center}>
                <OpoxWordmark width={260} />
                <Text style={s.tagline}>Tu plaza más cerca</Text>
            </View>

            {/* Footer: badge MásCOP */}
            <View style={s.footer}>
                <MascopBadge />
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    camo: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    center: {
        zIndex: 1,
        alignItems: 'center',
        width: '80%',
    },
    tagline: {
        fontWeight: '500',
        fontSize: 18,
        color: '#412950',
        letterSpacing: 0.2,
        textAlign: 'center',
        marginTop: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 36,
        zIndex: 1,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badgeLabel: {
        fontWeight: '700',
        fontSize: 13,
        color: '#412950',
    },
});