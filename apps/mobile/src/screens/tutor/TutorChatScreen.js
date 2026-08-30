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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { tutorApi, settingsApi } from '../../api';

// Colores confirmados contra Figma (frame CHAT TUTOR IA, Bloque 8) sin
// equivalente exacto en theme.js.
const FIGMA = {
    // Verde de sistema iOS "Accents/Green" — distinto de colors.ctaGreen,
    // documentado tal cual está en Figma.
    onlineGreen: '#34C759',
    aiBubbleBg: 'rgba(159,110,228,0.1)',
    // Verde ligeramente distinto de colors.ctaGreen (#24bd90 vs #24BD86) —
    // segundo caso de "verde casi igual pero no idéntico" detectado en el
    // archivo. Documentado tal cual, no se unifica.
    userBubbleBg: 'rgba(36,189,134,0.32)',
    inputBorder: 'rgba(65,41,80,0.5)',
    timestampMuted: 'rgba(65,41,80,0.4)',
};

// ─── Utilidades ───────────────────────────────────────────────────────────────
const nowTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Saludo inicial adaptado por tono de IA
function buildGreeting(technique, personality) {
    if (technique) {
        return `Hola, veo que vienes del módulo "${technique}". ¿Qué dudas tienes sobre este tema?`;
    }
    if (personality === 'cercano') {
        return '¡Hola! Soy tu Tutor IA, ¡aquí estoy para lo que necesites! ¿Sobre qué tema del temario te puedo echar una mano hoy?';
    }
    if (personality === 'exigente') {
        return 'Tutor IA disponible. Indica el tema del temario que necesitas trabajar.';
    }
    return '¡Hola! Soy tu Tutor IA. ¿Sobre qué tema del temario quieres que te eche una mano hoy?';
}

const buildInitialMessages = (technique, personality = 'equilibrado') => [
    {
        id: '0',
        isAI: true,
        text: buildGreeting(technique, personality),
        timestamp: nowTime(),
        actions: null,
    },
];

// ─── Chip de acción rápida ────────────────────────────────────────────────────
// Nota: Figma muestra 3 chips fijos y siempre visibles ("crear flashcards",
// "poner un ejemplo", "hacer un test") como capas sueltas del bloque, no del
// frame del chat. El código real es más rico: cada mensaje de la IA trae sus
// propias acciones sugeridas desde el backend — se conserva ese
// comportamiento real y solo se restylea el chip al lenguaje visual
// confirmado (outline, sin relleno).
function ActionChip({ icon, label, onPress }) {
    return (
        <TouchableOpacity
            style={styles.actionChip}
            onPress={onPress}
            activeOpacity={0.75}
            accessibilityLabel={label}
            accessibilityRole="button"
        >
            {icon ? <Ionicons name={icon} size={13} color={colors.textDark} /> : null}
            <Text style={styles.actionText}>{label}</Text>
        </TouchableOpacity>
    );
}

function Avatar({ size = 39 }) {
    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>IA</Text>
        </View>
    );
}

// ─── Burbuja de mensaje ───────────────────────────────────────────────────────
function MessageBubble({ msg, onAction }) {
    return (
        <View style={[styles.messageRow, msg.isAI ? styles.rowLeft : styles.rowRight]}>
            {msg.isAI && <Avatar size={26} />}

            <View style={[styles.bubble, msg.isAI ? styles.bubbleLeft : styles.bubbleRight]}>
                <Text style={styles.msgText}>{msg.text}</Text>
                <Text style={styles.timestamp}>{msg.timestamp}</Text>

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
            <Avatar size={26} />
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
    const personalityRef = useRef('equilibrado');

    // Crea la conversación y carga el tono de IA al montar la pantalla
    useEffect(() => {
        settingsApi.getPreferences()
            .then((res) => {
                if (!res?.error && res?.data?.personality) {
                    personalityRef.current = res.data.personality;
                }
            })
            .catch(() => {});

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
            const res = await tutorApi.sendMessage(cid, userText, personalityRef.current);
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

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Avatar />
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Tutor IA</Text>
                        <Text style={styles.onlineText}>Siempre en línea</Text>
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
                                    setMessages(buildInitialMessages(technique, personalityRef.current));
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
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.textDark} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
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
                            <Ionicons name="chevron-down-circle" size={32} color={colors.accentOrange} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Escribe tu duda…"
                        placeholderTextColor={colors.textDark}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                        returnKeyType="send"
                        blurOnSubmit={false}
                        onSubmitEditing={handleSend}
                    />

                    <TouchableOpacity
                        style={styles.voiceBtn}
                        accessibilityLabel="Entrada de voz"
                        onPress={() =>
                            Alert.alert('Próximamente', 'La entrada de voz no está disponible todavía.')
                        }
                    >
                        <Ionicons name="mic-outline" size={22} color={colors.accentOrange} />
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
        backgroundColor: colors.white,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        gap: 12,
    },
    backBtn: { width: 32 },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerText: { flex: 1 },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
    },
    onlineText: {
        marginTop: 2,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 8.9,
        color: FIGMA.onlineGreen,
    },
    moreBtn: { width: 32, alignItems: 'flex-end' },

    avatar: {
        backgroundColor: colors.selectionBorder,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
    },

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
        gap: 10,
    },
    rowLeft: { justifyContent: 'flex-start' },
    rowRight: { justifyContent: 'flex-end' },

    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 13.3,
    },
    bubbleLeft: {
        backgroundColor: FIGMA.aiBubbleBg,
    },
    bubbleRight: {
        backgroundColor: FIGMA.userBubbleBg,
    },

    msgText: { fontFamily: 'Poppins-Regular', fontSize: 16, lineHeight: 20, color: colors.textDark },
    timestamp: { fontFamily: 'Poppins-Regular', fontSize: 9, marginTop: 4, alignSelf: 'flex-end', color: FIGMA.timestampMuted },

    // Chips de acción — outline, sin relleno (ver nota junto a ActionChip)
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: spacing.sm,
    },
    actionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 0.44,
        borderColor: colors.textDark,
        borderRadius: 9.8,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    actionText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12.5,
        color: colors.textDark,
    },

    scrollDownBtn: {
        position: 'absolute',
        bottom: spacing.md,
        right: spacing.md,
        backgroundColor: colors.white,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },

    typingBubble: { paddingVertical: 10 },
    typingText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: FIGMA.timestampMuted,
        fontStyle: 'italic',
    },

    // Barra de entrada
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        minHeight: 66,
        borderRadius: 13.3,
        borderWidth: 1.3,
        borderColor: FIGMA.inputBorder,
    },
    input: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        maxHeight: 100,
        color: colors.textDark,
    },
    voiceBtn: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
});
