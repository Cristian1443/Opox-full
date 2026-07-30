import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { colors } from '../theme';

// ─── Slider con snapping por pasos ───────────────────────────────────────────
// Componente compartido. Sustituye al `OrangeSlider` inline del Bloque 6 y al
// `AccentSlider` inline del Bloque 9. Recibe `accentColor` para adaptar el color
// por módulo (naranja Generador, azul Notes, morado IA, etc.).

const THUMB = 22;
const TRACK_H = 8;

export default function AccentSlider({
    steps,
    valueIdx,
    onChange,
    accentColor = colors.primary,
    trackColor = '#E5E7EB',
}) {
    const [trackWidth, setTrackWidth] = useState(0);
    const tw = useRef(0);
    const valRef = useRef(valueIdx);
    const startLocX = useRef(0);

    useEffect(() => { valRef.current = valueIdx; }, [valueIdx]);

    const pct = steps <= 1 ? 0 : valueIdx / (steps - 1);
    const fillW = trackWidth * pct;
    const thumbX = (trackWidth - THUMB) * pct;

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
            const lx = e.nativeEvent.locationX;
            const w = tw.current;
            if (!w) return;
            const ci = Math.max(0, Math.min(steps - 1, Math.round((lx / w) * (steps - 1))));
            startLocX.current = lx;
            if (ci !== valRef.current) { valRef.current = ci; onChange(ci); }
        },
        onPanResponderMove: (_, gs) => {
            const w = tw.current;
            if (!w) return;
            const nx = Math.max(0, Math.min(w, startLocX.current + gs.dx));
            const ci = Math.max(0, Math.min(steps - 1, Math.round((nx / w) * (steps - 1))));
            if (ci !== valRef.current) { valRef.current = ci; onChange(ci); }
        },
    })).current;

    return (
        <View
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                tw.current = w;
                setTrackWidth(w);
            }}
            style={styles.trackZone}
            {...panResponder.panHandlers}
        >
            <View style={[styles.trackBg, { backgroundColor: trackColor }]} />
            {fillW > 1 && (
                <View style={[styles.fill, { width: fillW, backgroundColor: accentColor }]} />
            )}
            {trackWidth > 0 && (
                <View style={[styles.thumb, { left: thumbX, borderColor: accentColor }]} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    trackZone: { height: THUMB, justifyContent: 'center' },
    trackBg: {
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
    },
    fill: {
        position: 'absolute',
        left: 0,
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        top: (THUMB - TRACK_H) / 2,
    },
    thumb: {
        position: 'absolute',
        top: 0,
        width: THUMB,
        height: THUMB,
        borderRadius: THUMB / 2,
        backgroundColor: colors.white,
        borderWidth: 3,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2,
    },
});
