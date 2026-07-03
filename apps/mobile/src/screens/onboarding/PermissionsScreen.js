import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

// ─────────────────────────────────────────────
// Datos de los permisos
// ─────────────────────────────────────────────
const PERMS = [
    {
        id: 'notif',
        icon: 'notifications-outline',
        label: 'Notificaciones',
        sub: 'Avisos BOE, racha y descanso',
    },
    {
        id: 'health',
        icon: 'heart-outline',
        label: 'Salud / Wearable',
        sub: 'Biometría y control de fatiga',
    },
    {
        id: 'camera',
        icon: 'camera-outline',
        label: 'Cámara',
        sub: 'Foto-Test y escaneo de apuntes',
    },
    {
        id: 'mic',
        icon: 'mic-outline',
        label: 'Micrófono',
        sub: 'Modo voz del Tutor IA',
    },
];

// ─────────────────────────────────────────────
// 0.5 · ok — Estado permiso concedido
// ─────────────────────────────────────────────
function SuccessState({ onPress }) {
    return (
        <SafeAreaView style={ok.container}>
            <View style={ok.card}>
                <View style={ok.iconBox}>
                    <Ionicons name="checkmark-circle" size={60} color={colors.green} />
                </View>
                <Text style={ok.title}>Todo listo</Text>
                <Text style={ok.desc}>
                    Permisos activados. Ya puedes aprovechar Opox al completo.
                </Text>
                <TouchableOpacity style={ok.btn} onPress={onPress}>
                    <Text style={ok.btnTxt}>Empezar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const ok = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 28,
        width: '100%',
        alignItems: 'center',
    },
    iconBox: {
        width: 88,
        height: 88,
        backgroundColor: colors.greenLight,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 10,
    },
    desc: {
        fontSize: 15,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    btn: {
        width: '100%',
        backgroundColor: colors.primary,
        borderRadius: 50,
        paddingVertical: 16,
        alignItems: 'center',
    },
    btnTxt: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

// ─────────────────────────────────────────────
// 0.5 · err — Estado permiso denegado
// ─────────────────────────────────────────────
function DeniedState({ onContinue }) {
    return (
        <SafeAreaView style={err.container}>
            <View style={err.card}>
                <View style={err.iconBox}>
                    <Ionicons name="alert-circle-outline" size={52} color={colors.primary} />
                </View>
                <Text style={err.title}>Función limitada</Text>
                <Text style={err.desc}>
                    Sin acceso a Salud no podremos avisarte de la fatiga.
                    Actívalo cuando quieras en Ajustes.
                </Text>
                <TouchableOpacity
                    style={err.settingsBtn}
                    onPress={() => Linking.openSettings()}
                >
                    <Text style={err.settingsTxt}>Ir a Ajustes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={err.continueBtn} onPress={onContinue}>
                    <Text style={err.continueTxt}>Continuar igualmente</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const err = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 28,
        width: '100%',
        alignItems: 'center',
    },
    iconBox: {
        width: 88,
        height: 88,
        backgroundColor: colors.redSoft,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 10,
    },
    desc: {
        fontSize: 15,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    settingsBtn: {
        width: '100%',
        backgroundColor: colors.primary,
        borderRadius: 50,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    settingsTxt: { color: colors.white, fontSize: 16, fontWeight: '700' },
    continueBtn: {
        width: '100%',
        borderWidth: 1.5,
        borderColor: colors.grayMid,
        borderRadius: 50,
        paddingVertical: 16,
        alignItems: 'center',
    },
    continueTxt: { color: colors.grayText, fontSize: 16, fontWeight: '600' },
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

    // ── Pantalla guía 0.5 ───────────────────────
    return (
        <SafeAreaView style={s.container}>

            {/* Encabezado */}
            <Text style={s.title}>Activa lo esencial</Text>
            <Text style={s.subtitle}>Puedes cambiarlo luego en Configuración.</Text>

            {/* Lista de permisos */}
            <View style={s.list}>
                {PERMS.map((item) => (
                    <View key={item.id} style={s.row}>
                        <View style={s.iconBox}>
                            <Ionicons name={item.icon} size={22} color={colors.primary} />
                        </View>
                        <View style={s.textBox}>
                            <Text style={s.label}>{item.label}</Text>
                            <Text style={s.sub}>{item.sub}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Botón principal */}
            <TouchableOpacity style={s.activateBtn} onPress={handleActivate}>
                <Text style={s.activateTxt}>Activar permisos</Text>
            </TouchableOpacity>

            {/* ── 0.5 · pop — Diálogo nativo simulado ── */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                statusBarTranslucent
            >
                <View style={modal.overlay}>
                    <View style={modal.dialog}>

                        {/* Icono */}
                        <View style={modal.iconBox}>
                            <Ionicons name="notifications-outline" size={34} color={colors.primary} />
                        </View>

                        {/* Texto */}
                        <Text style={modal.title}>
                            "OPOX" quiere enviarte notificaciones
                        </Text>
                        <Text style={modal.desc}>
                            Avisos de cambios en el BOE, recordatorios de racha y de descanso.
                        </Text>

                        {/* Botones */}
                        <TouchableOpacity style={modal.allowBtn} onPress={handleAllow}>
                            <Text style={modal.allowTxt}>Permitir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={modal.denyBtn} onPress={handleDeny}>
                            <Text style={modal.denyTxt}>No permitir</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────
// Estilos pantalla principal
// ─────────────────────────────────────────────
const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.dark,
        marginTop: 32,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: colors.grayText,
        marginBottom: 36,
    },
    list: {
        gap: 22,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: colors.redSoft,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textBox: { flex: 1 },
    label: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.dark,
    },
    sub: {
        fontSize: 13,
        color: colors.grayText,
        marginTop: 2,
    },
    activateBtn: {
        position: 'absolute',
        bottom: 36,
        left: 24,
        right: 24,
        backgroundColor: colors.primary,
        borderRadius: 50,
        paddingVertical: 18,
        alignItems: 'center',
    },
    activateTxt: {
        color: colors.white,
        fontSize: 17,
        fontWeight: '700',
    },
});

// ─────────────────────────────────────────────
// Estilos modal diálogo nativo
// ─────────────────────────────────────────────
const modal = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    dialog: {
        backgroundColor: colors.white,
        borderRadius: 22,
        padding: 26,
        alignItems: 'center',
    },
    iconBox: {
        width: 68,
        height: 68,
        backgroundColor: colors.redSoft,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.dark,
        textAlign: 'center',
        marginBottom: 10,
    },
    desc: {
        fontSize: 14,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    allowBtn: {
        width: '100%',
        backgroundColor: colors.primary,
        borderRadius: 50,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 12,
    },
    allowTxt: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    denyBtn: {
        paddingVertical: 10,
    },
    denyTxt: {
        color: colors.grayText,
        fontSize: 15,
        fontWeight: '500',
    },
});