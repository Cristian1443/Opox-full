import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

const DISMISS_MS = 2800;

function GemIcon({ size = 18 }) {
    return (
        <Svg width={size} height={(size * 60) / 67} viewBox="0 0 67 60" fill="none">
            <Path d="M33.3001 54.251C33.1609 54.2512 33.023 54.2239 32.8943 54.1707C32.7656 54.1175 32.6486 54.0394 32.5501 53.941L0.280119 20.2011C0.136907 20.0568 0.0410502 19.8724 0.00531923 19.6723C-0.0304117 19.4722 -0.00431973 19.2659 0.0801187 19.0811C0.155139 18.8984 0.282537 18.7421 0.446257 18.6318C0.609977 18.5214 0.802693 18.462 1.00012 18.461H65.5701C65.7709 18.458 65.968 18.5156 66.1357 18.6262C66.3033 18.7368 66.4338 18.8953 66.5101 19.0811C66.5946 19.2659 66.6207 19.4722 66.5849 19.6723C66.5492 19.8724 66.4533 20.0568 66.3101 20.2011L34.0001 53.941C33.8141 54.1288 33.5641 54.2395 33.3001 54.251ZM3.42012 20.5111L33.3001 51.751L63.1701 20.5111H3.42012Z" fill={colors.white} />
            <Path d="M33.2999 54.2498C33.0974 54.2549 32.8981 54.1983 32.7285 54.0876C32.5588 53.9769 32.4268 53.8172 32.3499 53.6298L18.1299 19.8898L20.0099 19.0898L33.2999 50.5898L44.9399 22.9998L46.8299 23.7998L34.2399 53.6298C34.1636 53.8156 34.0331 53.9741 33.8654 54.0847C33.6978 54.1953 33.5007 54.2528 33.2999 54.2498Z" fill={colors.white} />
            <Path d="M65.5701 20.6112H1.00007C0.810111 20.6185 0.622016 20.5714 0.457834 20.4756C0.293651 20.3798 0.160185 20.2391 0.0730763 20.0702C-0.0140322 19.9012 -0.0511732 19.7109 -0.0339936 19.5216C-0.0168141 19.3322 0.0539741 19.1517 0.170074 19.0012L9.06007 5.8212C9.15251 5.6808 9.27886 5.56596 9.42742 5.48731C9.57599 5.40865 9.74199 5.36872 9.91007 5.3712H56.6901C56.8582 5.36872 57.0242 5.40865 57.1727 5.48731C57.3213 5.56596 57.4476 5.6808 57.5401 5.8212L66.4201 19.0012C66.5344 19.1532 66.6031 19.3346 66.618 19.5242C66.6329 19.7138 66.5934 19.9037 66.5042 20.0717C66.4149 20.2396 66.2797 20.3786 66.1142 20.4724C65.9488 20.5662 65.76 20.6109 65.5701 20.6012V20.6112ZM3.00007 18.5612H63.6401L56.1401 7.4212H10.4501L3.00007 18.5612Z" fill={colors.white} />
            <Path d="M19.7701 20.3317L18.3701 18.8417L32.5901 5.51172H34.0001L44.6101 15.4617L43.2101 16.9517L33.3001 7.67172L19.7701 20.3317Z" fill={colors.white} />
            <Path d="M13.266 9.52973L11.5645 10.6777L18.0773 20.3306L19.7788 19.1826L13.266 9.52973Z" fill={colors.white} />
            <Path d="M65.5702 20.612H47.6402C47.4522 20.6152 47.267 20.5652 47.1061 20.468C46.9451 20.3707 46.8148 20.23 46.7302 20.062C46.6528 19.9039 46.6186 19.7282 46.6309 19.5526C46.6432 19.377 46.7016 19.2078 46.8002 19.062L55.8002 5.87198C55.8927 5.73158 56.019 5.61674 56.1676 5.53809C56.3161 5.45943 56.4821 5.4195 56.6502 5.42198C56.8206 5.42231 56.9884 5.46332 57.1397 5.54159C57.2911 5.61986 57.4215 5.73313 57.5202 5.87198L66.4202 19.002C66.5346 19.1539 66.6032 19.3354 66.6181 19.525C66.633 19.7146 66.5935 19.9045 66.5043 20.0724C66.4151 20.2404 66.2798 20.3794 66.1144 20.4732C65.9489 20.567 65.7602 20.6117 65.5702 20.602V20.612ZM49.5702 18.562H63.6402L56.6402 8.20198L49.5702 18.562Z" fill={colors.white} />
        </Svg>
    );
}

/**
 * Toast animado de Opopoints. Se muestra desde abajo cuando `points > 0`.
 * Props:
 *   points   — número de puntos ganados (0 = no se muestra)
 *   subtitle — texto secundario opcional (e.g. "Por completar el test")
 */
export default function OpoToast({ points = 0, subtitle }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        if (!points || points <= 0) return;

        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
            Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, { toValue: 24, duration: 220, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
            ]).start();
        }, DISMISS_MS);

        return () => clearTimeout(timer);
    }, [points]);

    if (!points || points <= 0) return null;

    return (
        <Animated.View
            style={[styles.pill, { opacity, transform: [{ translateY }] }]}
            pointerEvents="none"
        >
            <View style={styles.row}>
                <GemIcon size={18} />
                <Text style={styles.points}>+{points} Opopoints</Text>
            </View>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    pill: {
        position: 'absolute',
        bottom: 32,
        alignSelf: 'center',
        backgroundColor: '#804CC9',
        borderRadius: 28,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    points: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
});
