import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { tutorApi } from '../../api';

// ─── Constantes de color del bloque 8 ────────────────────────────────────────
const PURPLE = colors.purple;         // #7B4BC4
const PURPLE_BG = colors.purpleBg;    // #F1ECFA
const PURPLE_BUBBLE = '#6D3DB8';      // ligeramente más oscuro para contraste en burbuja

// ─── Utilidades ───────────────────────────────────────────────────────────────
const nowTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Mensaje inicial dinámico: si viene con técnica del bloque 3, lo menciona
const buildInitialMessages = (technique) => [
    {
        id: '0',
        isAI: true,
        text: technique
            ? `Hola, veo que vienes del módulo "${technique}". ¿Qué dudas tienes sobre este tema?`
            : '¡Hola! Soy tu Tutor IA. ¿Sobre qué tema del temario quieres que te eche una mano hoy?',
        timestamp: nowTime(),
        actions: null,
    },
];

// ─── Chip de acción rápida ────────────────────────────────────────────────────
function ActionChip({ icon, label, onPress }) {
    return (
        <TouchableOpacity
            style={styles.actionChip}
            onPress={onPress}
            activeOpacity={0.75}
            accessibilityLabel={label}
            accessibilityRole="button"
        >
            <Ionicons name={icon} size={13} color={PURPLE} />
            <Text style={styles.actionText}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── Burbuja de mensaje ───────────────────────────────────────────────────────
function MessageBubble({ msg, onAction }) {
    return (
        <View style={[styles.messageRow, msg.isAI ? styles.rowLeft : styles.rowRight]}>
            {msg.isAI && (
                <View style={styles.avatarSmall}>
                    <Ionicons name="sparkles-outline" size={14} color="#fff" />
                </View>
            )}

            <View style={[styles.bubble, msg.isAI ? styles.bubbleLeft : styles.bubbleRight]}>
                <Text style={[styles.msgText, msg.isAI ? styles.msgTextLeft : styles.msgTextRight]}>
                    {msg.text}
                </Text>
                <Text style={[styles.timestamp, msg.isAI ? styles.tsLeft : styles.tsRight]}>
                    {msg.timestamp}
                </Text>

                {msg.isAI && msg.actions?.length > 0 && (
                    <View style={styles.actionsRow}>
                        {msg.actions.map((a) => (
                            <ActionChip
                                key={a.id}
                                icon={a.icon}
                                label={a.label}
                                onPress={() => onAction(a.label)}
                            />
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

// ─── Indicador "escribiendo…" ─────────────────────────────────────────────────
function TypingIndicator() {
    return (
        <View style={[styles.messageRow, styles.rowLeft]}>
            <View style={styles.avatarSmall}>
                <Ionicons name="sparkles-outline" size={14} color="#fff" />
            </View>
            <View style={[styles.bubble, styles.bubbleLeft, styles.typingBubble]}>
                <Text style={styles.typingText}>Tutor escribiendo…</Text>
            </View>
        </View>
    );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function TutorChatScreen({ navigation, route }) {
    const technique = route?.params?.technique ?? null;

    const [messages, setMessages] = useState(() => buildInitialMessages(technique));
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const scrollRef = useRef(null);
    const conversationIdRef = useRef(null);

    // Crea la conversación en el backend al montar la pantalla
    useEffect(() => {
        tutorApi.createConversation('Nueva conversación', technique)
            .then((res) => {
                if (!res?.error && res?.data?.id) conversationIdRef.current = res.data.id;
            })
            .catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const scrollToBottom = useCallback(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
    }, []);

    const handleScroll = useCallback((e) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
        const fromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
        setShowScrollBtn(fromBottom > 80);
    }, []);

    const addMessage = useCallback((msg) => {
        setMessages((prev) => [...prev, msg]);
    }, []);

    const sendToApi = useCallback(async (userText) => {
        setIsTyping(true);
        try {
            const cid = conversationIdRef.current;
            if (!cid) throw new Error('no-conv');
            const res = await tutorApi.sendMessage(cid, userText);
            if (res?.error || !res?.data) throw new Error('api-err');
            const ai = res.data.aiMessage;
            addMessage({
                id: ai.id,
                isAI: true,
                text: ai.content,
                timestamp: nowTime(),
                actions: Array.isArray(ai.suggestedActions)
                    ? ai.suggestedActions.map((a, i) => ({ id: `sa${i}`, label: a.label, icon: a.icon }))
                    : null,
            });
        } catch {
            // fallback stub cuando el backend no está disponible
            addMessage({
                id: Date.now().toString(),
                isAI: true,
                text: 'Claro, aquí tienes una explicación detallada…',
                timestamp: nowTime(),
                actions: [
                    { id: 'a1', label: 'Crear flashcards', icon: 'layers-outline' },
                    { id: 'a2', label: 'Ponme un ejemplo', icon: 'bulb-outline' },
                ],
            });
        } finally {
            setIsTyping(false);
        }
    }, [addMessage]);

    const handleSend = useCallback(() => {
        const text = inputText.trim();
        if (!text) return;

        addMessage({
            id: Date.now().toString(),
            isAI: false,
            text,
            timestamp: nowTime(),
            actions: null,
        });
        setInputText('');
        sendToApi(text);
    }, [inputText, addMessage, sendToApi]);

    const handleAction = useCallback((label) => {
        if (label === 'Crear flashcards') {
            navigation.navigate('TutorFlashcardsLoading');
            return;
        }
        if (label === 'Lanzar test') {
            navigation.navigate('GeneratorConfig');
            return;
        }

        addMessage({
            id: Date.now().toString(),
            isAI: false,
            text: label,
            timestamp: nowTime(),
            actions: null,
        });
        sendToApi(label);
    }, [navigation, addMessage, sendToApi]);

    const canSend = inputText.trim().length > 0;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            {/* Header estilo chat — diferente del ScreenHeader estándar */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="arrow-back" size={22} color={colors.dark} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles-outline" size={20} color="#fff" />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Tutor IA</Text>
                        <View style={styles.onlineRow}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>En línea</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.moreBtn}
                    accessibilityLabel="Más opciones"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() =>
                        Alert.alert('Opciones', null, [
                            {
                                text: 'Nueva conversación',
                                onPress: async () => {
                                    setMessages(buildInitialMessages(technique));
                                    setInputText('');
                                    try {
                                        const res = await tutorApi.createConversation('Nueva conversación', technique);
                                        if (!res?.error && res?.data?.id) conversationIdRef.current = res.data.id;
                                    } catch {}
                                },
                            },
                            { text: 'Compartir chat', onPress: () => {} },
                            { text: 'Cancelar', style: 'cancel' },
                        ])
                    }
                >
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.dark} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Área de mensajes */}
                <View style={styles.flex}>
                    <ScrollView
                        ref={scrollRef}
                        style={styles.flex}
                        contentContainerStyle={styles.msgList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={scrollToBottom}
                        onScroll={handleScroll}
                        scrollEventThrottle={100}
                    >
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} msg={msg} onAction={handleAction} />
                        ))}
                        {isTyping && <TypingIndicator />}
                    </ScrollView>

                    {showScrollBtn && (
                        <TouchableOpacity
                            style={styles.scrollDownBtn}
                            onPress={scrollToBottom}
                            accessibilityLabel="Ir al final"
                        >
                            <Ionicons name="chevron-down-circle" size={32} color={PURPLE} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Barra de entrada */}
                <View style={styles.inputBar}>
                    <TouchableOpacity
                        style={styles.voiceBtn}
                        accessibilityLabel="Entrada de voz"
                        onPress={() =>
                            Alert.alert('Próximamente', 'La entrada de voz no está disponible todavía.')
                        }
                    >
                        <Ionicons name="mic-outline" size={22} color={PURPLE} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Escribe tu duda…"
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                        returnKeyType="send"
                        blurOnSubmit={false}
                        onSubmitEditing={handleSend}
                    />

                    <TouchableOpacity
                        style={[styles.sendBtn, !canSend && styles.sendBtnOff]}
                        onPress={handleSend}
                        disabled={!canSend}
                        accessibilityLabel="Enviar mensaje"
                    >
                        <Ionicons
                            name={canSend ? 'send' : 'send-outline'}
                            size={18}
                            color={canSend ? '#fff' : colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // Header chat
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    backBtn: { paddingRight: spacing.sm },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    aiAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: { flex: 1 },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.dark,
    },
    onlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    onlineDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.success,
    },
    onlineText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.success,
    },
    moreBtn: { paddingLeft: spacing.sm },

    // Lista de mensajes
    msgList: {
        padding: spacing.md,
        paddingBottom: spacing.lg,
        flexGrow: 1,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        alignItems: 'flex-end',
    },
    rowLeft: { justifyContent: 'flex-start' },
    rowRight: { justifyContent: 'flex-end' },

    avatarSmall: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        flexShrink: 0,
    },

    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 16,
    },
    bubbleLeft: {
        backgroundColor: colors.card,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    bubbleRight: {
        backgroundColor: PURPLE_BUBBLE,
        borderBottomRightRadius: 4,
    },

    msgText: { fontSize: 14.5, lineHeight: 21 },
    msgTextLeft: { color: colors.text },
    msgTextRight: { color: '#fff' },

    timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    tsLeft: { color: colors.textSecondary },
    tsRight: { color: 'rgba(255,255,255,0.7)' },

    // Chips de acción
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: spacing.sm,
    },
    actionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: PURPLE_BG,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 10,
    },
    actionText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: PURPLE,
    },

    // Botón de ir al final
    scrollDownBtn: {
        position: 'absolute',
        bottom: spacing.md,
        right: spacing.md,
        backgroundColor: colors.card,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },

    // Typing indicator
    typingBubble: { paddingVertical: 9 },
    typingText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },

    // Input bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.separator,
    },
    voiceBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: PURPLE_BG,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 18,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        fontSize: 14.5,
        maxHeight: 100,
        color: colors.text,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    sendBtnOff: {
        backgroundColor: colors.separator,
    },
});
