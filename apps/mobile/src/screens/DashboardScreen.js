import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Polyline, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NudgeModal from '../components/NudgeModal';

// ─── Iconos SVG exactos del wireframe (Bloque 2 · Dashboard) ─────────────────

function IconBell({ color = '#1B2A4A', size = 17 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3a5 5 0 0 1 5 5v4l2 3H5l2-3V8a5 5 0 0 1 5-5zM9 19a3 3 0 0 0 6 0"
                stroke={color}
                strokeWidth={1.6}
            />
        </Svg>
    );
}

function IconHealth() {
    return (
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path
                d="M3 12h4l2-5 3 9 2-4h7"
                stroke="#2D6FB0"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function HealthSparkline() {
    return (
        <Svg width={80} height={34} viewBox="0 0 80 34">
            <Polyline
                points="0,20 12,20 18,8 24,28 32,20 44,20 50,12 56,24 64,20 80,20"
                fill="none"
                stroke="#2D6FB0"
                strokeWidth={2}
            />
        </Svg>
    );
}

function IconPlan() {
    return (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={4} width={18} height={17} rx={2} stroke="#1f9d6b" strokeWidth={1.6} />
            <Path d="M3 9h18M8 2v4M16 2v4" stroke="#1f9d6b" strokeWidth={1.6} />
        </Svg>
    );
}

function PlanProgressRing({ percent = 75 }) {
    const dash = (percent / 100) * 144.5;
    return (
        <Svg width={58} height={58} viewBox="0 0 58 58">
            <Circle cx={29} cy={29} r={23} fill="none" stroke="#D4EBDF" strokeWidth={7} />
            <Circle
                cx={29}
                cy={29}
                r={23}
                fill="none"
                stroke="#1f9d6b"
                strokeWidth={7}
                strokeDasharray={`${dash} 200`}
                strokeLinecap="round"
                transform="rotate(-90 29 29)"
            />
        </Svg>
    );
}

function IconStreak() {
    return (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 0c0 4-2 6-2 6 3-1 4-4 4-7 2 2 3 5 3 7a9 9 0 1 1-18 0c0-4 3-7 5-9 1 2 0 4 0 4s2-1 0-7c2 0 4 2 4 4 0-2-2-4-2-4z"
                fill="#FF6B4A"
            />
        </Svg>
    );
}

function IconTutor() {
    return (
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path
                d="M9 3a4 4 0 0 0-4 4 4 4 0 0 0-1 7 4 4 0 0 0 4 5 3 3 0 0 0 4 1 3 3 0 0 0 4-1 4 4 0 0 0 4-5 4 4 0 0 0-1-7 4 4 0 0 0-4-4 3 3 0 0 0-5 0z"
                stroke="#7B4BC4"
                strokeWidth={1.5}
            />
        </Svg>
    );
}

function IconBook() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M4 5h16v11H7l-3 3z" stroke="#FF6B4A" strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
    );
}

function IconWarning() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3l9 16H3z" stroke="#E2483D" strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M12 9v4M12 16v.3" stroke="#E2483D" strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function IconPlus() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
    );
}

function IconNavHome({ active }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
                d="M3 11l9-8 9 8M5 10v9h5v-6h4v6h5v-9"
                stroke={active ? '#FF6B4A' : '#9AA2B1'}
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function IconNavTraining() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
                d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3"
                stroke="#9AA2B1"
                strokeWidth={1.7}
                strokeLinecap="round"
            />
        </Svg>
    );
}

function IconNavSocial() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3a4 4 0 0 1 4 4 4 4 0 0 1-8 0 4 4 0 0 1 4-4zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"
                stroke="#9AA2B1"
                strokeWidth={1.7}
                strokeLinecap="round"
            />
        </Svg>
    );
}

function IconNavSettings() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={3} stroke="#9AA2B1" strokeWidth={1.7} />
            <Path
                d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z"
                stroke="#9AA2B1"
                strokeWidth={1.3}
            />
        </Svg>
    );
}

// Iconos de los nudges (26×26, reutilizan el trazo de sus notificaciones)
function IconFatigueLarge() {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path d="M20 12a8 8 0 1 1-8-8M12 7v5l3 2" stroke="#2D6FB0" strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
}

function IconTutorLarge() {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
                d="M9 3a4 4 0 0 0-4 4 4 4 0 0 0-1 7 4 4 0 0 0 4 5 3 3 0 0 0 4 1 3 3 0 0 0 4-1 4 4 0 0 0 4-5 4 4 0 0 0-1-7 4 4 0 0 0-4-4 3 3 0 0 0-5 0z"
                stroke="#7B4BC4"
                strokeWidth={1.5}
            />
        </Svg>
    );
}

function IconBoeLarge() {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path d="M4 5h16v14H4z" stroke="#E2483D" strokeWidth={1.6} />
            <Path d="M8 9h8M8 13h6" stroke="#E2483D" strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
    );
}

// ─── Definición de los 3 nudges (2.4 a/b/c) ──────────────────────────────────
// Vista previa temporal: en producción cada nudge lo disparará su propio motor
// (fatiga biométrica, estadísticas de rendimiento, monitor BOE de otros bloques).
const NUDGES = {
    fatigue: {
        iconBg: '#EAF3FB',
        icon: <IconFatigueLarge />,
        title: 'Tu nivel de fatiga es alto',
        description:
            'Tu HRV ha bajado y el pulso en reposo está elevado. Tómate 10 minutos de respiración guiada antes de seguir: rendirás más.',
        primaryLabel: 'Hacer pausa de 10 min',
        secondaryLabel: 'Seguir estudiando',
    },
    academic: {
        iconBg: '#F1ECFA',
        icon: <IconTutorLarge />,
        title: 'La Ley 39/2015 se te resiste',
        description:
            'Has fallado 6 de las últimas 10 preguntas de este tema. ¿Quieres que el Tutor IA te lo explique en el Aula Virtual?',
        primaryLabel: 'Que me lo explique la IA',
        secondaryLabel: 'Ahora no',
    },
    boe: {
        iconBg: '#FDEBE9',
        icon: <IconBoeLarge />,
        title: '¡Alerta BOE!',
        description:
            'El artículo 14 de tu temario ha sido modificado. Haz un mini-test de actualización para no estudiar nada desfasado.',
        primaryLabel: 'Ver el cambio y hacer test',
        secondaryLabel: 'Más tarde',
    },
};

// ─── Pantalla principal (2.1 Dashboard + 2.2 Acceso rápido) ─────────────────
export default function DashboardScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [activeNudge, setActiveNudge] = useState(null); // null | 'fatigue' | 'academic' | 'boe'
    const nudge = activeNudge ? NUDGES[activeNudge] : null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />

            {/* Status bar */}
            <View style={styles.statusBar}>
                <Text style={styles.statusBarTime}>9:41</Text>
            </View>

            {/* Header (dash-head) */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>JL</Text>
                </View>
                <View>
                    <Text style={styles.greeting}>Listo aqui se termina b, Juan</Text>
                    <Text style={styles.greetingSub}>Justicia · Tramitación</Text>
                </View>
                <TouchableOpacity
                    style={styles.bell}
                    onPress={() => navigation.navigate('Notifications')}
                    activeOpacity={0.7}
                >
                    <View style={styles.bellBadge} />
                    <IconBell />
                </TouchableOpacity>
            </View>

            {/* Cuerpo scrollable (scr-scroll) */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                {/* ── 2.2 Módulo Acceso rápido ── */}
                <Text style={styles.quickLabel}>CONTINÚA DONDE LO DEJASTE</Text>

                <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}>
                    <View style={[styles.quickIcon, { backgroundColor: '#FFF1EC' }]}>
                        <IconBook />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.quickTitle}>Última ley consultada</Text>
                        <Text style={styles.quickSubtitle}>Ley 39/2015 · art. 21</Text>
                    </View>
                    <Text style={styles.chevronLight}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickCard, { marginTop: 10 }]} activeOpacity={0.7}>
                    <View style={[styles.quickIcon, { backgroundColor: '#FDEBE9' }]}>
                        <IconWarning />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.quickTitle}>Último error</Text>
                        <Text style={styles.quickSubtitle}>Derecho Administrativo · repasar</Text>
                    </View>
                    <Text style={styles.chevronLight}>›</Text>
                </TouchableOpacity>

                <View style={styles.resumeCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.resumeTitle}>¿Seguimos con el simulacro?</Text>
                        <Text style={styles.resumeSubtitle}>Examen 2022 · 28% completado</Text>
                    </View>
                    <TouchableOpacity style={styles.resumeBtn} activeOpacity={0.85}>
                        <Text style={styles.resumeBtnText}>Reanudar</Text>
                    </TouchableOpacity>
                </View>

                {/* ── 2.1 Widgets vivos ── */}
                <TouchableOpacity
                    style={[styles.widget, { backgroundColor: '#EAF3FB', marginTop: 22 }]}
                    onPress={() => navigation.navigate('HomeHealth')}
                    activeOpacity={0.85}
                >
                    <View style={styles.widgetHead}>
                        <IconHealth />
                        <Text style={[styles.widgetHeadText, { color: '#2D6FB0' }]}>Salud</Text>
                        <Text style={styles.chev}>›</Text>
                    </View>
                    <View style={styles.healthRow}>
                        <View>
                            <Text style={styles.healthValue}>
                                68 <Text style={styles.healthUnit}>ppm</Text>
                            </Text>
                            <Text style={styles.healthStatus}>Energía buena · 84%</Text>
                        </View>
                        <View style={{ marginLeft: 'auto' }}>
                            <HealthSparkline />
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.grid2}>
                    <View style={[styles.widget, styles.widgetHalf, { backgroundColor: '#EAF7F1' }]}>
                        <View style={styles.widgetHead}>
                            <IconPlan />
                            <Text style={[styles.widgetHeadText, { color: '#1f9d6b' }]}>Plan</Text>
                        </View>
                        <View style={styles.ringWrap}>
                            <PlanProgressRing percent={75} />
                            <Text style={styles.ringText}>75%</Text>
                        </View>
                        <Text style={styles.ringCaption}>2 de 3 tests hoy</Text>
                    </View>

                    <View style={[styles.widget, styles.widgetHalf, { backgroundColor: '#FFF1EC' }]}>
                        <View style={styles.widgetHead}>
                            <IconStreak />
                            <Text style={[styles.widgetHeadText, { color: '#E0552F' }]}>Racha</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.streakValue}>14</Text>
                            <Text style={styles.streakCaption}>días seguidos</Text>
                            <Text style={styles.streakPoints}>+120 Opopoints</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.widget, { backgroundColor: '#F1ECFA' }]}>
                    <View style={styles.widgetHead}>
                        <IconTutor />
                        <Text style={[styles.widgetHeadText, { color: '#7B4BC4' }]}>Repaso IA</Text>
                        <Text style={styles.chev}>›</Text>
                    </View>
                    <Text style={styles.tutorText}>Pregúntale al Tutor o escucha en modo podcast.</Text>
                </View>

                {/* Vista previa temporal de los nudges — quitar cuando cada motor real
                    (fatiga, estadísticas, monitor BOE) dispare el suyo */}
                <Text style={styles.demoLabel}>VISTA PREVIA · NUDGES</Text>
                <View style={styles.demoRow}>
                    <TouchableOpacity style={styles.demoPill} onPress={() => setActiveNudge('fatigue')}>
                        <Text style={styles.demoPillText}>Fatiga</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.demoPill} onPress={() => setActiveNudge('academic')}>
                        <Text style={styles.demoPillText}>Tema flojo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.demoPill} onPress={() => setActiveNudge('boe')}>
                        <Text style={styles.demoPillText}>Alerta BOE</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 70 + insets.bottom }} />
            </ScrollView>

            {/* Botón central (+) = Nuevo Test */}
            <View style={[styles.fab, { bottom: 38 + insets.bottom }]}>
                <IconPlus />
            </View>

            {/* Nav inferior */}
            <View style={[styles.nav, { height: 56 + insets.bottom, paddingBottom: insets.bottom }]}>
                <View style={styles.navItem}>
                    <IconNavHome active />
                    <Text style={[styles.navLabel, styles.navLabelActive]}>Inicio</Text>
                </View>
                <View style={styles.navItem}>
                    <IconNavTraining />
                    <Text style={styles.navLabel}>Entreno</Text>
                </View>
                <View style={{ width: 40 }} />
                <View style={styles.navItem}>
                    <IconNavSocial />
                    <Text style={styles.navLabel}>Social</Text>
                </View>
                <View style={styles.navItem}>
                    <IconNavSettings />
                    <Text style={styles.navLabel}>Ajustes</Text>
                </View>
            </View>

            {nudge && (
                <NudgeModal
                    visible={!!activeNudge}
                    iconBg={nudge.iconBg}
                    icon={nudge.icon}
                    title={nudge.title}
                    description={nudge.description}
                    primaryLabel={nudge.primaryLabel}
                    secondaryLabel={nudge.secondaryLabel}
                    onPrimaryPress={() => setActiveNudge(null)}
                    onSecondaryPress={() => setActiveNudge(null)}
                />
            )}
        </SafeAreaView>
    );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6FA',
    },

    statusBar: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        flexShrink: 0,
    },
    statusBarTime: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1B2A4A',
        marginRight: 'auto',
    },

    // ── Header (dash-head) ──────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#1B2A4A',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    greeting: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F1B33',
    },
    greetingSub: {
        fontSize: 10,
        color: '#8A92A0',
        marginTop: 1,
    },
    bell: {
        marginLeft: 'auto',
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F4F6FA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bellBadge: {
        position: 'absolute',
        top: 6,
        right: 7,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B4A',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        zIndex: 1,
    },

    // ── Scroll + body ────────────────────────────
    scroll: {
        flex: 1,
    },
    body: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },

    // ── Acceso rápido (2.2) ──────────────────────
    quickLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#5A6373',
        marginBottom: 9,
    },
    quickCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 13,
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    quickIcon: {
        width: 40,
        height: 40,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    quickTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B2A4A',
    },
    quickSubtitle: {
        fontSize: 11,
        color: '#7A8290',
        marginTop: 1,
    },
    chevronLight: {
        color: '#C4CBD6',
        fontSize: 16,
    },
    resumeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: '#1B2A4A',
        borderRadius: 14,
        padding: 14,
        marginTop: 14,
    },
    resumeTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    resumeSubtitle: {
        fontSize: 11,
        color: '#9AA7C2',
        marginTop: 1,
    },
    resumeBtn: {
        backgroundColor: '#FF6B4A',
        borderRadius: 9,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    resumeBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },

    // ── Widgets (2.1) ────────────────────────────
    widget: {
        borderRadius: 16,
        padding: 13,
        marginBottom: 11,
    },
    widgetHalf: {
        marginBottom: 0,
    },
    widgetHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 9,
    },
    widgetHeadText: {
        fontSize: 12,
        fontWeight: '700',
    },
    chev: {
        marginLeft: 'auto',
        color: '#9AA2B1',
    },

    healthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    healthValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F1B33',
    },
    healthUnit: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8A92A0',
    },
    healthStatus: {
        fontSize: 10,
        fontWeight: '600',
        color: '#2BB673',
        marginTop: 2,
    },

    grid2: {
        flexDirection: 'row',
        gap: 11,
        marginBottom: 11,
    },
    ringWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringText: {
        position: 'absolute',
        fontSize: 14,
        fontWeight: '800',
        color: '#0F1B33',
    },
    ringCaption: {
        textAlign: 'center',
        fontSize: 9.5,
        color: '#7A8290',
        marginTop: 2,
    },

    streakValue: {
        fontSize: 30,
        fontWeight: '800',
        color: '#0F1B33',
        lineHeight: 32,
    },
    streakCaption: {
        fontSize: 9.5,
        color: '#7A8290',
    },
    streakPoints: {
        marginTop: 6,
        fontSize: 9,
        fontWeight: '700',
        color: '#E0552F',
    },

    tutorText: {
        fontSize: 11.5,
        color: '#5A6373',
    },

    // ── Vista previa nudges (temporal) ───────────
    demoLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#5A6373',
        marginTop: 6,
        marginBottom: 9,
    },
    demoRow: {
        flexDirection: 'row',
        gap: 8,
    },
    demoPill: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#D4DAE6',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
    },
    demoPillText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1B2A4A',
    },

    // ── FAB (+) ──────────────────────────────────
    fab: {
        position: 'absolute',
        bottom: 38,
        alignSelf: 'center',
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#FF6B4A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#FF6B4A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 6,
        zIndex: 5,
    },

    // ── Nav inferior ─────────────────────────────
    nav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEF1F7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 6,
    },
    navItem: {
        alignItems: 'center',
        gap: 2,
    },
    navLabel: {
        fontSize: 8.5,
        color: '#9AA2B1',
    },
    navLabelActive: {
        color: '#FF6B4A',
    },
});
