import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from './AppText';
import { colors, spacing } from '../theme';

const TEXT_MUTED = 'rgba(65, 41, 80, 0.5)';
const PRESSED_BG = '#F5F5F7';

function ChevronRight({ size = 18, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Fila de lista de Ajustes (y sub-pantallas como Perfil): sin bordes ni
// separadores; al tocar se ensombrece la fila completa de borde a borde.
//  - `caption`: etiqueta pequeña ENCIMA del texto principal (ej. "Email").
//  - `subtitle`: texto pequeño DEBAJO del texto principal.
//  - `right`: elemento a la derecha (ej. Switch). Si hay `onPress` y no se
//    pasa `right`, se muestra un chevron.
export default function SettingsRow({ icon, caption, label, subtitle, onPress, right, accessibilityLabel }) {
    const content = (
        <>
            {icon}
            <View style={styles.textWrap}>
                {caption ? <Text style={styles.caption}>{caption}</Text> : null}
                <Text style={styles.label} numberOfLines={1}>{label}</Text>
                {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
            {right ?? (onPress ? <ChevronRight /> : null)}
        </>
    );

    if (!onPress) return <View style={styles.row}>{content}</View>;

    return (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={onPress}
            accessibilityLabel={accessibilityLabel ?? label}
        >
            {content}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: spacing.lg + 8,
    },
    rowPressed: {
        backgroundColor: PRESSED_BG,
    },
    textWrap: {
        flex: 1,
    },
    caption: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10,
        color: TEXT_MUTED,
        marginBottom: 2,
    },
    label: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: colors.textDark,
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10.5,
        color: TEXT_MUTED,
        marginTop: 2,
    },
});
