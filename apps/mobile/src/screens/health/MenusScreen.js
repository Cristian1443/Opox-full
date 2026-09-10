// Bloque 3 · Salud — Pantalla 3.8b · Menús equilibrados (listado completo)
import React, { useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import { MENUS_DATA } from '../../data/healthContent';
import { healthApi } from '../../api';
import { FATIGUE_LEVEL_KEY } from './FatigueEngineScreen';

const OBJETIVOS = [
    { key: 'concentracion', label: 'Concentración' },
    { key: 'energia', label: 'Energía' },
    { key: 'examen', label: 'Día de examen' },
    { key: 'recuperacion', label: 'Recuperación' },
];

const RESTRICCIONES = [
    { key: 'vegetariano', label: 'Vegetariano' },
    { key: 'sin gluten', label: 'Sin gluten' },
    { key: 'sin lactosa', label: 'Sin lactosa' },
];

// Colores confirmados contra Figma (frame MENUS EQUILIBRADOS, Bloque 3)
// sin equivalente exacto en theme.js. El gris del tab inactivo es el mismo
// que en AlimentacionScreen (no es el morado-muted de otros controles).
const FIGMA = {
    tabInactive: 'rgba(52,58,61,0.5)',
    cardBorderNormal: 'rgba(65,41,80,0.3)',
    textBody: 'rgba(52,58,61,0.5)',
};

// El Figma solo muestra 3 tabs (Todos/Concentración/Energía) — "Día de
// examen" es un filtro real que ya existía en el código, se mantiene con
// el mismo lenguaje visual del resto de tabs.
const FILTERS = ['Todos', 'Concentración', 'Energía', 'Día de examen'];

function menuBodyLines(menu) {
    if (menu.type === 'AI') {
        return menu.meals.map(
            (m) => `${m.label.charAt(0) + m.label.slice(1).toLowerCase()} · ${m.name}`,
        );
    }
    return [menu.subtitle];
}

function MenuCardItem({ menu, onViewRecipe }) {
    return (
        <View style={[styles.card, menu.highlighted ? styles.cardHighlighted : styles.cardNormal]}>
            <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{menu.title}</Text>
                <Text style={styles.cardBadge}>{menu.type}</Text>
            </View>
            <Text style={styles.cardBody}>{menuBodyLines(menu).join('\n')}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onViewRecipe?.(menu)}>
                <Text style={styles.cardLink}>Ver receta y lista de la compra ›</Text>
            </TouchableOpacity>
        </View>
    );
}

// Convierte la respuesta de la IA al formato que espera MenuCardItem
function mapAiMenus(aiMenus) {
    return (aiMenus ?? []).map((m, i) => ({
        id: `ai_${i}`,
        type: 'AI',
        title: m.titulo ?? 'Menú IA',
        subtitle: m.beneficio ?? '',
        highlighted: i === 0,
        filterKey: m.tipo ?? 'Todos',
        meals: [
            { id: 'desayuno', label: 'DESAYUNO', name: m.comidas?.desayuno?.nombre ?? '', note: `${m.comidas?.desayuno?.kcal ?? ''} kcal` },
            { id: 'comida',   label: 'COMIDA',   name: m.comidas?.comida?.nombre ?? '',   note: `${m.comidas?.comida?.kcal ?? ''} kcal` },
            { id: 'cena',     label: 'CENA',     name: m.comidas?.cena?.nombre ?? '',     note: `${m.comidas?.cena?.kcal ?? ''} kcal` },
        ],
        listaCompra: m.lista_compra ?? [],
    }));
}

export default function MenusScreen({ navigation }) {
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [aiMenus, setAiMenus] = useState([]);
    const [showAiModal, setShowAiModal] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);
    const [objetivo, setObjetivo] = useState('concentracion');
    const [restrictions, setRestrictions] = useState([]);

    const allMenus = [...mapAiMenus(aiMenus), ...MENUS_DATA];
    const filteredMenus = activeFilter === 'Todos'
        ? allMenus
        : allMenus.filter((m) => m.filterKey === activeFilter);

    const toggleRestriction = (key) => {
        setRestrictions((prev) =>
            prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key],
        );
    };

    const handleGenerate = async () => {
        setLoadingAi(true);
        const fatigueLevel = (await AsyncStorage.getItem(FATIGUE_LEVEL_KEY).catch(() => null)) ?? 'bajo';
        const res = await healthApi.generateMenus({ objetivo, fatigueLevel, restrictions, count: 1 }).catch(() => null);
        setLoadingAi(false);
        if (!res?.error && res?.data?.menus) {
            setAiMenus(res.data.menus);
            setShowAiModal(false);
        } else {
            Alert.alert(
                'No disponible',
                res?.error?.message ?? 'No se pudo generar el menú. Verifica tu conexión e inténtalo de nuevo.',
            );
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="MENÚS" onBack={() => navigation.goBack()} />

            {/* Modal configuración IA */}
            <Modal visible={showAiModal} transparent animationType="slide" onRequestClose={() => setShowAiModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Generar menú con IA</Text>

                        <Text style={styles.modalLabel}>Objetivo del día</Text>
                        <View style={styles.pillsRow}>
                            {OBJETIVOS.map((o) => (
                                <TouchableOpacity
                                    key={o.key}
                                    style={[styles.pill, objetivo === o.key && styles.pillActive]}
                                    onPress={() => setObjetivo(o.key)}
                                >
                                    <Text style={[styles.pillText, objetivo === o.key && styles.pillActiveText]}>{o.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.modalLabel}>Restricciones</Text>
                        <View style={styles.pillsRow}>
                            {RESTRICCIONES.map((r) => (
                                <TouchableOpacity
                                    key={r.key}
                                    style={[styles.pill, restrictions.includes(r.key) && styles.pillActive]}
                                    onPress={() => toggleRestriction(r.key)}
                                >
                                    <Text style={[styles.pillText, restrictions.includes(r.key) && styles.pillActiveText]}>{r.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.generateBtn, loadingAi && { opacity: 0.6 }]}
                            onPress={handleGenerate}
                            disabled={loadingAi}
                        >
                            {loadingAi
                                ? <ActivityIndicator color={colors.white} />
                                : <Text style={styles.generateBtnText}>Generar menú</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowAiModal(false)} style={{ marginTop: 12 }}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* CTA generar con IA */}
                <TouchableOpacity style={styles.aiCta} onPress={() => setShowAiModal(true)} activeOpacity={0.8}>
                    <Text style={styles.aiCtaText}>✦ Generar menú con IA</Text>
                </TouchableOpacity>

                <View style={styles.tabsRow}>
                    {FILTERS.map((filter) => {
                        const active = filter === activeFilter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                activeOpacity={0.7}
                                onPress={() => setActiveFilter(filter)}
                                style={active ? styles.tabActive : styles.tabInactive}
                            >
                                <Text style={active ? styles.tabActiveText : styles.tabInactiveText}>{filter}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.menusList}>
                    {filteredMenus.map((menu) => (
                        <MenuCardItem
                            key={menu.id}
                            menu={menu}
                            onViewRecipe={(m) => navigation.navigate('MenuDetail', { menu: m })}
                        />
                    ))}
                </View>

                {filteredMenus.length === 0 && (
                    <Text style={styles.emptyText}>No hay menús para este filtro.</Text>
                )}

                <View style={{ height: spacing.lg }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    tabsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    tabActive: {
        borderWidth: 1.3,
        borderColor: colors.textDark,
        borderRadius: 9.8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    tabActiveText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15.5,
        color: colors.textDark,
    },
    tabInactive: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    tabInactiveText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15.5,
        color: FIGMA.tabInactive,
    },
    menusList: {
        gap: 16,
    },
    card: {
        padding: 16,
    },
    cardHighlighted: {
        borderWidth: 2.2,
        borderColor: colors.ctaGreen,
    },
    cardNormal: {
        borderWidth: 0.44,
        borderColor: FIGMA.cardBorderNormal,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14.7,
        color: colors.textDark,
    },
    cardBadge: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13.3,
        color: colors.purple,
        marginLeft: 8,
    },
    cardBody: {
        marginTop: 6,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        lineHeight: 18,
        color: FIGMA.textBody,
    },
    cardLink: {
        marginTop: 10,
        fontFamily: 'Poppins-Medium',
        fontSize: 9.8,
        color: colors.accentOrange,
    },
    emptyText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: FIGMA.textBody,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
    aiCta: {
        alignSelf: 'flex-start',
        backgroundColor: colors.bannerPurple,
        borderRadius: 9.8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 16,
    },
    aiCtaText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: colors.white,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 36,
    },
    modalTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: colors.textDark,
        marginBottom: 20,
    },
    modalLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: FIGMA.textBody,
        marginBottom: 10,
    },
    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    pill: {
        borderWidth: 1,
        borderColor: FIGMA.cardBorderNormal,
        borderRadius: 9.8,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    pillActive: {
        borderColor: colors.purple,
        backgroundColor: colors.bannerPurple,
    },
    pillText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: colors.textDark,
    },
    pillActiveText: {
        color: colors.white,
    },
    generateBtn: {
        backgroundColor: colors.purple,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    generateBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },
    cancelText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: FIGMA.textBody,
        textAlign: 'center',
    },
});
