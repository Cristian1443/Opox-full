import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AvatarPlaceholder from '../../components/AvatarPlaceholder';
import { motivationApi, api } from '../../api';
import { colors, spacing } from '../../theme';
import { supabase } from '../../lib/supabase';

// Usado solo como fallback cuando supabase no está configurado
const POLL_INTERVAL_MS = 4000;

// Iconos exactos exportados de Figma (antes IconSend era una aproximación).
function IconSend({ size = 30 }) {
    return (
        <Svg width={(size * 74) / 63} height={size} viewBox="0 0 74 63" fill="none">
            <Path d="M69.3167 1.77599H4.15899C3.63113 1.76631 3.11502 1.93221 2.69177 2.2476C2.26851 2.563 1.9621 3.01001 1.82069 3.5184C1.67929 4.02678 1.7109 4.56772 1.91056 5.05619C2.11022 5.54466 2.46662 5.95299 2.92373 6.21699L33.5119 25.5531L44.887 59.5889C45.0415 60.0656 45.3432 60.4812 45.7488 60.7759C46.1543 61.0707 46.6428 61.2294 47.1442 61.2294C47.6456 61.2294 48.1342 61.0707 48.5397 60.7759C48.9452 60.4812 49.2469 60.0656 49.4015 59.5889L71.9827 5.84394C72.1861 5.40234 72.2739 4.91631 72.2378 4.4315C72.2017 3.94668 72.043 3.47898 71.7765 3.0723C71.5099 2.66563 71.1444 2.33331 70.7141 2.10656C70.2838 1.87981 69.803 1.76606 69.3167 1.77599Z" stroke={colors.accentOrange} strokeWidth={4} strokeMiterlimit={10} />
            <Path d="M33.512 25.5529L71.7872 3.13477" stroke={colors.accentOrange} strokeWidth={4} strokeMiterlimit={10} />
        </Svg>
    );
}

function IconMic({ size = 30 }) {
    return (
        <Svg width={(size * 48) / 75} height={size} viewBox="0 0 48 75" fill="none">
            <Path d="M11.548 46.8861C12.954 48.8562 14.8091 50.4624 16.9595 51.5715C19.1098 52.6806 21.4934 53.2605 23.9125 53.2631C25.5518 53.2727 27.1825 53.0266 28.746 52.5335C31.7671 51.6047 34.4086 49.7261 36.2786 47.1763C38.1487 44.6265 39.1477 41.5413 39.1276 38.3784C39.1276 35.686 39.1276 33.0009 39.1276 30.3086V14.8328C39.1653 12.9214 38.8115 11.0225 38.0881 9.25316C37.3646 7.4838 36.2868 5.88145 34.921 4.54487C33.1851 2.73753 31.0217 1.39756 28.6311 0.64892C26.2405 -0.099719 23.6999 -0.232842 21.2442 0.261868C17.8061 0.807884 14.6733 2.55752 12.4036 5.19918C10.134 7.84083 8.87485 11.203 8.85052 14.6869C8.85052 22.6352 8.85052 30.5785 8.85052 38.517C8.81839 41.5258 9.76519 44.4633 11.548 46.8861ZM34.9283 26.6239V30.2721C34.9283 32.9499 34.9283 35.6277 34.9283 38.2982C34.9321 40.998 33.9149 43.5994 32.0811 45.5795C30.2473 47.5597 27.7327 48.772 25.0425 48.9728C23.2069 49.1766 21.3497 48.9083 19.6466 48.1933C17.9435 47.4783 16.4508 46.3403 15.3098 44.8868C13.8715 43.1748 13.0839 41.0092 13.0862 38.7724V38.1157C13.0862 30.3742 13.0352 22.37 13.0862 14.4972C13.1489 12.1232 14.0133 9.84043 15.5385 8.02114C17.0636 6.20185 19.1597 4.95334 21.4848 4.4792C23.7772 3.93881 26.182 4.14245 28.3511 5.06066C30.5202 5.97887 32.3412 7.56402 33.5504 9.5867C34.4646 11.17 34.9426 12.9677 34.9356 14.7964C34.9356 17.6128 34.9356 20.4316 34.9356 23.2529L34.9283 26.6239Z" fill={colors.accentOrange} />
            <Path d="M47.5844 37.3792C47.4307 37.2428 47.25 37.1404 47.054 37.0788C46.858 37.0172 46.6512 36.9977 46.4471 37.0217C46.0684 37.0435 45.6886 37.0435 45.3098 37.0217C45.1049 37.0026 44.8982 37.0273 44.7035 37.0939C44.5087 37.1606 44.3302 37.2677 44.1798 37.4084C44.0405 37.5535 43.9345 37.7272 43.869 37.9174C43.8035 38.1077 43.7802 38.31 43.8007 38.5101C43.8007 38.6998 43.8007 38.9187 43.8007 39.1522V39.3565C43.5996 42.6366 42.5862 45.8152 40.8519 48.6057C39.1177 51.3962 36.717 53.7111 33.8662 55.3418C31.0154 56.9725 27.804 57.8678 24.5213 57.947C21.2387 58.0261 17.988 57.2867 15.062 55.7954C8.55164 52.3588 4.90644 46.8208 4.23572 39.3346C4.23572 39.0428 4.19198 38.7509 4.1774 38.4591L4.08992 37.0581H1.07898L0.393682 37.1092L0 37.941V38.1307C0 38.2402 0 38.3569 0 38.4664C0.0416309 42.8677 1.32549 47.1677 3.70352 50.8703C5.64664 54.0238 8.30336 56.6759 11.4592 58.6126C14.6151 60.5492 18.1817 61.7162 21.8712 62.0192C21.8712 64.9378 21.8712 67.8564 21.8712 70.7749C19.3487 70.7749 16.819 70.7749 14.2965 70.7749H13.5529C13.3083 70.7736 13.0642 70.7956 12.8238 70.8406C12.3724 70.944 11.9682 71.1949 11.675 71.5537C11.3819 71.9125 11.2164 72.3587 11.2047 72.8221C11.193 73.2854 11.3357 73.7394 11.6104 74.1126C11.8851 74.4857 12.2761 74.7567 12.7218 74.8828C13.0077 74.9542 13.302 74.9862 13.5966 74.9777H34.4544C34.7574 74.9827 35.0595 74.9433 35.3512 74.8609C35.7841 74.727 36.1612 74.4546 36.4245 74.0856C36.6879 73.7166 36.8231 73.2712 36.8092 72.8179C36.8047 72.3634 36.6477 71.9235 36.3635 71.5689C36.0792 71.2143 35.6842 70.9655 35.2418 70.8625C34.9647 70.798 34.6806 70.7686 34.3961 70.7749H26.0996V62.0192H26.1434C26.8068 61.9536 27.4921 61.8879 28.1847 61.7493C37.181 59.947 43.3779 54.6425 46.6586 46.0036C47.5246 43.6142 47.9806 41.0955 48.0073 38.5539C48.0255 38.3392 47.9972 38.123 47.9242 37.9203C47.8512 37.7175 47.7353 37.5329 47.5844 37.3792Z" fill={colors.accentOrange} />
        </Svg>
    );
}

/** Formatea un ISO timestamp como "16:45 h" (siguiendo el copy de Figma). */
function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} h`;
}

export default function ClanChatScreen({ navigation, route }) {
    const { clanId } = route.params;
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [myUserId, setMyUserId] = useState(null);
    const [clanInfo, setClanInfo] = useState(null);
    const [onlineCount, setOnlineCount] = useState(null);
    const scrollRef = useRef(null);
    const lastCreatedAtRef = useRef(null);

    useEffect(() => {
        api.loadSession().then((session) => setMyUserId(session?.user?.id ?? null));
    }, []);

    useEffect(() => {
        motivationApi.getClanDetail(clanId).then(({ data }) => { if (data) setClanInfo(data); });
    }, [clanId]);

    // Nombre de quien envía cada mensaje: la API de mensajes solo trae userId,
    // así que lo resolvemos contra la lista de miembros del clan (getClanDetail).
    const membersById = useMemo(() => {
        const map = {};
        (clanInfo?.members || []).forEach((m) => { map[m.userId] = m; });
        return map;
    }, [clanInfo]);

    const poll = useCallback(() => {
        motivationApi.listClanMessages(clanId, lastCreatedAtRef.current).then(({ data }) => {
            if (!data || data.length === 0) return;
            lastCreatedAtRef.current = data[data.length - 1].createdAt;
            setMessages((prev) => [...prev, ...data]);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
        });
    }, [clanId]);

    useEffect(() => {
        poll(); // carga inicial en ambos casos

        if (supabase) {
            // Realtime: recibir mensajes nuevos en tiempo real sin polling
            const channel = supabase
                .channel(`clan-messages-${clanId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'clan_messages',
                    filter: `clan_id=eq.${clanId}`,
                }, (payload) => {
                    const row = payload.new;
                    const msg = {
                        id: row.id,
                        clanId: row.clan_id,
                        userId: row.user_id,
                        body: row.body,
                        createdAt: row.created_at,
                    };
                    setMessages((prev) => {
                        // evitar duplicados si el propio sender ya añadió el msg
                        if (prev.some((m) => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }

        // Fallback: polling cada 4 s cuando no hay cliente Supabase
        const id = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [clanId, poll]);

    const handleSend = async () => {
        const body = draft.trim();
        if (!body) return;
        setDraft('');
        const { data } = await motivationApi.sendClanMessage(clanId, body);
        if (data) {
            lastCreatedAtRef.current = data.createdAt;
            setMessages((prev) => [...prev, data]);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
        }
    };

    // Presence: registrar al usuario en línea y escuchar cuántos hay activos.
    // Solo cuando supabase está configurado y ya tenemos el userId de sesión.
    useEffect(() => {
        if (!supabase || !myUserId) return;
        const presenceChannel = supabase
            .channel(`clan-presence-${clanId}`, { config: { presence: { key: myUserId } } })
            .on('presence', { event: 'sync' }, () => {
                setOnlineCount(Object.keys(presenceChannel.presenceState()).length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ user_id: myUserId });
                }
            });
        return () => { supabase.removeChannel(presenceChannel); };
    }, [clanId, myUserId]);

    const memberLabel = clanInfo
        ? `${clanInfo.memberCount} ${clanInfo.memberCount === 1 ? 'miembro' : 'miembros'}`
        : null;
    const caption = onlineCount !== null && memberLabel
        ? `${memberLabel} · ${onlineCount} en línea`
        : memberLabel;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <View style={styles.clanAvatar}>
                    <Text style={styles.clanAvatarText}>{clanInfo?.initials || '?'}</Text>
                </View>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.clanName} numberOfLines={1}>{clanInfo?.name || 'Chat'}</Text>
                    {caption && <Text style={styles.clanCaption} numberOfLines={1}>{caption}</Text>}
                </View>
            </View>

            <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={styles.body}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
                {messages.map((m) => {
                    const mine = m.userId === myUserId;
                    const senderName = membersById[m.userId]?.displayName || 'Opositor';
                    return (
                        <View key={m.id} style={[styles.msgRow, mine && styles.msgRowMe]}>
                            {!mine && <AvatarPlaceholder size={44} />}
                            <View style={[styles.msg, mine ? styles.msgMe : styles.msgThem]}>
                                {!mine && <Text style={styles.senderName}>{senderName}</Text>}
                                <Text style={mine ? styles.msgTextMe : styles.msgTextThem}>{m.body}</Text>
                                <Text style={styles.timestamp}>{formatTime(m.createdAt)}</Text>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={styles.chatbar}>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe un mensaje…"
                    placeholderTextColor={colors.grayText}
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.micBtn} activeOpacity={0.85}>
                    <IconMic size={26} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
                    <IconSend size={26} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        backgroundColor: colors.white,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F0F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Figma (ICONO CLAN 2336:912): círculo de 54x54dp exacto.
    clanAvatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Figma (OJ 2336:914): fontSize 24dp exacto.
    clanAvatarText: { color: colors.white, fontWeight: '800', fontSize: 24 },
    headerTextWrap: { flexShrink: 1 },
    // Figma (2336:857 "Opo Justicia"): fontSize 21dp exacto.
    clanName: { color: colors.textDark, fontWeight: '800', fontSize: 21 },
    clanCaption: { color: colors.textMuted, fontSize: 12, marginTop: 1 },

    scroll: { flex: 1 },
    body: { padding: 14, paddingBottom: 8 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginBottom: spacing.sm, maxWidth: '85%' },
    msgRowMe: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    msg: { flexShrink: 1, paddingVertical: spacing.sm, paddingHorizontal: 11, borderRadius: 13 },
    msgThem: { backgroundColor: colors.grayLight, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    // Corrección de Figma: los mensajes propios NO son un bloque sólido naranja
    // con texto blanco; son un tinte verde claro (ctaGreen al 32% de opacidad)
    // con texto oscuro, igual que los mensajes de otros.
    msgMe: { backgroundColor: `${colors.ctaGreen}52`, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    senderName: { color: colors.textDark, fontWeight: '700', fontSize: 18, marginBottom: 2 },
    msgTextThem: { color: colors.textDark, fontSize: 18 },
    msgTextMe: { color: colors.textDark, fontSize: 18 },
    timestamp: { color: colors.textMuted, fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },

    chatbar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.separator },
    // Figma (BG 2336:953): caja de 295.8x65.8dp exacto — paddingVertical calibrado
    // para alcanzar esa altura con fontSize 16 real.
    input: { flex: 1, backgroundColor: colors.grayLight, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 23, fontSize: 16, color: colors.textDark },
    sendBtn: { width: 37, height: 32, alignItems: 'center', justifyContent: 'center' },
    micBtn: { width: 30, height: 32, alignItems: 'center', justifyContent: 'center' },
});
