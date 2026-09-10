import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { tutorApi } from '../../api';

const TONE_KEY = 'opox.ai.tone';
const DEFAULT_TONE = { personality: 'cercano', detailLevel: 1, hintStyle: 'directas', reinforcementLevel: 'normal' };

// Iconos exactos exportados de Figma para la barra de entrada.
function IconMic({ size = 24, color = colors.accentOrange }) {
    return (
        <Svg width={(size * 48) / 75} height={size} viewBox="0 0 48 75" fill="none">
            <Path d="M11.5481 46.887C12.9541 48.8572 14.8092 50.4634 16.9596 51.5725C19.1099 52.6815 21.4935 53.2614 23.9126 53.2641C25.5519 53.2737 27.1826 53.0275 28.7462 52.5345C31.7672 51.6057 34.4087 49.7271 36.2787 47.1773C38.1488 44.6275 39.1479 41.5423 39.1277 38.3794C39.1277 35.687 39.1277 33.0019 39.1277 30.3095V14.8338C39.1654 12.9224 38.8117 11.0235 38.0882 9.25414C37.3647 7.48477 36.2869 5.88243 34.9211 4.54585C33.1852 2.73851 31.0218 1.39854 28.6312 0.649897C26.2406 -0.0987424 23.7 -0.231865 21.2443 0.262844C17.8062 0.808861 14.6734 2.5585 12.4037 5.20015C10.1341 7.84181 8.87497 11.204 8.85065 14.6879C8.85065 22.6361 8.85065 30.5795 8.85065 38.518C8.81851 41.5267 9.76531 44.4642 11.5481 46.887ZM34.9284 26.6248V30.2731C34.9284 32.9509 34.9284 35.6286 34.9284 38.2991C34.9322 40.999 33.915 43.6003 32.0812 45.5805C30.2474 47.5606 27.7328 48.7729 25.0426 48.9738C23.207 49.1776 21.3498 48.9093 19.6467 48.1943C17.9436 47.4793 16.451 46.3412 15.3099 44.8878C13.8716 43.1758 13.084 41.0102 13.0864 38.7734V38.1167C13.0864 30.3752 13.0353 22.371 13.0864 14.4982C13.149 12.1242 14.0134 9.8414 15.5386 8.02211C17.0638 6.20282 19.1598 4.95432 21.4849 4.48018C23.7773 3.93979 26.1821 4.14343 28.3512 5.06164C30.5203 5.97985 32.3413 7.56499 33.5505 9.58768C34.4648 11.1709 34.9428 12.9687 34.9357 14.7973C34.9357 17.6138 34.9357 20.4326 34.9357 23.2539L34.9284 26.6248Z" fill={color} />
            <Path d="M47.5844 37.3792C47.4307 37.2428 47.25 37.1404 47.054 37.0788C46.858 37.0172 46.6512 36.9977 46.4471 37.0217C46.0684 37.0435 45.6886 37.0435 45.3098 37.0217C45.1049 37.0026 44.8982 37.0273 44.7035 37.0939C44.5087 37.1606 44.3302 37.2677 44.1798 37.4084C44.0405 37.5535 43.9345 37.7272 43.869 37.9174C43.8035 38.1077 43.7802 38.31 43.8007 38.5101C43.8007 38.6998 43.8007 38.9187 43.8007 39.1522V39.3565C43.5996 42.6366 42.5862 45.8152 40.8519 48.6057C39.1177 51.3962 36.717 53.7111 33.8662 55.3418C31.0154 56.9725 27.804 57.8678 24.5213 57.947C21.2387 58.0261 17.988 57.2867 15.062 55.7954C8.55164 52.3588 4.90644 46.8208 4.23572 39.3346C4.23572 39.0428 4.19198 38.7509 4.1774 38.4591L4.08992 37.0581H1.07898L0.393682 37.1092L0 37.941V38.1307C0 38.2402 0 38.3569 0 38.4664C0.0416309 42.8677 1.32549 47.1677 3.70352 50.8703C5.64664 54.0238 8.30336 56.6759 11.4592 58.6126C14.6151 60.5492 18.1817 61.7162 21.8712 62.0192C21.8712 64.9378 21.8712 67.8564 21.8712 70.7749C19.3487 70.7749 16.819 70.7749 14.2965 70.7749H13.5529C13.3083 70.7736 13.0642 70.7956 12.8238 70.8406C12.3724 70.944 11.9682 71.1949 11.675 71.5537C11.3819 71.9125 11.2164 72.3587 11.2047 72.8221C11.193 73.2854 11.3357 73.7394 11.6104 74.1126C11.8851 74.4857 12.2761 74.7567 12.7218 74.8828C13.0077 74.9542 13.302 74.9862 13.5966 74.9777H34.4544C34.7574 74.9827 35.0595 74.9433 35.3512 74.8609C35.7841 74.727 36.1612 74.4546 36.4245 74.0856C36.6879 73.7166 36.8231 73.2712 36.8092 72.8179C36.8047 72.3634 36.6477 71.9235 36.3635 71.5689C36.0792 71.2143 35.6842 70.9655 35.2418 70.8625C34.9647 70.798 34.6806 70.7686 34.3961 70.7749H26.0996V62.0192H26.1434C26.8068 61.9536 27.4921 61.8879 28.1847 61.7493C37.181 59.947 43.3779 54.6425 46.6586 46.0036C47.5246 43.6142 47.9806 41.0955 48.0073 38.5539C48.0255 38.3392 47.9972 38.123 47.9242 37.9203C47.8512 37.7175 47.7353 37.5329 47.5844 37.3792Z" fill={color} />
        </Svg>
    );
}

function IconSend({ size = 24, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={(size * 63) / 74} viewBox="0 0 74 63" fill="none">
            <Path d="M69.3166 1.77599H4.15896C3.6311 1.76631 3.11499 1.93221 2.69173 2.2476C2.26848 2.563 1.96207 3.01001 1.82066 3.5184C1.67926 4.02678 1.71087 4.56772 1.91053 5.05619C2.11019 5.54466 2.46659 5.95299 2.9237 6.21699L33.5119 25.5531L44.887 59.5889C45.0415 60.0656 45.3432 60.4812 45.7487 60.7759C46.1543 61.0707 46.6428 61.2294 47.1442 61.2294C47.6456 61.2294 48.1341 61.0707 48.5397 60.7759C48.9452 60.4812 49.2469 60.0656 49.4014 59.5889L71.9827 5.84394C72.1861 5.40234 72.2739 4.91631 72.2378 4.4315C72.2017 3.94668 72.0429 3.47898 71.7764 3.0723C71.5099 2.66563 71.1443 2.33331 70.7141 2.10656C70.2838 1.87981 69.803 1.76606 69.3166 1.77599Z" stroke={color} strokeWidth={4} strokeMiterlimit={10} />
            <Path d="M33.512 25.5539L71.7872 3.13574" stroke={color} strokeWidth={4} strokeMiterlimit={10} />
        </Svg>
    );
}

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

    const [messages, setMessages] = useState(() => buildInitialMessages(technique, DEFAULT_TONE.personality));
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const scrollRef = useRef(null);
    const conversationIdRef = useRef(null);
    const tonePrefsRef = useRef(DEFAULT_TONE);

    // Crea la conversación y carga el tono de IA al montar la pantalla
    useEffect(() => {
        AsyncStorage.getItem(TONE_KEY)
            .then((raw) => { if (raw) tonePrefsRef.current = { ...DEFAULT_TONE, ...JSON.parse(raw) }; })
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
            const res = await tutorApi.sendMessage(cid, userText, tonePrefsRef.current);
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
            // Ir al picker de temas — antes iba directo a Loading con topicId por
            // defecto ('constitucion'), que en el curso nuevo no existe y el Motor
            // devolvía tema_no_encontrado. Ahora el usuario elige el tema.
            navigation.navigate('TutorFlashcards');
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
                    <Feather name="chevron-left" size={22} color={colors.textDark} />
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
                                    setMessages(buildInitialMessages(technique, tonePrefsRef.current.personality));
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
                        <IconMic size={22} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isTyping}
                        accessibilityLabel="Enviar mensaje"
                        activeOpacity={0.8}
                    >
                        <IconSend size={22} />
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
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
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
    sendBtn: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    sendBtnDisabled: { opacity: 0.4 },
});
