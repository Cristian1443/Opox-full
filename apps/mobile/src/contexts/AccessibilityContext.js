import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tamaño de fuente global ────────────────────────────────────────────────
// ConfigAccessibilityScreen guarda la preferencia (AsyncStorage + backend)
// pero antes nada la leía — el slider "Tamaño fuente" no afectaba al resto
// de la app. Este contexto carga el valor guardado al arrancar y lo expone
// como `fontScale` para que <AppText> (sustituto de Text en toda la app)
// escale cada texto. `setFontSize` permite aplicar el cambio en caliente
// desde ConfigAccessibilityScreen sin esperar a un reinicio.
const A11Y_KEY = 'opox.accessibility';
const FONT_TO_SCALE = { pequeno: 0.85, medio: 1.0, grande: 1.15 };

export const AccessibilityContext = createContext({
    fontScale: 1,
    setFontSize: () => { },
});

export function AccessibilityProvider({ children }) {
    const [fontScale, setFontScaleState] = useState(1);

    useEffect(() => {
        let cancelled = false;
        AsyncStorage.getItem(A11Y_KEY).then((raw) => {
            if (cancelled || !raw) return;
            try {
                const { fontSize } = JSON.parse(raw);
                if (fontSize && FONT_TO_SCALE[fontSize] != null) {
                    setFontScaleState(FONT_TO_SCALE[fontSize]);
                }
            } catch { /* preferencia corrupta — se queda en 1.0 */ }
        });
        return () => { cancelled = true; };
    }, []);

    const setFontSize = useCallback((fontSize) => {
        setFontScaleState(FONT_TO_SCALE[fontSize] ?? 1);
    }, []);

    return (
        <AccessibilityContext.Provider value={{ fontScale, setFontSize }}>
            {children}
        </AccessibilityContext.Provider>
    );
}
