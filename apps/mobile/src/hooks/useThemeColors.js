import { useContext } from 'react';
import { AccessibilityContext } from '../contexts/AccessibilityContext';
import { lightColors, darkColors } from '../theme';

/**
 * Hook para obtener la paleta de color activa según la preferencia de tema.
 *
 * Uso en pantalla:
 *   const colors = useThemeColors();
 *   const styles = useMemo(() => makeStyles(colors), [colors]);
 *
 * Pantallas NO migradas siguen importando `colors` estático desde `theme.js`
 * — verán la paleta clara siempre, sin crashes.
 */
export function useThemeColors() {
    const { isDark } = useContext(AccessibilityContext);
    return isDark ? darkColors : lightColors;
}
