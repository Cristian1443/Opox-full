import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Modal,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Constants from 'expo-constants';
import { colors, spacing } from '../../theme';

// Mismo patrón lazy que App.js — expo-notifications rompe en Expo Go SDK 53+
const IS_EXPO_GO = Constants.appOwnership === 'expo';
let Notifications = null;
if (!IS_EXPO_GO) {
    try { Notifications = require('expo-notifications'); } catch (_) {}
}

// ─── Iconos SVG exactos del wireframe (34×34, viewBox 0 0 24 24) ─────────────
// Tamaño real proporcional al Figma: los grupos de ícono ocupan ~70-110px
// dentro de un frame de 905px de ancho, mucho más grandes que el 17x17 previo.

function IconBell() {
    return (
        <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3a5 5 0 0 1 5 5v4l2 3H5l2-3V8a5 5 0 0 1 5-5zM9 19a3 3 0 0 0 6 0"
                stroke={colors.accentOrange}
                strokeWidth={1.6}
            />
        </Svg>
    );
}

// Corazón con línea de pulso (EKG) — icono real es "Biometría y control de fatiga"
function IconHealth() {
    return (
        <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 20.5C7 16.5 3 13.2 3 9.2 3 6.3 5.3 4 8.2 4c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2C19.1 4 21.4 6.3 21.4 9.2c0 4-4 7.3-9 11.3z"
                stroke={colors.accentOrange}
                strokeWidth={1.6}
                strokeLinejoin="round"
            />
            <Path
                d="M5 11h3l1.5-3 2 6 1.5-3H19"
                stroke={colors.accentOrange}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function IconCamera() {
    return (
        <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
            <Path
                d="M5 8h3l2-3h4l2 3h3v11H5z"
                stroke={colors.accentOrange}
                strokeWidth={1.6}
            />
            <Circle cx={12} cy={13} r={3} stroke={colors.accentOrange} strokeWidth={1.6} />
        </Svg>
    );
}

function IconMic() {
    return (
        <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4"
                stroke={colors.accentOrange}
                strokeWidth={1.6}
                strokeLinecap="round"
            />
        </Svg>
    );
}

// ─── Icono campana del diálogo nativo (40×40, trazo naranja sobre tarjeta blanca) ──
function IconBellLarge() {
    return (
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3a5 5 0 0 1 5 5v4l2 3H5l2-3V8a5 5 0 0 1 5-5zM9 19a3 3 0 0 0 6 0"
                stroke={colors.accentOrange}
                strokeWidth={1.6}
            />
        </Svg>
    );
}

// ─── Diálogo de notificaciones (Figma "NOTIFICACIONES" 2346:2015) ──
// Fondo negro de borde a borde + tarjeta modal blanca (confirmado vía API REST:
// frame fill=#000000, MODAL vector fill=#ffffff, texto fill=#412950).
function PermissionCard({ onAllow, onDeny }) {
    return (
        <View style={modal.backdrop}>
            <View style={modal.card}>
                <View style={modal.cardIcon}>
                    <IconBellLarge />
                </View>

                <Text style={modal.cardTitle}>
                    OPOX quiere enviarte notificaciones
                </Text>

                <Text style={modal.cardDesc}>
                    Avisos de cambios en el BOE, recordatorios de racha y de descanso.
                </Text>

                <View style={modal.cardActions}>
                    <TouchableOpacity style={modal.btnAllow} onPress={onAllow} activeOpacity={0.85}>
                        <Text style={modal.btnAllowText}>¡A por más!</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={modal.btnDeny} onPress={onDeny} activeOpacity={0.7}>
                        <Text style={modal.btnDenyText}>No permitir</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ─── Fila de permiso ─────────────────────────────────────────────────────────
function PermissionRow({ icon, title, subtitle, highlighted }) {
    return (
        <View style={[styles.row, highlighted && styles.rowHighlighted]}>
            <View style={styles.rowIcon}>{icon}</View>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowSubtitle}>{subtitle}</Text>
            </View>
        </View>
    );
}

// ─── Lista de permisos (datos exactos del wireframe) ─────────────────────────
const PERMISSIONS = [
    {
        key: 'notifications',
        icon: <IconBell />,
        title: 'Notificaciones',
        subtitle: 'Avisos BOE, racha y descanso',
        highlighted: true,
    },
    {
        key: 'health',
        icon: <IconHealth />,
        title: 'SALUD',
        subtitle: 'Biometría y control de fatiga',
    },
    {
        key: 'camera',
        icon: <IconCamera />,
        title: 'Cámara',
        subtitle: 'Foto-Test y escaneo de apuntes',
    },
    {
        key: 'mic',
        icon: <IconMic />,
        title: 'Micrófono',
        subtitle: 'Modo voz del Tutor IA',
    },
];

// ─── Icono check verde del estado "Todo listo" (Figma fill #3ab375) ──
function IconCheckCircle() {
    return (
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
            <Path
                d="M4.5 12.5l5 5 10-11"
                stroke={colors.statGreen}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// ─────────────────────────────────────────────
// 0.5 · ok — Estado permiso concedido (Figma "PERMISO CONCEDIDO" 2346:2034)
// Fondo negro de borde a borde + tarjeta modal blanca (confirmado vía API REST).
// ─────────────────────────────────────────────
function SuccessState({ onPress }) {
    return (
        <SafeAreaView style={ok.backdrop}>
            <View style={ok.card}>
                <View style={ok.cardIcon}>
                    <IconCheckCircle />
                </View>

                <Text style={ok.cardTitle}>Todo listo</Text>

                <Text style={ok.cardDesc}>
                    Permisos activados. Ya puedes aprovechar Opox al completo.
                </Text>

                <TouchableOpacity
                    style={ok.btnAllow}
                    onPress={onPress}
                    activeOpacity={0.85}
                >
                    <Text style={ok.btnAllowText}>Empezar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const ok = StyleSheet.create({
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
        borderRadius: 999,
        paddingVertical: spacing.md,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnAllowText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});

// ─── Icono alerta roja del estado "Función limitada" (Figma fill #ff2638) ─
function IconAlertCircle() {
    return (
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Circle
                cx={12}
                cy={12}
                r={10}
                stroke={colors.statRed}
                strokeWidth={1.8}
            />
            <Path
                d="M12 7v6M12 16.5v.5"
                stroke={colors.statRed}
                strokeWidth={2}
                strokeLinecap="round"
            />
        </Svg>
    );
}

// ─────────────────────────────────────────────
// 0.5 · err — Estado permiso denegado (Figma "PERMISO DENEGADO" 2346:2051)
// Fondo negro de borde a borde + tarjeta modal blanca (confirmado vía API REST).
// ─────────────────────────────────────────────
function DeniedState({ onContinue }) {
    return (
        <SafeAreaView style={err.backdrop}>
            <View style={err.card}>
                <View style={err.cardIcon}>
                    <IconAlertCircle />
                </View>

                <Text style={err.cardTitle}>Función limitada</Text>

                <Text style={err.cardDesc}>
                    Sin notificaciones no podremos avisarte de cambios en el BOE ni de tu racha. Actívalas cuando quieras en Ajustes.
                </Text>

                <TouchableOpacity
                    style={err.btnAllow}
                    onPress={() => Linking.openSettings()}
                    activeOpacity={0.85}
                >
                    <Text style={err.btnAllowText}>Ir a ajustes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={err.btnDeny}
                    onPress={onContinue}
                    activeOpacity={0.7}
                >
                    <Text style={err.btnDenyText}>Continuar igualmente</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const err = StyleSheet.create({
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
        borderRadius: 999,
        paddingVertical: spacing.md,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnAllowText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    btnDeny: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnDenyText: {
        color: colors.textDark,
        fontSize: 14,
        fontWeight: '700',
    },
});

// ─────────────────────────────────────────────
// 0.5 — Pantalla principal de permisos
// ─────────────────────────────────────────────
export default function PermissionsScreen({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [status, setStatus] = useState(null); // null | 'granted' | 'denied'

    // Cuando el usuario pulsa "Activar permisos"
    const handleActivate = () => setModalVisible(true);

    // Botón "¡A por más!" — solicita el permiso real al SO
    const handleAllow = async () => {
        setModalVisible(false);

        if (!Notifications) {
            // Expo Go o módulo no disponible — simular concedido para no bloquear el onboarding
            setStatus('granted');
            return;
        }

        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                });
            }
            const { status } = await Notifications.requestPermissionsAsync();
            setStatus(status === 'granted' ? 'granted' : 'denied');
        } catch (_) {
            // Si falla, no bloquear al usuario
            setStatus('granted');
        }
    };

    // Botón "No permitir" — el usuario rechazó la solicitud sin pasar por el diálogo del SO
    const handleDeny = () => {
        setModalVisible(false);
        setStatus('denied');
    };

    // Navegar al siguiente bloque (1 · Acceso)
    const goNext = () => navigation.replace('Entrada');

    // ── Renderizado condicional de estados ──────
    if (status === 'granted') return <SuccessState onPress={goNext} />;
    if (status === 'denied') return <DeniedState onContinue={goNext} />;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Status bar */}
            <View style={styles.statusBar}>
                <Text style={styles.statusBarTime}>9:41</Text>
            </View>

            {/* Cuerpo scrollable (scr-scroll) */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                {/* Título */}
                <Text style={styles.title}>Activa lo esencial</Text>

                {/* Subtítulo */}
                <Text style={styles.subtitle}>Puedes cambiarlo luego en Configuración.</Text>

                {/* Lista de permisos */}
                <View style={styles.list}>
                    {PERMISSIONS.map((perm) => (
                        <PermissionRow
                            key={perm.key}
                            icon={perm.icon}
                            title={perm.title}
                            subtitle={perm.subtitle}
                            highlighted={perm.highlighted}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Botón fijo inferior (btn-row: absolute bottom:16 left:18 right:18) */}
            <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleActivate} activeOpacity={0.85}>
                    <Text style={styles.btnPrimaryText}>Activar permisos</Text>
                </TouchableOpacity>
            </View>

            {/* ── 0.5 · pop — Diálogo nativo simulado ── */}
            <Modal
                visible={modalVisible}
                animationType="fade"
                statusBarTranslucent
            >
                <PermissionCard onAllow={handleAllow} onDeny={handleDeny} />
            </Modal>

        </SafeAreaView>
    );
}

// ─── Estilos pantalla principal ──────────────────────────────────────────────
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
        paddingHorizontal: spacing.md,
        flexShrink: 0,
    },
    statusBarTime: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textDark,
    },

    // ── Scroll + body (body-area pad scr-scroll) ─
    scroll: {
        flex: 1,
    },
    body: {
        paddingHorizontal: 18,
        paddingTop: spacing.md,
        paddingBottom: 80, // espacio para el botón absoluto
    },

    // ── Título (h-title, font-size override: 18px) ─
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textDark,
        letterSpacing: -0.4,
    },

    // ── Subtítulo (h-sub) ───────────────────────
    subtitle: {
        fontSize: 12.5,
        color: colors.textDark,
        marginTop: 6,
        lineHeight: 18,
    },

    // ── Lista de filas ──────────────────────────
    // margin-top:16px; flex-direction:column; gap:10px
    list: {
        marginTop: spacing.md,
        flexDirection: 'column',
        gap: 10,
    },

    // ── Fila individual (opo-row, margin:0) ─────
    // border:1.5px solid #E4E8F0; borderRadius:13; padding:12px 13px
    // display:flex; alignItems:center; gap:11px
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingVertical: 12,
        paddingHorizontal: 13,
        borderWidth: 1.5,
        borderColor: '#E4E8F0',
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
    },

    // ── Icono contenedor (opo-ic) ───────────────
    // Figma: icono desnudo, sin caja de fondo. Se conserva el ancho/alto
    // solo para mantener la alineación de columna con el texto.
    rowIcon: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    // ── Variante resaltada de fila (Notificaciones, primera fila) ──
    rowHighlighted: {
        backgroundColor: 'rgba(235, 235, 235, 0.5)',
    },

    // ── Texto contenedor (opo-tx) ───────────────
    rowText: {
        flex: 1,
    },

    // opo-tx b → font-size:12.5px; color:colors.textDark
    rowTitle: {
        fontSize: 12.5,
        fontWeight: '700',
        color: colors.textDark,
    },

    // opo-tx span → font-size:10.5px; color:#8A92A0; display:block
    rowSubtitle: {
        fontSize: 10.5,
        color: colors.textMuted,
        opacity: 0.5,
        marginTop: 1,
    },

    // ── Botón fijo inferior (btn-row) ───────────
    // position:absolute; bottom:16; left:18; right:18
    btnRow: {
        position: 'absolute',
        bottom: 16,
        left: 18,
        right: 18,
        flexDirection: 'column',
        gap: 9,
    },

    // btn base
    btnPrimary: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
    },
});

// ─────────────────────────────────────────────
// Estilos diálogo de notificaciones (Figma "NOTIFICACIONES" 2346:2015)
// Fondo negro de borde a borde + tarjeta modal blanca (confirmado vía API REST:
// frame fill=#000000, MODAL vector fill=#ffffff, texto fill=#412950).
// ─────────────────────────────────────────────
const modal = StyleSheet.create({
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

    cardActions: {
        flexDirection: 'column',
        gap: spacing.sm,
        width: '100%',
    },

    // ── Botón ¡A por más! (pill) ─────
    btnAllow: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 999,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    btnAllowText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },

    // ── Botón No permitir (texto simple) ───
    btnDeny: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    btnDenyText: {
        color: colors.textDark,
        fontSize: 14,
        fontWeight: '700',
    },
});
