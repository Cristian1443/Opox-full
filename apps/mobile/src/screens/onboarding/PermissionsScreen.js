import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Modal,
    Linking,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// ─── Iconos SVG exactos del wireframe (17×17, viewBox 0 0 24 24) ─────────────

function IconBell() {
    return (
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3a5 5 0 0 1 5 5v4l2 3H5l2-3V8a5 5 0 0 1 5-5zM9 19a3 3 0 0 0 6 0"
                stroke="#46506A"
                strokeWidth={1.6}
            />
        </Svg>
    );
}

function IconHealth() {
    return (
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Path
                d="M20 12a8 8 0 1 1-8-8M12 7v5l3 2"
                stroke="#46506A"
                strokeWidth={1.6}
                strokeLinecap="round"
            />
        </Svg>
    );
}

function IconCamera() {
    return (
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Path
                d="M5 8h3l2-3h4l2 3h3v11H5z"
                stroke="#46506A"
                strokeWidth={1.6}
            />
            <Circle cx={12} cy={13} r={3} stroke="#46506A" strokeWidth={1.6} />
        </Svg>
    );
}

function IconMic() {
    return (
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4"
                stroke="#46506A"
                strokeWidth={1.6}
                strokeLinecap="round"
            />
        </Svg>
    );
}

// ─── Icono campana del diálogo nativo (24×24, stroke #1B2A4A) ───────────────
function IconBellLarge() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3a5 5 0 0 1 5 5v4l2 3H5l2-3V8a5 5 0 0 1 5-5zM9 19a3 3 0 0 0 6 0"
                stroke="#1B2A4A"
                strokeWidth={1.6}
            />
        </Svg>
    );
}

// ─── Tarjeta del diálogo nativo de permisos ─────────────────────────────────
function PermissionCard({ onAllow, onDeny }) {
    return (
        <View style={modal.card}>
            <View style={modal.cardIcon}>
                <IconBellLarge />
            </View>

            <Text style={modal.cardTitle}>
                "OPOX" quiere enviarte notificaciones
            </Text>

            <Text style={modal.cardDesc}>
                Avisos de cambios en el BOE, recordatorios de racha y de descanso.
            </Text>

            <View style={modal.cardActions}>
                <TouchableOpacity style={modal.btnAllow} onPress={onAllow} activeOpacity={0.85}>
                    <Text style={modal.btnAllowText}>Permitir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modal.btnDeny} onPress={onDeny} activeOpacity={0.7}>
                    <Text style={modal.btnDenyText}>No permitir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Fila de permiso ─────────────────────────────────────────────────────────
function PermissionRow({ icon, title, subtitle }) {
    return (
        <View style={styles.row}>
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
    },
    {
        key: 'health',
        icon: <IconHealth />,
        title: 'Salud / Wearable',
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

// ─── Icono check verde del estado "Todo listo" (26×26, stroke #2BB673) ──────
function IconCheckCircle() {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Circle
                cx={12}
                cy={12}
                r={10}
                stroke="#2BB673"
                strokeWidth={1.8}
            />
            <Path
                d="M7.5 12.5l3 3 6-6.5"
                stroke="#2BB673"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// ─────────────────────────────────────────────
// 0.5 · ok — Estado permiso concedido
// ─────────────────────────────────────────────
function SuccessState({ onPress }) {
    return (
        <SafeAreaView style={ok.container}>
            <View style={ok.card}>
                <View style={ok.cardIcon}>
                    <IconCheckCircle />
                </View>

                <Text style={ok.cardTitle}>Todo listo</Text>

                <Text style={ok.cardDesc}>
                    Permisos activados. Ya puedes aprovechar Opox al completo.
                </Text>

                <View style={ok.cardActions}>
                    <TouchableOpacity
                        style={ok.btnAllow}
                        onPress={onPress}
                        activeOpacity={0.85}
                    >
                        <Text style={ok.btnAllowText}>Empezar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const ok = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(15, 27, 51, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
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
    cardIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#E3F6EE',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 11,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F1B33',
        marginBottom: 6,
        textAlign: 'center',
    },
    cardDesc: {
        fontSize: 11,
        color: '#5A6373',
        marginBottom: 14,
        textAlign: 'center',
        lineHeight: 16,
    },
    cardActions: {
        flexDirection: 'column',
        gap: 7,
        width: '100%',
    },
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

// ─── Icono alerta roja del estado "Función limitada" (24×24, stroke #E2483D) ─
function IconAlertCircle() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Circle
                cx={12}
                cy={12}
                r={10}
                stroke="#E2483D"
                strokeWidth={1.8}
            />
            <Path
                d="M12 7v6M12 16.5v.5"
                stroke="#E2483D"
                strokeWidth={2}
                strokeLinecap="round"
            />
        </Svg>
    );
}

// ─────────────────────────────────────────────
// 0.5 · err — Estado permiso denegado
// ─────────────────────────────────────────────
function DeniedState({ onContinue }) {
    return (
        <SafeAreaView style={err.container}>
            <View style={err.card}>
                <View style={err.cardIcon}>
                    <IconAlertCircle />
                </View>

                <Text style={err.cardTitle}>Función limitada</Text>

                <Text style={err.cardDesc}>
                    Sin acceso a Salud no podremos avisarte de la fatiga. Actívalo cuando quieras en Ajustes.
                </Text>

                <View style={err.cardActions}>
                    <TouchableOpacity
                        style={err.btnAllow}
                        onPress={() => Linking.openSettings()}
                        activeOpacity={0.85}
                    >
                        <Text style={err.btnAllowText}>Ir a Ajustes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={err.btnDeny}
                        onPress={onContinue}
                        activeOpacity={0.7}
                    >
                        <Text style={err.btnDenyText}>Continuar igualmente</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const err = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(15, 27, 51, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
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
    cardIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#FDEBE9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 11,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F1B33',
        marginBottom: 6,
        textAlign: 'center',
    },
    cardDesc: {
        fontSize: 11,
        color: '#5A6373',
        marginBottom: 14,
        textAlign: 'center',
        lineHeight: 16,
    },
    cardActions: {
        flexDirection: 'column',
        gap: 7,
        width: '100%',
    },
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
    btnDeny: {
        backgroundColor: 'transparent',
        borderRadius: 10,
        paddingVertical: 9,
        alignItems: 'center',
        width: '100%',
    },
    btnDenyText: {
        color: '#8A92A0',
        fontSize: 12,
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

    // Diálogo nativo: el usuario pulsa "Permitir"
    const handleAllow = () => {
        setModalVisible(false);
        setStatus('granted');
    };

    // Diálogo nativo: el usuario pulsa "No permitir"
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
                transparent
                visible={modalVisible}
                animationType="fade"
                statusBarTranslucent
            >
                <View style={modal.overlay}>
                    <PermissionCard onAllow={handleAllow} onDeny={handleDeny} />
                </View>
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
        paddingHorizontal: 16,
        flexShrink: 0,
    },
    statusBarTime: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1B2A4A',
    },

    // ── Scroll + body (body-area pad scr-scroll) ─
    scroll: {
        flex: 1,
    },
    body: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 80, // espacio para el botón absoluto
    },

    // ── Título (h-title, font-size override: 18px) ─
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F1B33',
        letterSpacing: -0.4,
    },

    // ── Subtítulo (h-sub) ───────────────────────
    subtitle: {
        fontSize: 12.5,
        color: '#5A6373',
        marginTop: 6,
        lineHeight: 18,
    },

    // ── Lista de filas ──────────────────────────
    // margin-top:16px; flex-direction:column; gap:10px
    list: {
        marginTop: 16,
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
    // width:34; height:34; borderRadius:9; bg:#EEF1F7
    // display:flex; alignItems:center; justifyContent:center; flex-shrink:0
    rowIcon: {
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: '#EEF1F7',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    // ── Texto contenedor (opo-tx) ───────────────
    rowText: {
        flex: 1,
    },

    // opo-tx b → font-size:12.5px; color:#1B2A4A
    rowTitle: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#1B2A4A',
    },

    // opo-tx span → font-size:10.5px; color:#8A92A0; display:block
    rowSubtitle: {
        fontSize: 10.5,
        color: '#8A92A0',
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
        backgroundColor: '#FF6B4A',
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
// Estilos modal diálogo nativo
// ─────────────────────────────────────────────
const modal = StyleSheet.create({
    // ── Overlay oscuro (overlay-bg) ─────────────
    // position:absolute; inset:0; background:rgba(15,27,51,0.45)
    // display:flex; align-items:center; justify-content:center
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 27, 51, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Tarjeta (perm-card) ──────────────────────
    // bg:#FFF; borderRadius:16; width:240; padding:18px 16px 14px
    // shadow: rgba(15,27,51,0.28) 0 14 40; text-align:center
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: 240,
        paddingTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 14,
        alignItems: 'center',
        shadowColor: 'rgba(15, 27, 51, 1)',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.28,
        shadowRadius: 40,
        elevation: 20, // Android
    },

    // ── Icono contenedor (perm-ic) ───────────────
    // width:52; height:52; margin:0 auto 11px; borderRadius:14
    // bg:#EEF1F7; flex; alignItems:center; justifyContent:center
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
        lineHeight: 20,
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

    // ── Botón Permitir (perm-btn perm-allow) ─────
    btnAllow: {
        backgroundColor: '#FF6B4A',
        borderRadius: 10,
        paddingVertical: 9,
        alignItems: 'center',
    },
    btnAllowText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // ── Botón No permitir (perm-btn perm-deny) ───
    btnDeny: {
        backgroundColor: 'transparent',
        borderRadius: 10,
        paddingVertical: 9,
        alignItems: 'center',
    },
    btnDenyText: {
        color: '#8A92A0',
        fontSize: 12,
        fontWeight: '700',
    },
});
