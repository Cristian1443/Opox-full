import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

function changeTypeToDetailType(ct) {
    if (ct === 'modificacion' || ct === 'derogacion') return 'critical';
    if (ct === 'tipografica') return 'review';
    return 'info';
}

// ─── 10.2 · Cambio legal · resumen del cambio ─────────────────────────────────
// Fiel al Figma (CambioLegalScreen.tsx). Mismo mapeo de categoría confirmado en
// 10.1 (BoeHomeScreen): critical=rojo/afecta, info=naranja/afecta, review=verde/informativa.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
    bodyMuted: 'rgba(52, 58, 61, 0.7)',
    borderMuted: 'rgba(65, 41, 80, 0.3)',
};

const TYPE_CFG = {
    critical: { color: colors.statRed, bg: 'rgba(255, 38, 56, 0.06)', label: 'Afecta a tu temario' },
    info: { color: colors.accentOrange, bg: `${colors.accentOrange}0F`, label: 'Afecta a tu temario' },
    review: { color: colors.ctaGreen, bg: `${colors.ctaGreen}0F`, label: 'Informativa' },
};

const FILTER_TABS = [
    { key: 'temario', label: 'Mi temario' },
    { key: 'opo', label: 'Toda mi opo' },
    { key: 'guardados', label: 'Guardados' },
];

const MOCK_DETAIL = {
    '1': {
        title: 'Art. 14 · Ley 39/2015',
        subtitle: 'Procedimiento Administrativo Común',
        type: 'critical',
        summary:
            'Se amplía el listado de sujetos obligados a relacionarse electrónicamente con la Administración, incluyendo a determinados profesionales antes exentos.',
        source: 'BOE núm. 142 · 13 jun 2026',
        date: 'Hoy, 10:41',
    },
    '2': {
        title: 'Nueva instrucción · Registro electrónico',
        subtitle: 'Ley 39/2015 — Capítulo III',
        type: 'info',
        summary:
            'La instrucción concreta los plazos de presentación telemática y establece el horario de cierre del registro electrónico los días inhábiles.',
        source: 'BOE núm. 141 · 12 jun 2026',
        date: 'Ayer, 14:30',
    },
    '3': {
        title: 'Corrección de errores · Ley 40/2015',
        subtitle: 'Régimen Jurídico del Sector Público',
        type: 'review',
        summary:
            'Corrección de errata tipográfica en el art. 3.2. Sin impacto sobre el contenido normativo ni sobre los tests existentes.',
        source: 'BOE núm. 140 · 12 jun 2026',
        date: '12 jun, 09:15',
    },
};

function BulletDot({ color }) {
    return <View style={[styles.bulletDot, { backgroundColor: color }]} />;
}

// ─── Íconos confirmados en Figma ───────────────────────────────────────────
// Ícono exacto exportado de Figma (sliders de filtro con topes) — mismo
// componente visual que Monitor BOE (10.1), reutilizado tal cual.
function FilterIcon({ size = 20, color = colors.textDark }) {
    return (
        <Svg width={size} height={(size * 48) / 54} viewBox="0 0 54 48" fill="none">
            <Path d="M7.10698 25.4101H1.42148C1.22868 25.4204 1.03578 25.3916 0.854571 25.3253C0.673358 25.2591 0.507623 25.1569 0.367479 25.025C0.227335 24.893 0.115719 24.7341 0.0394429 24.5579C-0.0368336 24.3817 -0.0761719 24.1918 -0.0761719 24C-0.0761719 23.8082 -0.0368336 23.6184 0.0394429 23.4422C0.115719 23.2659 0.227335 23.107 0.367479 22.9751C0.507623 22.8431 0.673358 22.7409 0.854571 22.6747C1.03578 22.6085 1.22868 22.5796 1.42148 22.5899H7.10698C7.47023 22.6093 7.81216 22.7663 8.06239 23.0287C8.31261 23.291 8.45208 23.6386 8.45208 24C8.45208 24.3614 8.31261 24.7091 8.06239 24.9714C7.81216 25.2337 7.47023 25.3907 7.10698 25.4101Z" fill={color} />
            <Path d="M12.7885 31.0587C11.3824 31.0587 10.0079 30.6443 8.83887 29.868C7.66988 29.0916 6.75898 27.9881 6.22144 26.6973C5.6839 25.4064 5.54388 23.9861 5.8191 22.6162C6.09432 21.2462 6.77241 19.9881 7.76755 19.0012C8.7627 18.0142 10.0302 17.3427 11.4096 17.0717C12.789 16.8006 14.2183 16.9422 15.5167 17.4785C16.8151 18.0147 17.9242 18.9216 18.7036 20.0843C19.4831 21.2471 19.8978 22.6134 19.8954 24.0103C19.8911 25.8805 19.1405 27.6726 17.8083 28.9939C16.4761 30.3151 14.6709 31.0577 12.7885 31.0587ZM12.7885 19.7658C11.9455 19.7658 11.1214 20.0141 10.4203 20.4792C9.71929 20.9444 9.17274 21.6055 8.84976 22.3791C8.52678 23.1528 8.44186 24.0041 8.60573 24.8257C8.7696 25.6472 9.17491 26.4021 9.77043 26.9949C10.366 27.5877 11.125 27.9918 11.9516 28.1562C12.7782 28.3205 13.6353 28.2378 14.4147 27.9184C15.194 27.599 15.8605 27.0573 16.33 26.3617C16.7996 25.6661 17.051 24.8479 17.0526 24.0103C17.0532 23.4535 16.9433 22.902 16.7293 22.3873C16.5153 21.8726 16.2014 21.4048 15.8054 21.0107C15.4094 20.6166 14.9392 20.3038 14.4216 20.0902C13.9039 19.8766 13.349 19.7664 12.7885 19.7658Z" fill={color} />
            <Path d="M24.1676 8.4687H1.42148C1.22868 8.47899 1.03578 8.45015 0.854571 8.38394C0.673358 8.31772 0.507623 8.21552 0.367479 8.08357C0.227335 7.95162 0.115719 7.79269 0.0394429 7.61647C-0.0368336 7.44025 -0.0761719 7.25043 -0.0761719 7.05861C-0.0761719 6.86678 -0.0368336 6.67697 0.0394429 6.50075C0.115719 6.32453 0.227335 6.16559 0.367479 6.03364C0.507623 5.90169 0.673358 5.79949 0.854571 5.73328C1.03578 5.66707 1.22868 5.63823 1.42148 5.64852H24.1676C24.5308 5.66791 24.8728 5.82493 25.123 6.08725C25.3732 6.34956 25.5127 6.69721 25.5127 7.05861C25.5127 7.42001 25.3732 7.76765 25.123 8.02997C24.8728 8.29228 24.5308 8.4493 24.1676 8.4687Z" fill={color} />
            <Path d="M52.5784 8.4687H35.526C35.3332 8.47899 35.1403 8.45015 34.9591 8.38394C34.7778 8.31772 34.6121 8.21552 34.472 8.08357C34.3318 7.95162 34.2202 7.79269 34.1439 7.61647C34.0677 7.44025 34.0283 7.25043 34.0283 7.05861C34.0283 6.86678 34.0677 6.67697 34.1439 6.50075C34.2202 6.32453 34.3318 6.16559 34.472 6.03364C34.6121 5.90169 34.7778 5.79949 34.9591 5.73328C35.1403 5.66707 35.3332 5.63823 35.526 5.64852H52.5784C52.7712 5.63823 52.9641 5.66707 53.1453 5.73328C53.3265 5.79949 53.4922 5.90169 53.6324 6.03364C53.7725 6.16559 53.8841 6.32453 53.9604 6.50075C54.0367 6.67697 54.076 6.86678 54.076 7.05861C54.076 7.25043 54.0367 7.44025 53.9604 7.61647C53.8841 7.79269 53.7725 7.95162 53.6324 8.08357C53.4922 8.21552 53.3265 8.31772 53.1453 8.38394C52.9641 8.45015 52.7712 8.47899 52.5784 8.4687Z" fill={color} />
            <Path d="M29.8408 14.1173C28.435 14.1173 27.0608 13.7031 25.892 12.9271C24.7232 12.1511 23.8123 11.0482 23.2745 9.75776C22.7367 8.46736 22.5962 7.0475 22.8707 5.67776C23.1453 4.30802 23.8226 3.04995 24.8169 2.06267C25.8112 1.07538 27.0779 0.403245 28.4568 0.131269C29.8357 -0.140707 31.2648 -0.000302307 32.5633 0.534723C33.8618 1.06975 34.9715 1.97536 35.7519 3.13701C36.5323 4.29866 36.9485 5.66415 36.9476 7.06079C36.9455 8.93234 36.1959 10.7266 34.8634 12.0496C33.531 13.3726 31.7246 14.1163 29.8408 14.1173ZM29.8408 2.82441C28.9974 2.82441 28.173 3.07287 27.4717 3.53837C26.7705 4.00387 26.224 4.6655 25.9012 5.4396C25.5785 6.21369 25.494 7.06548 25.6586 7.88726C25.8231 8.70904 26.2292 9.46388 26.8256 10.0564C27.4219 10.6488 28.1817 11.0523 29.0089 11.2158C29.836 11.3792 30.6934 11.2953 31.4726 10.9747C32.2517 10.654 32.9177 10.1111 33.3863 9.41439C33.8548 8.71772 34.1049 7.89866 34.1049 7.06079C34.1038 5.93756 33.6542 4.86065 32.8548 4.06641C32.0553 3.27217 30.9714 2.82549 29.8408 2.82441Z" fill={color} />
            <Path d="M52.5786 25.4101H18.4737C18.2809 25.4204 18.088 25.3916 17.9068 25.3253C17.7256 25.2591 17.5599 25.1569 17.4197 25.025C17.2796 24.893 17.168 24.7341 17.0917 24.5579C17.0154 24.3817 16.9761 24.1918 16.9761 24C16.9761 23.8082 17.0154 23.6184 17.0917 23.4422C17.168 23.2659 17.2796 23.107 17.4197 22.9751C17.5599 22.8431 17.7256 22.7409 17.9068 22.6747C18.088 22.6085 18.2809 22.5796 18.4737 22.5899H52.5786C52.7714 22.5796 52.9643 22.6085 53.1455 22.6747C53.3267 22.7409 53.4924 22.8431 53.6326 22.9751C53.7727 23.107 53.8843 23.2659 53.9606 23.4422C54.0369 23.6184 54.0762 23.8082 54.0762 24C54.0762 24.1918 54.0369 24.3817 53.9606 24.5579C53.8843 24.7341 53.7727 24.893 53.6326 25.025C53.4924 25.1569 53.3267 25.2591 53.1455 25.3253C52.9643 25.3916 52.7714 25.4204 52.5786 25.4101Z" fill={color} />
            <Path d="M32.6836 42.3515H1.42148C1.22868 42.3618 1.03578 42.333 0.854571 42.2667C0.673358 42.2005 0.507623 42.0983 0.367479 41.9664C0.227335 41.8344 0.115719 41.6755 0.0394429 41.4993C-0.0368336 41.3231 -0.0761719 41.1332 -0.0761719 40.9414C-0.0761719 40.7496 -0.0368336 40.5598 0.0394429 40.3836C0.115719 40.2073 0.227335 40.0484 0.367479 39.9165C0.507623 39.7845 0.673358 39.6823 0.854571 39.6161C1.03578 39.5499 1.22868 39.521 1.42148 39.5313H32.6836C32.8764 39.521 33.0693 39.5499 33.2505 39.6161C33.4317 39.6823 33.5974 39.7845 33.7376 39.9165C33.8777 40.0484 33.9893 40.2073 34.0656 40.3836C34.1419 40.5598 34.1812 40.7496 34.1812 40.9414C34.1812 41.1332 34.1419 41.3231 34.0656 41.4993C33.9893 41.6755 33.8777 41.8344 33.7376 41.9664C33.5974 42.0983 33.4317 42.2005 33.2505 42.2667C33.0693 42.333 32.8764 42.3618 32.6836 42.3515Z" fill={color} />
            <Path d="M52.5786 42.3515H44.0504C43.8576 42.3618 43.6647 42.333 43.4835 42.2667C43.3023 42.2005 43.1365 42.0983 42.9964 41.9664C42.8562 41.8344 42.7446 41.6755 42.6683 41.4993C42.5921 41.3231 42.5527 41.1332 42.5527 40.9414C42.5527 40.7496 42.5921 40.5598 42.6683 40.3836C42.7446 40.2073 42.8562 40.0484 42.9964 39.9165C43.1365 39.7845 43.3023 39.6823 43.4835 39.6161C43.6647 39.5499 43.8576 39.521 44.0504 39.5313H52.5786C52.7714 39.521 52.9643 39.5499 53.1455 39.6161C53.3268 39.6823 53.4925 39.7845 53.6326 39.9165C53.7728 40.0484 53.8844 40.2073 53.9607 40.3836C54.037 40.5598 54.0763 40.7496 54.0763 40.9414C54.0763 41.1332 54.037 41.3231 53.9607 41.4993C53.8844 41.6755 53.7728 41.8344 53.6326 41.9664C53.4925 42.0983 53.3268 42.2005 53.1455 42.2667C52.9643 42.333 52.7714 42.3618 52.5786 42.3515Z" fill={color} />
            <Path d="M38.369 48.0197C36.9637 48.0213 35.5895 47.609 34.4201 46.8348C33.2506 46.0607 32.3384 44.9595 31.7988 43.6704C31.2592 42.3814 31.1163 40.9623 31.3883 39.5926C31.6602 38.2229 32.3348 36.964 33.3268 35.9751C34.3187 34.9862 35.5835 34.3116 36.9613 34.0367C38.339 33.7618 39.7679 33.8988 41.0672 34.4305C42.3666 34.9621 43.4782 35.8646 44.2614 37.0237C45.0446 38.1829 45.4644 39.5467 45.4677 40.9428C45.4693 41.8705 45.2869 42.7895 44.9311 43.6472C44.5752 44.505 44.0528 45.2847 43.3936 45.9418C42.7344 46.599 41.9514 47.1207 41.0893 47.4772C40.2272 47.8338 39.3028 48.0181 38.369 48.0197ZM38.369 36.7268C37.5254 36.7259 36.7006 36.9737 35.9988 37.4387C35.2971 37.9037 34.7499 38.5651 34.4265 39.3391C34.1031 40.1131 34.0181 40.9651 34.1822 41.7871C34.3462 42.6091 34.752 43.3644 35.3482 43.9573C35.9444 44.5501 36.7042 44.954 37.5315 45.1178C38.3587 45.2816 39.2163 45.1979 39.9957 44.8774C40.7751 44.5569 41.4413 44.0139 41.9101 43.3172C42.3788 42.6204 42.629 41.8012 42.629 40.9631C42.6311 40.4056 42.5226 39.8531 42.3096 39.3373C42.0966 38.8214 41.7832 38.3524 41.3876 37.957C40.9919 37.5617 40.5216 37.2477 40.0036 37.0331C39.4856 36.8185 38.9302 36.7075 38.369 36.7064V36.7268Z" fill={color} />
        </Svg>
    );
}

// Ícono exacto exportado de Figma: sin guardar = marcador contorneado.
function BookmarkOutlineIcon({ size = 30, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 63 63" fill="none">
            <Path d="M1.7522 1.75195V61.2528L31.5026 41.4158L61.2531 61.2528V1.75195H1.7522Z" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Ícono exacto exportado de Figma: guardado = documento archivado.
function BookmarkedDocIcon({ size = 24, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={(size * 63) / 49} viewBox="0 0 49 63" fill="none">
            <Path d="M30.5364 63H1.52845H0V61.5025V1.50153V0H1.52845H47.333H48.8614V1.50153V43.5002H45.8086V2.99905H3.05282V60.001H30.5364V63Z" fill={color} />
            <Path d="M32.1096 59.1441V45.0017H49L46.6401 47.5163L34.7589 60.1571L32.1096 62.96V59.1281V59.1441ZM35.1624 48.0008V55.3122L42.0343 48.0008H35.1624Z" fill={color} />
        </Svg>
    );
}

export default function BoeDetailScreen({ route, navigation }) {
    const { itemId = '1', type: routeType } = route.params ?? {};
    const mockDetail = MOCK_DETAIL[itemId] ?? MOCK_DETAIL['1'];

    const [apiDetail, setApiDetail] = useState(null);
    const [bookmarked, setBookmarked] = useState(false);
    // Filtro decorativo — mismo componente visual que Monitor BOE (10.1),
    // reutilizado tal cual por Figma. Sin acción funcional confirmada sobre
    // esta pantalla de detalle (no navega ni refiltra nada aquí).
    const [filterTab, setFilterTab] = useState('temario');

    const [affectedCount, setAffectedCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            boeApi.getDetail(itemId).then(res => {
                if (res?.data) {
                    const d = res.data;
                    setApiDetail({
                        title: `${d.articulo} · ${d.shortTitle}`,
                        subtitle: d.regulationTitle,
                        type: changeTypeToDetailType(d.changeType),
                        summary: d.hint,
                        source: d.sourceDescription,
                        date: new Date(d.detectedAt).toLocaleDateString('es-ES'),
                    });
                    setBookmarked(d.isBookmarked);
                    setAffectedCount(d.affectedQuestionsCount ?? 0);
                }
            }).catch(() => {});
        }, [itemId]),
    );

    const detail = apiDetail ?? mockDetail;
    const type = routeType ?? detail.type;
    const cfg = TYPE_CFG[type] ?? TYPE_CFG.critical;

    function handleBookmarkToggle() {
        setBookmarked(b => !b);
        boeApi.toggleBookmark(itemId).catch(() => {});
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.screen}>
                {/* ── Header ──────────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Volver"
                    >
                        <Feather name="chevron-left" size={22} color={colors.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cambio legal</Text>
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={handleBookmarkToggle}
                        accessibilityLabel={bookmarked ? 'Quitar de guardados' : 'Guardar cambio'}
                    >
                        {bookmarked ? <BookmarkedDocIcon /> : <BookmarkOutlineIcon />}
                    </TouchableOpacity>
                </View>

                {/* ── Filtro (decorativo, ver nota arriba) ───────────────────── */}
                <View style={styles.filterRow}>
                    <FilterIcon />
                    {FILTER_TABS.map(tab => {
                        const isActive = filterTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.filterTab, isActive && styles.filterTabActive]}
                                onPress={() => setFilterTab(tab.key)}
                                accessibilityLabel={tab.label}
                                accessibilityState={{ selected: isActive }}
                            >
                                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Tarjeta de alerta */}
                    <View style={[styles.alertCard, { borderColor: cfg.color, backgroundColor: cfg.bg }]}>
                        <Text style={[styles.alertTag, { color: cfg.color }]}>{cfg.label}</Text>
                        <Text style={styles.alertTitle}>{detail.title}</Text>
                        <Text style={styles.alertCategory}>{detail.subtitle}</Text>
                    </View>

                    {/* Qué ha cambiado */}
                    <View style={styles.sectionRow}>
                        <BulletDot color={colors.accentOrange} />
                        <Text style={styles.sectionLabel}>QUÉ HA CAMBIADO</Text>
                    </View>
                    <Text style={styles.sectionBody}>{detail.summary}</Text>

                    {/* Publicado en */}
                    <View style={[styles.sectionRow, styles.sectionSpacing]}>
                        <BulletDot color={colors.accentOrange} />
                        <Text style={styles.sectionLabel}>PUBLICADO EN:</Text>
                    </View>
                    <Text style={styles.sectionBody}>{detail.source}</Text>

                    {/* ── CTAs — solo para cambios que afectan al banco de preguntas ─── */}
                    {type !== 'review' && (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                activeOpacity={0.85}
                                onPress={() =>
                                    navigation.navigate('BoeComparison', {
                                        itemId,
                                        title: detail.title,
                                        subtitle: detail.subtitle,
                                    })
                                }
                                accessibilityLabel="Ver comparativa antes y después"
                            >
                                <Text style={styles.primaryButtonText}>Ver comparativa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                activeOpacity={0.78}
                                onPress={() =>
                                    navigation.navigate('BoeMiniTest', { itemId, title: detail.title })
                                }
                                accessibilityLabel="Mini-test para validar aprendizaje"
                            >
                                <Text style={styles.secondaryButtonText}>Mini-test</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {affectedCount > 0 && type !== 'review' && (
                        <TouchableOpacity
                            style={[styles.tertiaryButton, { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                            activeOpacity={0.78}
                            onPress={() => navigation.navigate('GeneratorConfig', { questionCount: 10 })}
                            accessibilityLabel={`Practicar las ${affectedCount} preguntas afectadas`}
                        >
                            <Ionicons name="barbell-outline" size={18} color={cfg.color} />
                            <Text style={[styles.tertiaryButtonText, { color: cfg.color }]}>
                                Practicar · {affectedCount} pregunta{affectedCount > 1 ? 's' : ''} afectada{affectedCount > 1 ? 's' : ''}
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },
    screen: {
        flex: 1,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },

    // ── Header ────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },

    // ── Filtro ────────────────────────────────────────────────────
    filterRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    filterTabActive: {
        backgroundColor: colors.purple,
    },
    filterTabText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10.7,
        color: FIGMA.subtitleMuted,
    },
    filterTabTextActive: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
    },

    // ── Scroll ────────────────────────────────────────────────────
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },

    // ── Tarjeta de alerta ─────────────────────────────────────────
    alertCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    alertTag: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 10.2,
        marginBottom: 6,
    },
    alertTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        color: colors.textDark,
    },
    alertCategory: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.subtitleMuted,
        marginTop: 2,
    },

    // ── Secciones ─────────────────────────────────────────────────
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    sectionSpacing: {
        marginTop: 20,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    sectionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: colors.textDark,
    },
    sectionBody: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13.5,
        color: FIGMA.bodyMuted,
        lineHeight: 19,
    },

    // ── Botones ───────────────────────────────────────────────────
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.sm + 4,
        marginTop: spacing.xl + spacing.sm,
    },
    primaryButton: {
        flex: 1,
        height: 61.3,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },
    secondaryButton: {
        flex: 1,
        height: 61.3,
        borderRadius: 14.2,
        borderWidth: 1,
        borderColor: FIGMA.borderMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.textDark,
    },
    tertiaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: 14,
        borderRadius: 14.2,
        borderWidth: 1,
        marginTop: spacing.sm + 4,
    },
    tertiaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
});
