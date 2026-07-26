import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Platform,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PoliciaIcon, JusticiaIcon, HaciendaIcon } from '../../components/icons/OppositionIcons';

const { width: SW } = Dimensions.get('window');

/**
 * Este selector corre en el Bloque 0, ANTES de que exista sesión (el
 * Bloque 1 · Acceso va después en el flujo). No hay usuario al que
 * llamarle PATCH /auth/profile todavía, así que la elección se guarda
 * aquí y se aplica de verdad en SesionIniciadaScreen, justo cuando ya
 * hay un token real.
 */
export const PENDING_OPOSICION_KEY = 'opox.pendingOposicion';

// ─── Colores Figma (frame SELECTOR OPOSICION) ─────────────────────────────────
const C = {
    bg:          '#F4F4F4',
    white:       '#FFFFFF',
    title:       '#412950',
    placeholder: '#412950',
    searchIcon:  '#BDB6BF',
    cardBg:      'rgba(255, 255, 255, 0.5)',
    cardBorder:  'rgba(65, 41, 80, 0.3)',
    cardBgFirst: 'rgba(235, 235, 235, 0.5)',
    name:        '#412950',
    sub:         '#343A3D',
    boeGreen:    '#24BD90',
    boeBg:       'rgba(36, 189, 144, 0.15)',
    boeBorder:   '#24BD90',
    iconColor:   '#F69624',
};

// ─── Icono de lupa (mismo color gris del Figma #BDB6BF) ───────────────────────
function SearchIcon({ size = 24 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="10.5" cy="10.5" r="7" stroke={C.searchIcon} strokeWidth={2.2} />
            <Path d="M15.5 15.5L21 21" stroke={C.searchIcon} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
    );
}

// ─── DATA ──────────────────────────────────────────────────
const OPPOSITIONS = [
    {
        id: '1',
        name: 'Policía local',
        sub: 'Tramitación · Auxilio · Gestión',
        Icon: PoliciaIcon,
        isFirst: true,
    },
    {
        id: '2',
        name: 'Justicia',
        sub: 'Tramitación · Auxilio · Gestión',
        Icon: JusticiaIcon,
    },
    {
        id: '3',
        name: 'Hacienda',
        sub: 'Agentes · Administrativos',
        Icon: HaciendaIcon,
    },
];

// ─── CARD ITEM ─────────────────────────────────────────────
const OppositionItem = ({ item, onPress }) => {
    const { Icon } = item;
    return (
        <TouchableOpacity
            onPress={() => onPress(item)}
            activeOpacity={0.75}
            style={[
                styles.card,
                item.isFirst && styles.cardFirst,
            ]}
        >
            {/* Icono a la izquierda */}
            <View style={styles.cardIconWrap}>
                <Icon size={56} color={C.iconColor} />
            </View>

            {/* Textos centrales */}
            <View style={styles.cardTextWrap}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.sub}</Text>
            </View>

            {/* Badge BOE LIVE a la derecha */}
            <View style={styles.boeBadge}>
                <Text style={styles.boeText}>BOE LIVE</Text>
            </View>
        </TouchableOpacity>
    );
};

// ─── SCREEN ────────────────────────────────────────────────
export default function OppositionSelectorScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() =>
        OPPOSITIONS.filter(o =>
            o.name.toLowerCase().includes(query.toLowerCase())
        ),
        [query]
    );

    const handleSelect = async (item) => {
        await AsyncStorage.setItem(PENDING_OPOSICION_KEY, item.name);
        navigation.navigate('LevelTestProposal');
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── TÍTULO ── */}
            <Text style={styles.title}>¿Qué oposición preparas?</Text>

            {/* ── BUSCADOR ── */}
            <View style={styles.searchWrap}>
                <View style={styles.searchBox}>
                    <SearchIcon size={26} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar oposición"
                        placeholderTextColor={C.placeholder}
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            {/* ── LISTA DE TARJETAS ── */}
            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <OppositionItem item={item} onPress={handleSelect} />
                )}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + 40 },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
            />
        </View>
    );
}

// ─── STYLES ────────────────────────────────────────────────
const CARD_H = SW * 0.33;      // Proporción del Figma ~267.9/783.95 × ancho
const CARD_PAD_H = 24;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // Título grande centrado
    title: {
        fontFamily: Platform.OS === 'ios' ? 'Poppins-SemiBold' : 'Poppins-SemiBold',
        fontSize: 24,
        fontWeight: '600',
        color: C.title,
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 18,
        paddingHorizontal: 32,
        lineHeight: 36,
    },

    // Buscador
    searchWrap: {
        paddingHorizontal: CARD_PAD_H,
        marginBottom: 18,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 14,
        backgroundColor: C.white,
        paddingHorizontal: 18,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '400',
        color: C.title,
        paddingVertical: 0,
    },

    // Lista
    listContent: {
        paddingHorizontal: CARD_PAD_H,
        paddingTop: 4,
    },

    // Tarjeta genérica
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.cardBg,
        borderRadius: 14,
        borderWidth: 0.71,
        borderColor: C.cardBorder,
        paddingVertical: 20,
        paddingHorizontal: 18,
        minHeight: CARD_H,
    },

    // Primera tarjeta (Policía local) tiene fondo ligeramente diferente
    cardFirst: {
        backgroundColor: C.cardBgFirst,
    },

    // Icono
    cardIconWrap: {
        width: 70,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    // Textos
    cardTextWrap: {
        flex: 1,
    },
    cardName: {
        fontSize: 18,
        fontWeight: '600',
        color: C.name,
        marginBottom: 4,
        lineHeight: 26,
    },
    cardSub: {
        fontSize: 13,
        fontWeight: '400',
        color: C.sub,
        lineHeight: 20,
        opacity: 0.5,
    },

    // Badge BOE LIVE
    boeBadge: {
        backgroundColor: C.boeBg,
        borderRadius: 8,
        borderWidth: 0.92,
        borderColor: C.boeBorder,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 8,
    },
    boeText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.boeGreen,
        letterSpacing: 0.3,
    },
});
