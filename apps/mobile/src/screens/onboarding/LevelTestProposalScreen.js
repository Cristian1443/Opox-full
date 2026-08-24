import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

export default function LevelTestProposalScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Status bar */}
            <View style={styles.statusBar}>
                <Text style={styles.statusBarTime}>9:41</Text>
            </View>

            {/* Contenido central */}
            <View style={styles.body}>

                {/* Bloque central: icono + título + subtítulo */}
                <View style={styles.centerBlock}>

                    {/* Ilustración real exportada de Figma (nodo 2346:1868) */}
                    <Image
                        source={require('../../../assets/onboarding/level-test-proposal.png')}
                        style={styles.illustration}
                        resizeMode="contain"
                    />

                    {/* Título */}
                    <Text style={styles.title}>Mídete en 5 minutos</Text>

                    {/* Subtítulo */}
                    <Text style={styles.subtitle}>
                        Un test corto para que la IA sepa tu punto de partida y ajuste la dificultad y tu plan desde el primer día.
                    </Text>
                </View>

                {/* Botones */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={() => navigation.navigate('LevelTestInProgress')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnPrimaryText}>Hacer test de nivel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryLink}
                        onPress={() => navigation.replace('Permissions')}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.secondaryLinkText}>Ahora no, en otro momento</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // Status bar
    statusBar: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        flexShrink: 0,
    },
    statusBarTime: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1B2A4A',
        marginRight: 'auto', // en RN usar flex: 1 en un spacer si hace falta
    },

    // Cuerpo principal (padding: 16px 18px)
    body: {
        flex: 1,
        paddingHorizontal: 18,
        paddingVertical: spacing.md,
        flexDirection: 'column',
    },

    // Bloque centrado vertical y horizontalmente
    centerBlock: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
    },

    // Ilustración (proporción real del nodo Figma: 606x549)
    illustration: {
        width: 190,
        height: 172,
        marginBottom: spacing.lg,
    },

    // Título
    title: {
        fontSize: 21,
        fontWeight: '800',
        color: colors.textDark,
        letterSpacing: -0.4,
        textAlign: 'center',
    },

    // Subtítulo
    subtitle: {
        fontSize: 12.5,
        color: colors.textMuted,
        marginTop: 6,
        textAlign: 'center',
        maxWidth: 235,
        lineHeight: 18,
    },

    // Contenedor de botones
    buttonsContainer: {
        flexDirection: 'column',
        gap: 9,               // RN 0.71+ soporta gap; si no, usar marginBottom en el primero
        // marginBottom: 0,  // ya está al fondo del flex
    },

    // Botón primario (verde CTA)
    btnPrimary: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 13,
        width: '100%',
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: 13.5,
        fontWeight: '700',
    },

    // Link secundario (texto plano, sin fondo ni borde — coincide con Figma)
    secondaryLink: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        width: '100%',
    },
    secondaryLinkText: {
        color: colors.textDark,
        fontSize: 13.5,
        fontWeight: '400',
    },
});
