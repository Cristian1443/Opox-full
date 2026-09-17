import React, { useContext } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { AccessibilityContext } from '../contexts/AccessibilityContext';
import { darkColors } from '../theme';

// ─── Text global con soporte de escala de fuente + dark mode ─────────────────
// Sustituto directo de `Text` de react-native — mismo nombre de export para
// que solo haga falta cambiar el import, no cada uso en JSX. Multiplica el
// `fontSize` explícito del estilo por `fontScale` (Ajustes → Accesibilidad).
// Si el texto no declara su propio fontSize (heredándolo del Text padre,
// patrón usado en varias pantallas para palabras en negrita dentro de una
// frase), se deja el estilo intacto para no romper esa herencia nativa.
//
// Fase 3 · gaps-15-09-26: cuando el modo oscuro está activo y el texto no
// declara `color` propio, se aplica el color claro (`darkColors.textDark`)
// para que sea legible sobre fondos oscuros. Textos con `color` explícito
// (naranja, verde, morado) se respetan tal cual — mantienen el diseño.
export default function AppText({ style, ...rest }) {
    const { fontScale, isDark } = useContext(AccessibilityContext);

    const flat = StyleSheet.flatten(style) ?? {};
    const overrides = {};
    if (flat.fontSize != null && fontScale !== 1) {
        overrides.fontSize = flat.fontSize * fontScale;
    }
    if (isDark && flat.color == null) {
        overrides.color = darkColors.textDark;
    }
    if (Object.keys(overrides).length === 0) return <RNText style={style} {...rest} />;

    return <RNText style={[style, overrides]} {...rest} />;
}
