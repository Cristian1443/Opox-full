import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// ─── Icono WiFi tachado (exacto del wireframe: 50×50, viewBox 0 0 24 24) ──────
// 3 arcos WiFi en gris oscuro + línea diagonal naranja + punto naranja
function IconWifiOff() {
    return (
        <Svg width={50} height={50} viewBox="0 0 24 24" fill="none">
            {/* Arcos WiFi (gris oscuro #4A5675, stroke 1.8) */}
            <Path
                d="M2 8.5C5 6 8.3 4.5 12 4.5c3.7 0 7 1.5 10 4M5 12c2-1.6 4.4-2.5 7-2.5s5 .9 7 2.5M8.5 15.5c1-.8 2.2-1.2 3.5-1.2s2.5.4 3.5 1.2"
                stroke="#4A5675"
                strokeWidth={1.8}
                strokeLinecap="round"
            />
            {/* Línea diagonal de tachado (naranja #FF6B4A) */}
            <Path
                d="M3 3l18 18"
                stroke="#FF6B4A"
                strokeWidth={1.8}
                strokeLinecap="round"
            />
            {/* Punto WiFi (naranja #FF6B4A) */}
            <Circle cx={12} cy={19} r={1.3} fill="#FF6B4A" />
        </Svg>
    );
}

// ─── Pantalla completa ────────────────────────────────────────────────────────
export default function SplashNoConnectionScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F1B33" />

            {/* Status bar (misma clase .statusbar base, color heredado) */}
            <View style={styles.statusBar}>
                <Text style={styles.statusBarTime}>9:41</Text>
            </View>

            {/* Cuerpo oscuro centrado (body-area bg:#0F1B33, flex center) */}
            <View style={styles.body}>
                <View style={styles.centerBlock}>

                    {/* Icono WiFi tachado */}
                    <IconWifiOff />

                    {/* Título */}
                    <Text style={styles.title}>Sin conexión</Text>

                    {/* Subtítulo */}
                    <Text style={styles.subtitle}>
                        Necesitas internet para iniciar Opox. Revisa tu red e inténtalo de nuevo.
                    </Text>

                    {/* Botón Reintentar */}
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => navigation.replace('Splash')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnText}>Reintentar</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    // ── Contenedor raíz ─────────────────────────
    container: {
        flex: 1,
        backgroundColor: '#0F1B33',
    },

    // ── Status bar ──────────────────────────────
    statusBar: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 14,
        paddingRight: 16,
        flexShrink: 0,
    },
    statusBarTime: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        marginRight: 'auto',
        paddingTop: 4,
    },

    // ── Cuerpo (body-area) ───────────────────────
    body: {
        flex: 1,
        backgroundColor: '#0F1B33',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Bloque central ───────────────────────────
    centerBlock: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 24,
    },

    // ── Título ───────────────────────────────────
    title: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        marginTop: 16,
        textAlign: 'center',
    },

    // ── Subtítulo ────────────────────────────────
    subtitle: {
        color: '#7E89A3',
        fontSize: 11,
        marginTop: 6,
        maxWidth: 200,
        textAlign: 'center',
        lineHeight: 16,
    },

    // ── Botón Reintentar ─────────────────────────
    btn: {
        backgroundColor: '#FF6B4A',
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 26,
        marginTop: 20,
        alignSelf: 'center',
    },
    btnText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
    },
});
