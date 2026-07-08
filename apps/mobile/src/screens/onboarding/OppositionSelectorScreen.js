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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Este selector corre en el Bloque 0, ANTES de que exista sesión (el
 * Bloque 1 · Acceso va después en el flujo). No hay usuario al que
 * llamarle PATCH /auth/profile todavía, así que la elección se guarda
 * aquí y se aplica de verdad en SesionIniciadaScreen, justo cuando ya
 * hay un token real.
 */
export const PENDING_OPOSICION_KEY = 'opox.pendingOposicion';

// ─── TOKENS ───────────────────────────────────────────────
const C = {
    primary: '#f26535',
    dark: '#0d1b2a',
    white: '#ffffff',
    grayLight: '#f4f5f7',
    grayBorder: '#e4e7ec',
    grayText: '#667085',
    graySubtext: '#98a2b3',
    boeLiveBg: '#d1fae5',
    boeLiveTxt: '#065f46',
    selectedBg: '#fff4f0',
    selectedBdr: '#f26535',
    iconBg: '#f2f4f7',
};

// ─── DATA ──────────────────────────────────────────────────
const OPPOSITIONS = [
    {
        id: '1',
        name: 'Justicia',
        sub: 'Tramitación · Auxilio · Gestión',
        icon: 'scale-outline',
    },
    {
        id: '2',
        name: 'Educación',
        sub: 'Maestros · Secundaria',
        icon: 'school-outline',
    },
    {
        id: '3',
        name: 'Hacienda',
        sub: 'Agentes · Administrativos',
        icon: 'home-outline',
    },
    {
        id: '4',
        name: 'Administración General',
        sub: 'Estado · CCAA · Local',
        icon: 'business-outline',
    },
    {
        id: '5',
        name: 'Guardia Civil / Policía',
        sub: 'Incluye pruebas físicas',
        icon: 'shield-outline',
    },
];

// ─── ITEM ──────────────────────────────────────────────────
const OppositionItem = ({ item, selected, onPress }) => {
    const active = selected?.id === item.id;
    return (
        <TouchableOpacity
            onPress={() => onPress(item)}
            activeOpacity={0.75}
            style={[styles.item, active && styles.itemActive]}
        >
            {/* Ícono cuadrado */}
            <View style={[styles.itemIconBox, active && styles.itemIconBoxActive]}>
                <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? C.primary : C.grayText}
                />
            </View>

            {/* Texto */}
            <View style={styles.itemTextBox}>
                <Text style={[styles.itemName, active && styles.itemNameActive]}>
                    {item.name}
                </Text>
                <Text style={styles.itemSub}>{item.sub}</Text>
            </View>

            {/* Badge BOE LIVE */}
            <View style={styles.badge}>
                <Text style={styles.badgeTxt}>BOE LIVE</Text>
            </View>
        </TouchableOpacity>
    );
};

// ─── SCREEN ────────────────────────────────────────────────
export default function OppositionSelectorScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);

    const filtered = useMemo(() =>
        OPPOSITIONS.filter(o =>
            o.name.toLowerCase().includes(query.toLowerCase())
        ),
        [query]
    );

    const handleContinue = async () => {
        if (!selected) return;
        await AsyncStorage.setItem(PENDING_OPOSICION_KEY, selected.name);
        navigation.navigate('LevelTestProposal');
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={C.white} />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <Text style={styles.title}>¿Qué oposición preparas?</Text>

                {/* Buscador */}
                <View style={styles.searchBox}>
                    <Ionicons
                        name="search-outline"
                        size={18}
                        color={C.graySubtext}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar oposición..."
                        placeholderTextColor={C.graySubtext}
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            {/* ── LISTA ── */}
            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <OppositionItem
                        item={item}
                        selected={selected}
                        onPress={setSelected}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />

            {/* ── BOTÓN CONTINUAR — fijo al fondo ── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
                    onPress={handleContinue}
                    disabled={!selected}
                    activeOpacity={0.85}
                >
                    <Text style={styles.continueTxt}>Continuar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── STYLES ────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.white,
    },

    // Header: título + buscador
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: C.dark,
        marginBottom: 16,
        ...Platform.select({
            android: { fontFamily: 'sans-serif-black' },
        }),
    },

    // Buscador
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: C.grayBorder,
        backgroundColor: C.white,
        paddingHorizontal: 14,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: C.dark,
        paddingVertical: 0,
    },

    // Lista
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 10,
    },

    // Item base
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.white,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: C.grayBorder,
        paddingVertical: 14,
        paddingHorizontal: 14,
        minHeight: 72,
    },
    // Item seleccionado
    itemActive: {
        borderColor: C.selectedBdr,
        backgroundColor: C.selectedBg,
    },

    // Ícono cuadrado gris
    itemIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: C.iconBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemIconBoxActive: {
        backgroundColor: '#fff4f0',
    },

    // Texto del item
    itemTextBox: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '700',
        color: C.dark,
        marginBottom: 2,
    },
    itemNameActive: {
        color: C.primary,
    },
    itemSub: {
        fontSize: 12,
        color: C.graySubtext,
        lineHeight: 17,
    },

    // Badge BOE LIVE — verde
    badge: {
        backgroundColor: C.boeLiveBg,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginLeft: 8,
    },
    badgeTxt: {
        color: C.boeLiveTxt,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    // Footer con botón
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: C.white,
        borderTopWidth: 1,
        borderTopColor: C.grayBorder,
    },
    continueBtn: {
        backgroundColor: C.primary,
        borderRadius: 50,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: { elevation: 6 },
        }),
    },
    continueBtnDisabled: {
        opacity: 0.45,
    },
    continueTxt: {
        color: C.white,
        fontSize: 17,
        fontWeight: '800',
    },
});