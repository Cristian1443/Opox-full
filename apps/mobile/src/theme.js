// Tokens de color OPOX. La paleta clara es la histórica de la marca; la paleta
// oscura (Fase 3 · gaps-15-09-26) invierte los fondos y textos manteniendo los
// acentos que funcionan en ambos temas (verde, naranja, morado).
//
// Uso: para pantallas migradas a dark mode, importar `useThemeColors()` desde
// `hooks/useThemeColors`. Para el resto, `import { colors }` sigue devolviendo
// la paleta clara — no rompe nada. La migración se hace por pantalla.

export const lightColors = {
    // Marca OPOX
    primary: '#f26535',
    dark: '#0d1b2a',
    white: '#ffffff',
    grayLight: '#f4f5f7',
    grayMid: '#d0d5dd',
    grayText: '#8a9bb0',
    green: '#22c55e',
    greenLight: '#dcfce7',
    redSoft: '#fde8df',
    textDark: '#412950',
    textMuted: '#343A3D',
    ctaGreen: '#24bd90',
    selectionBorder: '#9F6EE4',
    statGreen: '#3AB675',
    statRed: '#FF2638',
    accentOrange: '#F69624',
    bannerPurple: '#804CC9',
    neutralGray: '#9D9B9B',
    gray: '#A7ADB8',

    // Tokens semánticos (Bloque 3+)
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    separator: '#E5E5EA',
    success: '#34C759',
    successBg: '#E8F8EE',
    warning: '#FF9F0A',
    warningBg: '#FFF4E5',
    error: '#FF3B30',
    errorBg: '#FFEBEB',

    // Acento IA / Bloque 7 — morado usado en bottom sheets, CTAs secundarios y pausa
    // Figma (Bloque 7, inspección exhaustiva 2026-08): #7241B8 exacto.
    purple: '#7241B8',
    purpleBg: '#F1ECFA',
};

// Paleta oscura — mapeo pragmático hasta que Figma entregue tokens definitivos
// para dark mode. Se invierten los fondos (#0F0F14 casi negro) y textos (#F0F0F2
// casi blanco). Los acentos (ctaGreen, accentOrange, purple, selectionBorder)
// se mantienen — su contraste sobre fondo oscuro es adecuado según WCAG AA.
export const darkColors = {
    ...lightColors,

    // Fondos / superficies
    white: '#0F0F14',            // fondo principal (antes blanco)
    grayLight: '#1A1A21',        // superficie secundaria
    background: '#0F0F14',
    card: '#1A1A21',
    separator: '#2C2C33',

    // Texto
    textDark: '#F0F0F2',
    textMuted: '#B0B0B8',
    text: '#F0F0F2',
    textSecondary: '#8E8E93',

    // Colores que rompen sobre fondo oscuro (pardos)
    grayMid: '#3F3F46',
    grayText: '#8A9BB0',
    neutralGray: '#8A8A8A',
    gray: '#8A8A8A',
    dark: '#F0F0F2',

    // Backgrounds tintados — bajamos su alpha implícito con tonos más oscuros
    greenLight: '#1F3D2E',
    redSoft: '#3D1E1E',
    successBg: '#1F3D2E',
    warningBg: '#3D2E1E',
    errorBg: '#3D1E1E',
    purpleBg: '#2A1E3D',
};

// Alias por compatibilidad: cualquier `import { colors } from '../theme'` sigue
// funcionando y devuelve la paleta clara. Las pantallas que quieran modo oscuro
// dinámico deben usar `useThemeColors()` en su lugar.
export const colors = lightColors;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};
