import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { RachaPeligroModal } from '../../components/MotivationModals';
import DestacadoBanner from '../../components/DestacadoBanner';
import { motivationApi, planningApi } from '../../api';
import { colors, spacing } from '../../theme';

// Escalera de hitos de racha — misma tabla que apps/backend/src/application/motivation/StreakDetailUseCase.ts.
// MotivationHomeScreen solo pide motivationApi.getSummary() (gamification.currentStreak/longestStreak/opopointsBalance),
// no el endpoint separado /motivation/streak (StreakDetailUseCase) que expone nextMilestone/recentActivityDates.
// Para no añadir una llamada de red nueva a esta pantalla, el próximo hito se deriva aquí mismo a partir del
// currentStreak ya disponible, usando la misma tabla fija que el backend.
const STREAK_MILESTONES = [
    { days: 7, points: 50 },
    { days: 14, points: 100 },
    { days: 21, points: 200 },
    { days: 30, points: 300 },
    { days: 60, points: 500 },
    { days: 100, points: 1000 },
];

function getNextMilestone(currentStreak) {
    const next = STREAK_MILESTONES.find((m) => m.days > currentStreak);
    if (!next) return null;
    return { days: next.days, points: next.points, remaining: next.days - currentStreak };
}

// Figma: el chevron dentro del círculo de 24dp mide ~5.5x11dp — bastante más chico
// que el botón que lo contiene.
function IconChevronLeft({ size = 11, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Llama real de Figma ("ICONO RACHA", 2334:335) — 2 paths, mismo naranja, no la
// llama genérica de una sola curva que tenía antes.
function IconFlame({ size = 32, color = colors.accentOrange }) {
    const h = size * (110.37 / 81);
    return (
        <Svg width={size} height={h} viewBox="0 0 81 111" fill="none">
            <Path
                d="M80.6257 70.2502C79.5424 62.3827 74.8545 56.2403 70.5565 49.754C70.2451 50.3688 70.0311 50.8102 69.8009 51.2408C68.2464 54.1306 66.8923 57.153 65.0995 59.8829C61.5598 65.3239 56.3817 67.8534 49.8143 67.7369C49.7958 67.5994 49.7958 67.4601 49.8143 67.3226C50.0662 66.7972 50.3289 66.2745 50.5888 65.7518C53.7358 59.455 55.9728 52.8848 56.3194 45.7945C56.7365 37.3366 54.5347 29.5069 50.5049 22.1215C45.8468 13.585 39.2523 6.65724 32.3003 0.00842829C32.2678 -0.0213627 32.1513 0.035511 32.0294 0.0598855C32.0782 0.46071 32.1432 0.858826 32.1757 1.25965C32.59 6.23204 33.24 11.2017 33.3483 16.1822C33.5027 23.2481 31.477 29.7019 26.632 35.04C24.3652 37.5397 21.9549 39.9148 19.6177 42.3523C15.0841 47.0755 11.9724 52.5489 10.7672 59.0488C10.445 60.7875 10.2391 62.5452 9.98185 64.2947L9.61895 64.4003L4.99332 52.7548C2.70758 58.2824 0.968908 63.726 0.318936 69.5027C-1.37821 84.6113 3.69789 96.8978 15.5472 106.362C17.3861 107.83 19.4606 109.003 21.5053 110.368L23.875 105.853C5.55663 95.6674 3.39547 77.4867 5.90599 67.8101C8.19172 72.3221 11.8641 75.3309 15.5662 78.765C15.5202 77.9119 15.4877 77.3838 15.466 76.8692C15.3225 73.362 15.0137 69.8521 15.0733 66.3476C15.1979 58.7482 17.5107 51.9342 22.8757 46.3524C24.9321 44.2129 26.9958 42.0824 29.0667 39.9609C34.0254 34.872 37.1913 28.884 38.0281 21.7802C38.3315 19.2561 38.4614 16.7104 38.6998 13.8125C40.5305 16.3312 42.3098 18.5736 43.8643 20.9596C48.2354 27.6734 51.1034 34.9072 51.2605 43.0537C51.3851 49.6836 49.6599 55.872 46.8244 61.7869C45.1995 65.183 43.4527 68.5278 41.7276 71.9591C54.226 74.5428 64.5037 71.8941 71.063 60.0671C74.8138 65.0801 76.5254 71.8616 75.7265 78.6621C74.283 90.9523 67.6723 99.746 57.0398 105.81L59.3093 110.108C59.4376 110.113 59.566 110.101 59.6912 110.073C59.8943 109.981 60.092 109.87 60.287 109.761C67.0169 105.945 72.4171 100.767 76.1571 93.9693C80.2303 86.5676 81.7875 78.6296 80.6257 70.2502Z"
                fill={color}
            />
            <Path
                d="M39.7761 25.0326C38.4734 27.1152 37.3631 28.9569 36.1904 30.7579C33.1626 35.4107 26.17 37.1223 21.3277 34.4276C17.7556 32.4343 15.4726 29.4525 14.4326 25.5065C13.027 20.1875 13.6201 14.8738 14.5653 9.57646C15.134 6.40778 15.8355 3.26076 16.499 0C-5.35634 15.1528 -3.81265 40.0825 11.2829 53.7647L14.8632 50.3929C10.4569 45.824 7.00938 40.7351 5.67964 34.4438C4.34179 28.1038 5.3032 22.0968 8.3689 16.3986C8.4718 16.8675 8.52535 17.3458 8.52869 17.8259C8.84555 20.805 8.86992 23.8707 9.56864 26.7632C12.1767 37.5475 23.5485 44.6567 35.183 38.5198C35.3703 38.4534 35.5634 38.4044 35.7598 38.3735C34.384 43.5951 31.0963 47.1646 26.8958 50.1301L29.7232 54.3307C34.5574 51.0049 38.2026 46.9236 40.1715 41.4583C42.1404 35.993 40.9135 30.6847 39.7761 25.0326Z"
                fill={color}
                transform="translate(19.77, 55.78)"
            />
        </Svg>
    );
}

// Figma confirma que los 3 íconos de EXPLORAR usan el MISMO naranja (colors.accentOrange),
// no colores distintos por ícono.
function IconRankings() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9V3h12v6a6 6 0 0 1-12 0zM9 21h6M12 15v6" stroke={colors.accentOrange} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
    );
}

function IconClan() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke={colors.accentOrange} strokeWidth={1.6} />
            <Path d="M3 19a6 6 0 0 1 12 0M16 7a3 3 0 0 1 0 6M21 19a5 5 0 0 0-3-4.5" stroke={colors.accentOrange} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );
}

// Isotipo "X" de la marca OPOX — mismos 7 paths verificados que IconoScreen.js.
// (La versión anterior de 3 paths omitía piezas y se veía distorsionada.)
function IconOpoxMark({ size = 40 }) {
    return (
        <Svg width={size} height={size} viewBox="330 0 155 185" fill="none">
            <Path
                d="M411.545 80.7817C408.905 83.1117 397.295 92.4217 397.295 92.4217C395.895 90.6617 394.405 88.7117 392.855 86.6717L392.785 86.5917C385.175 76.5917 375.695 64.1317 363.945 57.2917L363.615 57.1217C361.54 55.9884 359.14 55.5976 356.812 56.0141C354.485 56.4305 352.369 57.6292 350.815 59.4117C349.297 61.2163 348.428 63.4785 348.348 65.8357C348.268 68.1929 348.982 70.5086 350.375 72.4117L378.605 110.092C376.225 112.432 373.605 114.802 370.895 117.312C359.625 127.632 346.895 139.312 341.255 155.552C338.255 164.112 343.015 167.952 344.535 168.922C348.535 171.492 353.875 170.512 358.105 166.462L397.415 130.002C399.875 132.442 402.415 135.062 404.845 137.592C417.595 150.802 430.785 164.462 449.165 170.592C450.284 170.969 451.455 171.164 452.635 171.172C454.133 171.205 455.614 170.848 456.931 170.134C458.248 169.42 459.356 168.375 460.145 167.102C461.755 164.422 462.145 159.872 457.975 155.902C450.115 148.462 442.825 140.662 435.115 132.402C428.835 125.672 422.345 118.722 415.405 111.862L427.625 100.092C431.535 96.0017 428.465 65.8517 411.545 80.7817Z"
                fill={colors.textDark}
            />
            <Path
                d="M410.125 111.602C410.205 110.912 403.705 106.402 397.995 104.602C397.995 104.602 412.445 90.1417 418.695 83.7117C425.455 85.3617 429.515 91.5917 430.005 91.3617C430.305 91.2117 429.195 82.6817 425.425 77.7317C429.916 74.3373 434.648 71.2758 439.585 68.5717C442.075 67.1617 444.855 65.5717 447.585 63.7517C452.585 66.3717 455.585 71.1017 456.045 70.9017C456.305 70.7817 455.555 64.6717 453.045 59.7917C458.105 55.6817 462.245 50.7917 463.045 45.0317C472.455 45.2817 476.755 51.9217 478.565 56.2517C476.978 58.6764 475.17 60.9494 473.165 63.0417C469.285 57.6817 462.525 54.4317 462.165 54.7817C461.805 55.1317 467.005 61.0017 467.005 68.6217C461.451 72.8501 455.599 76.6733 449.495 80.0617C446.205 73.4917 439.115 70.6617 438.715 71.0617C438.315 71.4617 442.155 76.5217 442.215 84.3817C435.535 88.3817 429.345 92.6417 424.655 97.9617C417.425 94.4717 409.385 97.5117 409.325 98.0817C409.265 98.6517 413.515 97.8117 418.655 102.742C416.235 107.262 410.005 112.362 410.125 111.602Z"
                fill={colors.accentOrange}
            />
            <Path
                d="M450.545 56.1818C453.715 53.4518 456.184 50.0022 457.745 46.1218C457.825 45.9118 457.895 45.6918 457.965 45.4818C459.645 45.1537 461.355 45.0062 463.065 45.0418C462.255 50.7818 458.115 55.6918 453.065 59.8018C452.402 58.4815 451.553 57.2625 450.545 56.1818Z"
                fill="#F37D27"
            />
            <Path
                d="M442.945 62.2117C444.575 62.4636 446.15 62.9875 447.605 63.7617C444.855 65.5717 442.075 67.1717 439.605 68.5817C434.668 71.2857 429.936 74.3472 425.445 77.7417C424.874 76.9688 424.201 76.276 423.445 75.6817C427.445 72.6817 431.585 69.9017 435.595 67.2317C438.115 65.5217 440.605 63.8617 442.945 62.2117Z"
                fill="#F37D27"
            />
            <Path
                d="M418.695 83.7216C412.445 90.1516 397.995 104.612 397.995 104.612C396.265 104.442 394.995 102.092 393.125 102.522C393.125 102.522 407.736 90.0716 414.456 83.3616C415.879 83.2587 417.31 83.3802 418.695 83.7216Z"
                fill="#F37D27"
            />
            <Path
                d="M457.405 0.211664C466.095 -1.09834 475.855 3.75166 482.265 12.5617C490.735 24.2217 491.565 39.6517 484.475 53.8417C477.155 68.4717 463.605 76.3717 450.475 84.0117C434.195 93.4917 426.055 101.552 415.365 111.852C413.465 113.672 399.755 124.202 400.085 126.622C400.085 126.622 396.005 122.622 396.795 122.332C396.795 122.332 415.925 105.412 418.665 102.702C413.525 97.7717 409.295 98.4917 409.335 98.0417C409.375 97.5917 417.435 94.4317 424.665 97.9217C429.355 92.6017 435.545 88.3817 442.225 84.3417C442.165 76.4817 438.375 71.3417 438.725 71.0217C439.075 70.7017 446.215 73.4917 449.505 80.0217C455.604 76.6457 461.453 72.8359 467.005 68.6217C466.935 61.0317 461.775 55.1417 462.155 54.7917C462.535 54.4417 469.265 57.6917 473.155 63.0517C475.16 60.9593 476.968 58.6863 478.555 56.2617C476.745 51.9317 472.445 45.2617 463.035 45.0417C461.324 45.0061 459.615 45.1536 457.935 45.4817C457.865 45.6917 457.795 45.9117 457.715 46.1217C456.153 50.002 453.685 53.4517 450.515 56.1817C451.52 57.263 452.365 58.4819 453.025 59.8017C455.545 64.6817 456.295 70.8017 456.025 70.9117C455.615 71.1117 452.595 66.3817 447.565 63.7617C446.11 62.9875 444.535 62.4636 442.905 62.2117C440.565 63.8617 438.075 65.5217 435.495 67.2117C431.495 69.8817 427.335 72.6317 423.345 75.6617C424.101 76.256 424.774 76.9488 425.345 77.7217C429.115 82.7217 430.225 91.2017 429.925 91.3517C429.435 91.5817 425.375 85.3517 418.615 83.7017C417.23 83.3603 415.799 83.2388 414.375 83.3417C407.655 90.0517 393.045 102.502 393.045 102.502C394.915 102.072 408.905 108.642 413.155 113.832C413.155 113.832 399.805 124.192 400.035 126.602C400.035 126.602 377.335 111.392 379.365 109.182C391.295 96.2617 416.835 75.0017 433.375 64.0017C443.075 57.5617 451.445 52.0017 454.085 44.8017C456.615 37.8817 454.085 32.6817 451.085 26.6717C449.155 22.7517 447.155 18.6717 446.435 13.8817C446.44 13.8619 446.44 13.8414 446.435 13.8217C445.575 8.00166 448.635 1.54166 457.405 0.211664Z"
                fill={colors.textDark}
            />
            <Defs>
                <LinearGradient id="shopXGrad" x1="432.685" y1="88.1717" x2="390.915" y2="107.642" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={colors.textDark} stopOpacity={0} />
                    <Stop offset="0.04" stopColor={colors.textDark} stopOpacity={0.12} />
                    <Stop offset="0.21" stopColor={colors.textDark} stopOpacity={0.5} />
                    <Stop offset="0.37" stopColor={colors.textDark} stopOpacity={0.78} />
                    <Stop offset="0.52" stopColor={colors.textDark} stopOpacity={0.94} />
                    <Stop offset="0.66" stopColor={colors.textDark} stopOpacity={1} />
                </LinearGradient>
            </Defs>
            <Path
                d="M409.585 81.7917C406.935 84.1317 387.515 100.362 387.515 100.362L409.575 117.152L430.905 97.6117C437.805 91.5017 426.495 66.8617 409.585 81.7917Z"
                fill="url(#shopXGrad)"
            />
        </Svg>
    );
}

// Figma ("ICONO RETO", 2333:202): una bandera, no un rayo.
function IconChallenge() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M5 3v18M5 4h13l-3 4 3 4H5" stroke={colors.accentOrange} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
    );
}

// Figma ("EXPLORAR", node 2337:1207): fila horizontal de pares icono+etiqueta,
// NO una lista vertical de filas con chevron.
function ExploreItem({ icon, label, onPress }) {
    return (
        <TouchableOpacity style={styles.exploreItem} onPress={onPress} activeOpacity={0.6}>
            {icon}
            <Text style={styles.exploreLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

export default function MotivationHomeScreen({ navigation }) {
    const [summary, setSummary] = useState(null);
    const [dangerVisible, setDangerVisible] = useState(false);
    const [dangerHours, setDangerHours] = useState(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([motivationApi.getSummary(), planningApi.getSummary()]).then(([m, p]) => {
            if (cancelled) return;
            if (m.data) setSummary(m.data);
            const hour = new Date().getHours();
            const goalPending = p.data && p.data.today.completedCount < p.data.today.goalCount;
            if (hour >= 21 && goalPending && m.data?.gamification.currentStreak > 0) {
                setDangerHours(Math.max(1, 24 - hour));
                setDangerVisible(true);
            }
        });
        return () => { cancelled = true; };
    }, []);

    const gamification = summary?.gamification ?? { currentStreak: 0, longestStreak: 0, opopointsBalance: 0 };
    const myClan = summary?.myClan ?? null;
    const nextMilestone = getNextMilestone(gamification.currentStreak);

    // Ver tienda: todavía no existe una pantalla/ruta de tienda de Opopoints en OnboardingNavigator.
    // Se deja como no-op hasta que exista esa pantalla (ver informe).
    const handleShopPress = () => { };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.grayLight} />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <IconChevronLeft />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Motivación</Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Figma ("HOME - MOTIVACIÓN Y RACHA", 2332:2): el banner DESTACADO va PRIMERO,
                    justo después del header — no al final de la pantalla. */}
                <DestacadoBanner
                    opopoints={gamification.opopointsBalance.toLocaleString('es-ES')}
                    globalRank="-"
                    localRank="-"
                />

                {/* Figma: icono de llama a la izquierda + columna de texto a la derecha (no centrado/apilado) */}
                <TouchableOpacity style={styles.heroWrap} onPress={() => navigation.navigate('StreakDetail')} activeOpacity={0.85}>
                    <IconFlame size={66} />
                    <View>
                        <Text style={styles.heroValue}>{gamification.currentStreak}</Text>
                        <Text style={styles.heroCaption}>Días de racha</Text>
                        <Text style={styles.heroRecord}>Récord: {gamification.longestStreak} días</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.groupTitle}>ÚLTIMOS 14 DÍAS</Text>
                <View style={styles.pipsRow}>
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <View key={i} style={[styles.pip, styles.pipDone]} />
                    ))}
                </View>
                <View style={[styles.pipsRow, { marginBottom: 0 }]}>
                    {[7, 8, 9, 10, 11, 12].map((i) => (
                        <View key={i} style={[styles.pip, styles.pipDone]} />
                    ))}
                    <View style={[styles.pip, styles.pipToday]} />
                </View>

                {/* Figma: sin tarjeta/borde — solo icono + 2 líneas de texto sobre el fondo */}
                <Text style={styles.groupTitle}>PRÓXIMO HITO</Text>
                <View style={styles.milestoneRow}>
                    <IconFlame size={36} />
                    {nextMilestone ? (
                        <View>
                            <Text style={styles.milestoneTitle}>Racha de {nextMilestone.days} días</Text>
                            <Text style={styles.milestoneCaption}>
                                + {nextMilestone.points} Opopoints (faltan {nextMilestone.remaining})
                            </Text>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.milestoneTitle}>¡Racha máxima alcanzada!</Text>
                            <Text style={styles.milestoneCaption}>Sigue así para mantenerla</Text>
                        </View>
                    )}
                </View>

                {/* Figma ("ATAJO TIENDA", 2334:311): tarjeta con borde fino, X-mark + valor/caption + link */}
                <TouchableOpacity style={styles.shopCard} onPress={handleShopPress} activeOpacity={0.85}>
                    <IconOpoxMark size={48} />
                    <View style={styles.shopTextWrap}>
                        <Text style={styles.shopValue}>{gamification.opopointsBalance.toLocaleString('es-ES')}</Text>
                        <Text style={styles.shopCaption}>Opopoints disponibles</Text>
                    </View>
                    <View style={styles.shopLinkRow}>
                        <Text style={styles.shopLinkText}>Ver tienda</Text>
                        <Text style={styles.shopArrow}>›</Text>
                    </View>
                </TouchableOpacity>

                {/* Figma ("EXPLORAR", 2337:1207): una sola fila horizontal, sin chevrons */}
                <Text style={styles.groupTitle}>EXPLORAR</Text>
                <View style={styles.exploreRow}>
                    <ExploreItem icon={<IconRankings />} label="Rankings" onPress={() => navigation.navigate('Rankings')} />
                    <ExploreItem
                        icon={<IconClan />}
                        label={myClan ? myClan.name : 'Mis clanes'}
                        onPress={() => navigation.navigate(myClan ? 'ClanDetail' : 'ClansList', myClan ? { clanId: myClan.id } : undefined)}
                    />
                    {myClan && (
                        <ExploreItem icon={<IconChallenge />} label="Retos" onPress={() => navigation.navigate('Challenges', { clanId: myClan.id })} />
                    )}
                </View>
            </ScrollView>

            <RachaPeligroModal
                visible={dangerVisible}
                hours={dangerHours ?? 1}
                days={gamification.currentStreak}
                onPrimaryPress={() => { setDangerVisible(false); navigation.navigate('PlanningToday'); }}
                onSecondaryPress={() => setDangerVisible(false)}
            />

            {/* RachaRecordModal (MotivationModals.js) queda disponible para cuando el backend
                exponga un evento real de "acabas de batir tu récord" — Figma no muestra ningún
                botón de vista previa en esta pantalla, así que no se agrega ninguno aquí. */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.grayLight },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: colors.textDark, marginRight: 'auto' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: 6,
        paddingBottom: spacing.sm,
    },
    // Figma (2332:60): botón de volver = círculo de 24x24dp exacto (1dp = 2.25px de Figma).
    backBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(65, 41, 80, 0.1)', // colors.textDark @ 10% opacity
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Figma (2332:62 "Motivación"): fontSize 21dp exacto.
    headerTitle: { fontSize: 21, fontWeight: '600', color: colors.textDark, letterSpacing: -0.3 },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 27, paddingBottom: spacing.lg },
    heroWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.lg },
    // Figma (2334:286 "14"): fontSize 75dp exacto.
    heroValue: { fontSize: 75, fontWeight: '800', color: colors.textDark, lineHeight: 80 },
    // Figma (2334:290 "Días de racha"): fontSize 16dp exacto.
    heroCaption: { fontSize: 16, color: colors.textDark },
    // Figma (2334:332 "Récord: X días"): fontSize 9dp exacto.
    heroRecord: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
    // Figma (2337:1211/1212/1210 — ÚLTIMOS 14 DÍAS / PRÓXIMO HITO / EXPLORAR): fontSize 16dp exacto.
    groupTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textDark,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
        marginTop: spacing.xs,
    },
    // Figma (2337:1223 "DÍAS RACHAS"): fila de 346dp con 7 pips de 45x45dp y ~5dp de gap.
    pipsRow: { flexDirection: 'row', gap: 5, marginBottom: 5 },
    pip: { flex: 1, aspectRatio: 1, borderRadius: 8 },
    pipDone: { backgroundColor: colors.ctaGreen },
    pipToday: { backgroundColor: colors.ctaGreen, opacity: 0.5 },
    // Figma: sin tarjeta — icono + texto directamente sobre el fondo
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    // Figma (2334:336 "Racha de X días"): fontSize 16dp exacto.
    milestoneTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark },
    // Figma (2334:339 "+ X Opopoints..."): fontSize 9dp exacto.
    milestoneCaption: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
    // Figma ("ATAJO TIENDA", 2334:311): tarjeta de 348x119dp, borde fino, fondo prácticamente transparente
    shopCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(65, 41, 80, 0.15)',
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    shopTextWrap: { flex: 1 },
    // Figma (2332:34 "560"): fontSize 28dp exacto.
    shopValue: { fontSize: 28, fontWeight: '700', color: colors.textDark },
    shopCaption: { fontSize: 11, color: colors.textMuted },
    shopLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    // Figma (2332:133 "Ver tienda"): fontSize 16dp exacto.
    shopLinkText: { fontSize: 16, fontWeight: '700', color: colors.textDark },
    shopArrow: { fontSize: 16, color: colors.textDark },
    // Figma ("EXPLORAR", 2337:1207): fila de 339dp de ancho, sin chevrons
    exploreRow: { flexDirection: 'row', justifyContent: 'space-between' },
    exploreItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    // Figma (2337:1209 "Rankings"): fontSize 14dp exacto.
    exploreLabel: { fontSize: 14, fontWeight: '500', color: colors.textDark },
});
