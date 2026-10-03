import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Accesibilidad + tema global ────────────────────────────────────────────
// ConfigAccessibilityScreen guarda la preferencia (AsyncStorage + backend).
// Expone `fontScale` (para AppText) e `isDark` (para StatusBar y colores).
const A11Y_KEY = 'opox.accessibility';
const FONT_TO_SCALE = { pequeno: 0.85, medio: 1.0, grande: 1.15 };

// `theme === 'auto'` debería seguir el tema del sistema, pero la migración a
// dark mode solo cubre un subconjunto de pantallas (ver "Dark mode global —
// Fase 3" en CLAUDE.md). Mientras la mayoría de pantallas sigan en light,
// activar dark por sistema deja la app a medio pintar (fondo oscuro en unas,
// claro en otras). Hasta que termine la migración, 'auto' se trata como
// 'claro'. El toggle manual ('oscuro') sigue funcionando como siempre.
function resolveIsDark(theme) {
    if (theme === 'oscuro') return true;
    return false;
}

export const AccessibilityContext = createContext({
    fontScale: 1,
    isDark: false,
    setFontSize: () => { },
    setTheme: () => { },
});

export function AccessibilityProvider({ children }) {
    const [fontScale, setFontScaleState] = useState(1);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        let cancelled = false;
        AsyncStorage.getItem(A11Y_KEY).then((raw) => {
            if (cancelled || !raw) return;
            try {
                const { fontSize, theme } = JSON.parse(raw);
                if (fontSize && FONT_TO_SCALE[fontSize] != null) {
                    setFontScaleState(FONT_TO_SCALE[fontSize]);
                }
                if (theme) setIsDark(resolveIsDark(theme));
            } catch { /* preferencia corrupta — se queda en defaults */ }
        });
        return () => { cancelled = true; };
    }, []);

    const setFontSize = useCallback((fontSize) => {
        setFontScaleState(FONT_TO_SCALE[fontSize] ?? 1);
    }, []);

    const setTheme = useCallback((theme) => {
        setIsDark(resolveIsDark(theme));
    }, []);

    return (
        <AccessibilityContext.Provider value={{ fontScale, isDark, setFontSize, setTheme }}>
            {children}
        </AccessibilityContext.Provider>
    );
}
