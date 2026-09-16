import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * SafeAreaView + StatusBar reactivo al tema activo (Fase 3 · gaps-15-09-26).
 * Reemplaza el patrón:
 *   <SafeAreaView style={{ backgroundColor: colors.white }}>
 *     <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
 *
 * Con:
 *   <ThemedSafeArea>
 *
 * Otros props se propagan a la SafeAreaView original (edges, style, etc.).
 * Si el caller pasa `style` con `backgroundColor` explícito, se respeta.
 */
export default function ThemedSafeArea({ children, style, edges, ...rest }) {
    const colors = useThemeColors();
    const isDark = colors.white === '#0F0F14';
    return (
        <>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.white}
            />
            <SafeAreaView
                edges={edges}
                style={[{ flex: 1, backgroundColor: colors.white }, style]}
                {...rest}
            >
                {children}
            </SafeAreaView>
        </>
    );
}
