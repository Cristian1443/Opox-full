import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import AvatarPlaceholder from '../../components/AvatarPlaceholder';
import { motivationApi, api } from '../../api';
import { colors, spacing } from '../../theme';

const POLL_INTERVAL_MS = 4000;

// Figma (ENVIAR 2336:955): ícono de envío suelto (trazo naranja), sin círculo de
// fondo, ~35x30dp exacto.
function IconSend() {
    return (
        <Svg width={35} height={30} viewBox="0 0 24 24" fill="none">
            <Path d="M3 11l18-8-8 18-3-7-7-3z" stroke={colors.accentOrange} strokeWidth={1.6} strokeLinejoin="round" />
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
        poll();
        const id = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [poll]);

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

    // Nota: el diseño de Figma muestra "28 miembros · 3 en línea", pero la API
    // (ClanDetailDTO) solo expone memberCount total; no hay conteo de miembros
    // en línea en ningún endpoint de motivación. Se omite ese segmento en vez
    // de inventar un dato.
    const caption = clanInfo
        ? `${clanInfo.memberCount} ${clanInfo.memberCount === 1 ? 'miembro' : 'miembros'}`
        : null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backIcon}>‹</Text>
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
                            {!mine && <AvatarPlaceholder size={39} />}
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
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
                    <IconSend />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, backgroundColor: colors.white },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: colors.textDark, marginRight: 'auto' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.sm,
        backgroundColor: colors.white,
    },
    // Figma (NAV 2336:854 "Ellipse 352"): botón de volver = 24x24dp exacto.
    backBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: `${colors.textDark}1A`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: { color: colors.textDark, fontWeight: '700', fontSize: 14, marginTop: -1 },
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
    // Figma (2336:917 "28 miembros · 3 en línea"): fontSize 9dp exacto.
    clanCaption: { color: colors.textMuted, fontSize: 9, marginTop: 1 },

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
    // Figma (2336:876 "Nombre Apellido"): fontSize 16dp exacto.
    senderName: { color: colors.textDark, fontWeight: '700', fontSize: 16, marginBottom: 2 },
    // Figma (2336:936/939 texto de mensaje): fontSize 16dp exacto.
    msgTextThem: { color: colors.textDark, fontSize: 16 },
    msgTextMe: { color: colors.textDark, fontSize: 16 },
    // Figma (2336:949/952 "16:45 h"/"16:50 h"): fontSize 9dp exacto.
    timestamp: { color: colors.textMuted, fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },

    chatbar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.separator },
    // Figma (BG 2336:953): caja de 295.8x65.8dp exacto — paddingVertical calibrado
    // para alcanzar esa altura con fontSize 16 real.
    input: { flex: 1, backgroundColor: colors.grayLight, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 23, fontSize: 16, color: colors.textDark },
    // Figma (ENVIAR 2336:955): grupo de 37x31.5dp exacto.
    sendBtn: { width: 37, height: 32, alignItems: 'center', justifyContent: 'center' },
});
