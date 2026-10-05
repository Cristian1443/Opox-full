import {
    useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    BackHandler,
    Linking,
    Platform,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { ANDROID_PACKAGE, APP_STORE_ID } from '../../config/featureFlags';

// ─── Icono descarga (Figma "ACTUALIZACION": stroke morado, sobre tarjeta blanca) ─
function IconDownload() {
    return (
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 4v9M8 9l4 4 4-4M5 19h14"
                stroke={colors.textDark}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// ─── Pantalla completa ────────────────────────────────────────────────────────
// Fondo negro de borde a borde + tarjeta modal blanca centrada, fiel al frame
// Figma "ACTUALIZACIÓN" (node 2346:2091, confirmado vía API REST).
// IMPORTANTE: "sin botón de cerrar" → el hardware back button también se bloquea
export default function SplashUpdateScreen() {
    // Abre la ficha de la app en su tienda. Se llama a openURL directamente en
    // try/catch (sin canOpenURL): en iOS canOpenURL exige declarar el esquema
    // en LSApplicationQueriesSchemes y devolvería false aunque el esquema exista.
    const handleUpdate = async () => {
        const candidates = Platform.OS === 'ios'
            ? [
                // TODO(App Store): APP_STORE_ID = null hasta tener la ficha en
                // App Store Connect; mientras tanto se usa la web como fallback.
                APP_STORE_ID ? `itms-apps://apps.apple.com/app/id${APP_STORE_ID}` : null,
                APP_STORE_ID ? `https://apps.apple.com/app/id${APP_STORE_ID}` : 'https://opox.app',
            ]
            : [
                `market://details?id=${ANDROID_PACKAGE}`,
                `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
            ];
        for (const url of candidates.filter(Boolean)) {
            try {
                await Linking.openURL(url);
                return;
            } catch {
                // Probar el siguiente candidato
            }
        }
    };

    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => sub.remove();
    }, []);

    return (
        <SafeAreaView style={styles.backdrop}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <View style={styles.card}>
                <View style={styles.cardIcon}>
                    <IconDownload />
                </View>

                <Text style={styles.cardTitle}>Nueva versión disponible</Text>

                <Text style={styles.cardDesc}>
                    Actualiza Opox para seguir con el temario y el BOE al día.
                </Text>

                <TouchableOpacity
                    style={styles.btnAllow}
                    onPress={handleUpdate}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnAllowText}>Actualizar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.white,
        borderRadius: 28,
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    cardIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textDark,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    cardDesc: {
        fontSize: 14,
        color: colors.textDark,
        marginBottom: spacing.xl,
        textAlign: 'center',
        lineHeight: 20,
    },
    btnAllow: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 12,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnAllowText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
