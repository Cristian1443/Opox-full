import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AvatarPlaceholder from '../../components/AvatarPlaceholder';
import { motivationApi } from '../../api';
import { colors, spacing } from '../../theme';

// Iconos exactos exportados de Figma (antes eran aproximaciones).
function IconChat({ size = 22 }) {
    return (
        <Svg width={(size * 73) / 52} height={size} viewBox="0 0 73 52" fill="none">
            <Path d="M27.2506 39.5911H4.37585C3.22838 39.5908 2.12638 39.1424 1.30471 38.3414C0.893216 37.947 0.565567 37.4735 0.34138 36.9494C0.117194 36.4253 0.00108258 35.8613 0 35.2913L0 12.2334C0.00108258 11.6634 0.117194 11.0994 0.34138 10.5753C0.565567 10.0512 0.893216 9.57775 1.30471 9.18329C2.12638 8.38229 3.22838 7.93387 4.37585 7.93359H22.2181V11.1065H4.37585C4.05923 11.1088 3.75572 11.2333 3.52864 11.4539C3.42257 11.5543 3.33789 11.6751 3.27965 11.8091C3.22142 11.943 3.19084 12.0873 3.18975 12.2334V35.2913C3.191 35.438 3.22163 35.5829 3.27983 35.7175C3.33804 35.8521 3.42264 35.9737 3.52864 36.075C3.75639 36.2941 4.05982 36.417 4.37585 36.4182H28.9153L29.394 37.1129L35.7481 46.3945L42.1022 37.1129L42.5936 36.4309H44.8175C45.1332 36.428 45.436 36.3054 45.6647 36.0877C45.7701 35.9862 45.8541 35.8645 45.9116 35.7298C45.969 35.5952 45.9989 35.4504 45.9994 35.304V33.2452H49.1722V35.2913C49.1716 35.861 49.0562 36.4248 48.8327 36.9489C48.6093 37.473 48.2824 37.9466 47.8717 38.3414C47.0487 39.1431 45.9452 39.5915 44.7963 39.5911H44.2372L37.0359 50.0885L35.7269 51.9991L34.4222 50.0885L27.2506 39.5911Z" fill={colors.accentOrange} />
            <Path d="M51.0572 31.6575H28.1825C27.032 31.6516 25.9296 31.1954 25.1113 30.3866C24.6999 29.9922 24.3722 29.5187 24.148 28.9946C23.9238 28.4705 23.8077 27.9066 23.8066 27.3365V4.2998C23.81 3.73364 23.9268 3.17389 24.1502 2.65365C24.3736 2.13341 24.6989 1.66322 25.1071 1.27088C25.9254 0.46212 27.0278 0.00593133 28.1783 0L68.6241 0C69.7746 0.00593133 70.877 0.46212 71.6953 1.27088C72.1068 1.66534 72.4344 2.1388 72.6586 2.66289C72.8828 3.18699 72.9989 3.75094 73 4.32098V27.3577C72.9989 27.9278 72.8828 28.4917 72.6586 29.0158C72.4344 29.5399 72.1068 30.0134 71.6953 30.4078C70.877 31.2166 69.7746 31.6728 68.6241 31.6787H68.0607L60.8594 42.1761L59.559 44.057L58.25 42.1507L51.0487 31.6533L51.0572 31.6575ZM28.1825 28.4846H52.7262L53.2007 29.1793L59.5547 38.4609L65.9088 29.1793L66.3833 28.4846H68.6241C68.9401 28.483 69.2434 28.3602 69.4714 28.1414C69.5773 28.0401 69.6619 27.9185 69.7202 27.7839C69.7784 27.6493 69.809 27.5044 69.8102 27.3577V4.2998C69.8094 4.15371 69.7789 4.00931 69.7207 3.87533C69.6624 3.74135 69.5776 3.62058 69.4714 3.52033C69.2448 3.29892 68.9409 3.17435 68.6241 3.17295H28.1783C27.8615 3.17435 27.5576 3.29892 27.331 3.52033C27.2254 3.62079 27.1412 3.7417 27.0837 3.87569C27.0261 4.00968 26.9964 4.15397 26.9964 4.2998V27.3577C26.9968 27.5041 27.0267 27.6489 27.0842 27.7835C27.1417 27.9182 27.2256 28.0399 27.331 28.1414C27.559 28.3602 27.8623 28.483 28.1783 28.4846H28.1825Z" fill={colors.accentOrange} />
        </Svg>
    );
}

function IconFlag({ size = 22 }) {
    return (
        <Svg width={(size * 39) / 44} height={size} viewBox="0 0 39 44" fill="none">
            <Path d="M32.1914 15.5281L38.6452 9.20666C38.8148 9.03892 38.9302 8.82577 38.9766 8.594C39.023 8.36223 38.9985 8.12217 38.9062 7.904C38.8138 7.68583 38.6578 7.49928 38.4575 7.36778C38.2573 7.23629 38.0219 7.16572 37.7809 7.16494H19.5123V3.58419C19.5123 3.42525 19.48 3.2679 19.4172 3.12135C19.3544 2.97481 19.2624 2.84202 19.1466 2.73075C19.0308 2.61949 18.8935 2.532 18.7427 2.47339C18.5919 2.41479 18.4308 2.38626 18.2686 2.38946H2.43816V1.19473C2.43816 0.877869 2.30972 0.573984 2.0811 0.349929C1.85248 0.125873 1.5424 0 1.21908 0C0.895759 0 0.585682 0.125873 0.35706 0.349929C0.128438 0.573984 0 0.877869 0 1.19473L0 41.8225C0 42.1393 0.128438 42.4432 0.35706 42.6673C0.585682 42.8913 0.895759 43.0172 1.21908 43.0172C1.5424 43.0172 1.85248 42.8913 2.0811 42.6673C2.30972 42.4432 2.43816 42.1393 2.43816 41.8225V19.1123H12.1873V22.693C12.1873 23.0099 12.3157 23.3138 12.5443 23.5378C12.773 23.7619 13.083 23.8877 13.4064 23.8877H37.7809C38.022 23.8879 38.2576 23.8181 38.4582 23.687C38.6587 23.556 38.8151 23.3696 38.9076 23.1515C39.0001 22.9333 39.0245 22.6932 38.9778 22.4615C38.9311 22.2297 38.8154 22.0167 38.6452 21.8495L32.1914 15.5281ZM2.43816 4.77893H17.0636V16.7228H2.43816V4.77893ZM14.6254 21.4983V19.1123H18.2686C18.431 19.1136 18.5919 19.0833 18.7422 19.0231C18.8924 18.9628 19.0289 18.8739 19.1437 18.7614C19.2585 18.6489 19.3493 18.5151 19.4108 18.3679C19.4722 18.2206 19.5032 18.0628 19.5018 17.9038V9.55441H34.8404L29.6092 14.6845C29.4956 14.795 29.4054 14.9264 29.3438 15.0711C29.2822 15.2159 29.2505 15.3712 29.2505 15.5281C29.2505 15.6849 29.2822 15.8402 29.3438 15.985C29.4054 16.1298 29.4956 16.2612 29.6092 16.3716L34.8404 21.4983H14.6254Z" fill={colors.accentOrange} />
        </Svg>
    );
}


export default function ClanDetailScreen({ navigation, route }) {
    const { clanId } = route.params;
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setLoadError(false);
        motivationApi.getClanDetail(clanId).then(({ data, error }) => {
            if (data) setDetail(data);
            else setLoadError(true);
            setLoading(false);
        });
    }, [clanId]);

    useEffect(() => { load(); }, [load]);

    const headerTitle = detail ? `${detail.name} Clan` : 'Clan';

    if (!detail) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.grayLight} />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
                </View>
                <View style={styles.centeredState}>
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.ctaGreen} />
                    ) : (
                        <>
                            <Text style={styles.errorText}>No se pudo cargar el clan.</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
                                <Text style={styles.retryBtnText}>Reintentar</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.grayLight} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Figma: nombre del clan va DENTRO de la tarjeta verde (morado oscuro sobre verde),
                    entre las iniciales y el puesto en el ranking — no como título aparte arriba. */}
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryInitials}>{detail.initials}</Text>
                    <Text style={styles.summaryName}>{detail.name}</Text>
                    {detail.rankPosition && <Text style={styles.summaryCaption}>Puesto {detail.rankPosition} en el ranking de clanes</Text>}
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('ClanChat', { clanId })}
                        activeOpacity={0.85}
                    >
                        <IconChat />
                        <Text style={styles.actionBtnText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('Challenges', { clanId })}
                        activeOpacity={0.85}
                    >
                        <IconFlag />
                        <Text style={styles.actionBtnText}>Retos ({detail.challengeCount})</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.separator} />

                <Text style={styles.groupTitle}>MIEMBROS: {detail.memberCount}</Text>
                {detail.members.map((m, i) => (
                    <React.Fragment key={m.userId}>
                        <View style={styles.memberRow}>
                            <AvatarPlaceholder size={48} />
                            <View>
                                <Text style={styles.memberName}>{m.displayName || 'Opositor'}</Text>
                                <Text style={styles.memberCaption}>
                                    {m.role === 'leader' ? 'Líder · ' : ''}{m.points.toLocaleString('es-ES')} Opopoints
                                </Text>
                            </View>
                        </View>
                        {i < detail.members.length - 1 && <View style={styles.separator} />}
                    </React.Fragment>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.grayLight },
    centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
    retryBtn: { backgroundColor: colors.ctaGreen, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
    retryBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F0F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { flex: 1, fontSize: 21, fontWeight: '800', color: colors.textDark, letterSpacing: -0.2, textAlign: 'center' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 27, paddingBottom: spacing.lg },
    summaryBox: { backgroundColor: colors.ctaGreen, borderRadius: 14, alignItems: 'center', padding: spacing.lg, marginBottom: 11 },
    // Figma (2334:703 "OJ"): fontSize 57dp exacto.
    summaryInitials: { color: colors.white, fontWeight: '800', fontSize: 57, lineHeight: 64 },
    // Figma: el nombre del clan, dentro de la tarjeta verde, va en morado oscuro (no blanco).
    summaryName: { color: colors.textDark, fontWeight: '700', fontSize: 19, marginTop: spacing.xs },
    summaryCaption: { color: colors.white, fontSize: 12, fontWeight: '400', marginTop: spacing.xs },
    actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 11 },
    // Figma (2337:1257/1265 "CHAT"/"RETOS"): 172.4x65.8dp exacto — paddingVertical calibrado
    // para alcanzar esa altura con el icono+texto reales.
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.textDark,
        borderRadius: 24,
        paddingVertical: 21,
    },
    // Figma (2335:842 "Chat", 2336:847 "Retos (3)"): fontSize 16dp exacto.
    actionBtnText: { color: colors.textDark, fontSize: 16, fontWeight: '600' },
    groupTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, letterSpacing: 0.4, marginBottom: spacing.sm, marginTop: spacing.xs },
    separator: { height: 1, backgroundColor: colors.separator, marginVertical: spacing.xs },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: spacing.sm + 4 },
    memberName: { fontSize: 18, fontWeight: '700', color: colors.textDark },
    memberCaption: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
