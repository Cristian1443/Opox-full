import { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    BackHandler,
    Linking,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Icono descarga (exacto del wireframe: 24×24, stroke #1B2A4A, sw 1.8) ─────
// Flecha hacia abajo con línea base — representa "descargar actualización"
function IconDownload() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 4v9M8 9l4 4 4-4M5 19h14"
                stroke="#1B2A4A"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// ─── Tarjeta de actualización obligatoria ─────────────────────────────────────
function UpdateCard({ onUpdate }) {
    return (
        <View style={styles.card}>

            {/* Icono contenedor (perm-ic, sin override → bg base #EEF1F7) */}
            <View style={styles.cardIcon}>
                <IconDownload />
            </View>

            {/* Título (perm-card h4) */}
            <Text style={styles.cardTitle}>Nueva versión disponible</Text>

            {/* Descripción (perm-card p) */}
            <Text style={styles.cardDesc}>
                Actualiza Opox para seguir con el temario y el BOE al día.
            </Text>

            {/* Acción única — sin botón de cierre (bloqueo total obligatorio) */}
            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.btnAllow}
                    onPress={onUpdate}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnAllowText}>Actualizar</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}

// ─── Pantalla completa ────────────────────────────────────────────────────────
// IMPORTANTE: "sin botón de cerrar" → el hardware back button también se bloquea
export default function SplashUpdateScreen() {
    const handleUpdate = () => Linking.openURL('https://opox.app');

    // Bloquear botón atrás en Android (actualización obligatoria = no escape)
    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => sub.remove();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Status bar */}
            <View style={styles.statusBar}>
                <Text style={styles.statusBarTime}>9:41</Text>
            </View>

            {/* Fondo gris de la pantalla previa (body-area bg:#EEF1F7) */}
            <View style={styles.bgScreen} />

            {/* Overlay oscuro + tarjeta — sin posibilidad de dismiss */}
            <View style={styles.overlay} pointerEvents="box-none">
                <UpdateCard onUpdate={handleUpdate} />
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // ── Status bar ──────────────────────────────
    statusBar: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 14,
        paddingRight: 16,
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    statusBarTime: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1B2A4A',
        paddingTop: 4,
    },

    // ── Fondo pantalla previa (body-area bg:#EEF1F7) ─
    bgScreen: {
        flex: 1,
        backgroundColor: '#EEF1F7',
    },

    // ── Overlay oscuro (overlay-bg) ─────────────
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 27, 51, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 25,
    },

    // ── Tarjeta (perm-card) ──────────────────────
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: 240,
        paddingTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 14,
        alignItems: 'center',
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.28,
        shadowRadius: 40,
        elevation: 20,
    },

    // ── Icono contenedor (perm-ic, sin override → bg base #EEF1F7) ──
    cardIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#EEF1F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 11,
    },

    // ── Título (perm-card h4) ────────────────────
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F1B33',
        marginBottom: 6,
        textAlign: 'center',
    },

    // ── Descripción (perm-card p) ────────────────
    cardDesc: {
        fontSize: 11,
        color: '#5A6373',
        marginBottom: 14,
        textAlign: 'center',
        lineHeight: 16,
    },

    // ── Acciones (perm-actions) ──────────────────
    cardActions: {
        flexDirection: 'column',
        gap: 7,
        width: '100%',
    },

    // ── Botón Actualizar (perm-btn perm-allow) ───
    btnAllow: {
        backgroundColor: '#FF6B4A',
        borderRadius: 10,
        paddingVertical: 9,
        alignItems: 'center',
        width: '100%',
    },
    btnAllowText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
});
