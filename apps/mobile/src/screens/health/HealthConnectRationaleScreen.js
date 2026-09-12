// Bloque 3 · Salud — Pantalla de justificación de privacidad para Health Connect
// Google exige que toda app que declare ACTION_SHOW_PERMISSIONS_RATIONALE tenga
// una Activity que realmente muestre al usuario por qué necesita los datos.
// Health Connect lanza esta pantalla antes de otorgar permisos o desde su menú
// de gestión. Sin una respuesta válida a ese intent, HC marca la app como
// inválida → invisible en sus ajustes → permisos denegados silenciosamente.
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../../components/AppText';
import { colors, spacing } from '../../theme';

const DATA_ITEMS = [
    {
        icon: 'heart-outline',
        label: 'Frecuencia cardíaca',
        why: 'Para estimar tu nivel de fatiga antes de cada sesión de estudio.',
    },
    {
        icon: 'pulse-outline',
        label: 'FC en reposo y HRV',
        why: 'Para calibrar la calidad de tu recuperación día a día.',
    },
    {
        icon: 'moon-outline',
        label: 'Sueño',
        why: 'Para adaptar la intensidad del plan de estudio a tu descanso real.',
    },
    {
        icon: 'footsteps-outline',
        label: 'Pasos',
        why: 'Para medir tu nivel de actividad física como factor de energía.',
    },
    {
        icon: 'water-outline',
        label: 'Saturación de oxígeno',
        why: 'Para detectar fatiga fisiológica antes de que afecte al rendimiento.',
    },
];

export default function HealthConnectRationaleScreen({ navigation }) {
    const handleClose = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('HomeHealth');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleClose}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Uso de tus datos de salud</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.heroRow}>
                    <Ionicons name="shield-checkmark-outline" size={52} color={colors.purple} />
                </View>

                <Text style={styles.title}>Por qué OPOX solicita{'\n'}datos de Health Connect</Text>

                <Text style={styles.intro}>
                    OPOX lee datos de tu wearable a través de{' '}
                    <Text style={styles.bold}>Health Connect</Text> únicamente para personalizar
                    tu plan de estudio según tu estado físico real. Nunca escribimos ni
                    compartimos datos de salud con terceros.
                </Text>

                <Text style={styles.sectionTitle}>Datos que leemos</Text>

                {DATA_ITEMS.map((item) => (
                    <View key={item.label} style={styles.dataRow}>
                        <View style={styles.iconWrap}>
                            <Ionicons name={item.icon} size={20} color={colors.purple} />
                        </View>
                        <View style={styles.dataText}>
                            <Text style={styles.dataLabel}>{item.label}</Text>
                            <Text style={styles.dataWhy}>{item.why}</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.guaranteeBox}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.ctaGreen} />
                    <Text style={styles.guaranteeText}>
                        Solo lectura · Procesado en tu dispositivo · Sin venta de datos
                    </Text>
                </View>

                <Text style={styles.privacyNote}>
                    Puedes revocar estos permisos en cualquier momento desde{' '}
                    <Text style={styles.bold}>
                        Health Connect → Gestión de permisos de la app
                    </Text>
                    .
                </Text>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={handleClose}
                    activeOpacity={0.85}
                >
                    <Text style={styles.ctaText}>Entendido</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(65,41,80,0.08)',
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: 28,
        paddingBottom: 24,
    },
    heroRow: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 22,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 32,
        marginBottom: 14,
    },
    intro: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: 'rgba(65,41,80,0.7)',
        lineHeight: 22,
        marginBottom: 28,
    },
    bold: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
    },
    sectionTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: colors.textDark,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 14,
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.purpleBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dataText: { flex: 1 },
    dataLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13.5,
        color: colors.textDark,
    },
    dataWhy: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: 'rgba(65,41,80,0.6)',
        marginTop: 2,
        lineHeight: 17,
    },
    guaranteeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.successBg,
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        marginBottom: 20,
    },
    guaranteeText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: colors.ctaGreen,
        flex: 1,
    },
    privacyNote: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: 'rgba(65,41,80,0.5)',
        lineHeight: 18,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        paddingTop: 12,
    },
    ctaButton: {
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.purple,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },
});
