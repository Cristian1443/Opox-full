import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Accesibilidad + tema global ────────────────────────────────────────────
// ConfigAccessibilityScreen guarda la preferencia (AsyncStorage + backend).
// Expone `fontScale` (para AppText) e `isDark` (para StatusBar y colores).
const A11Y_KEY = 'opox.accessibility';
const FONT_TO_SCALE = { pequeno: 0.85, medio: 1.0, grande: 1.15 };

function resolveIsDark(theme) {
    if (theme === 'oscuro') return true;
    if (theme === 'claro') return false;
    return Appearance.getColorScheme() === 'dark';
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
