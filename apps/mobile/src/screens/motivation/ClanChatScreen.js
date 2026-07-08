import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { motivationApi, api } from '../../api';

const POLL_INTERVAL_MS = 4000;

function IconSend() {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
            <Path d="M4 12l16-8-6 16-3-6-7-2z" />
        </Svg>
    );
}

export default function ClanChatScreen({ navigation, route }) {
    const { clanId } = route.params;
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [myUserId, setMyUserId] = useState(null);
    const scrollRef = useRef(null);
    const lastCreatedAtRef = useRef(null);

    useEffect(() => {
        api.loadSession().then((session) => setMyUserId(session?.user?.id ?? null));
    }, []);

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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Chat" onBack={() => navigation.goBack()} />

            <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={styles.body}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
                {messages.map((m) => {
                    const mine = m.userId === myUserId;
                    return (
                        <View key={m.id} style={[styles.msg, mine ? styles.msgMe : styles.msgThem]}>
                            <Text style={mine ? styles.msgTextMe : styles.msgTextThem}>{m.body}</Text>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={styles.chatbar}>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe un mensaje…"
                    placeholderTextColor="#9AA2B1"
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
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, backgroundColor: '#fff' },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { padding: 14, paddingBottom: 8 },
    msg: { maxWidth: '78%', paddingVertical: 8, paddingHorizontal: 11, borderRadius: 13, marginBottom: 8 },
    msgThem: { backgroundColor: '#F0F2F7', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    msgMe: { backgroundColor: '#FF6B4A', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    msgTextThem: { color: '#1B2A4A', fontSize: 11 },
    msgTextMe: { color: '#fff', fontSize: 11 },
    chatbar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEF1F7' },
    input: { flex: 1, backgroundColor: '#F0F2F7', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, fontSize: 12, color: '#1B2A4A' },
    sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FF6B4A', alignItems: 'center', justifyContent: 'center' },
});
