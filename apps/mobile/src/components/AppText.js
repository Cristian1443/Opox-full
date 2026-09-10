import React, { useContext } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { AccessibilityContext } from '../contexts/AccessibilityContext';

// ─── Text global con soporte de escala de fuente ────────────────────────────
// Sustituto directo de `Text` de react-native — mismo nombre de export para
// que solo haga falta cambiar el import, no cada uso en JSX. Multiplica el
// `fontSize` explícito del estilo por `fontScale` (Ajustes → Accesibilidad).
// Si el texto no declara su propio fontSize (heredándolo del Text padre,
// patrón usado en varias pantallas para palabras en negrita dentro de una
// frase), se deja el estilo intacto para no romper esa herencia nativa.
export default function AppText({ style, ...rest }) {
    const { fontScale } = useContext(AccessibilityContext);

    if (fontScale === 1) return <RNText style={style} {...rest} />;

    const flat = StyleSheet.flatten(style);
    if (!flat || flat.fontSize == null) return <RNText style={style} {...rest} />;

    return <RNText style={[style, { fontSize: flat.fontSize * fontScale }]} {...rest} />;
}
