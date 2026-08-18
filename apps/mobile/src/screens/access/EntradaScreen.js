import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';
// Lockups vectorizados reales exportados desde Figma (mismo origen que
// SplashScreen.js: file BuqTDwvaSFpG2sI1PYdD36, frame "CARGA INICIAL"),
// reusados aquí para no duplicar assets — la pantalla ENTRADA comparte
// exactamente el mismo fondo/wordmark/badge que la carga inicial.
import OpoxLogo from '../../../assets/opoxLogo';
import MasCopLogo from '../../../assets/masCopLogo';
import camoImg from '../../imports/CargaInicial/3e43d7dd7590060c7fd1b2f8e506e66fc41fe1d7.jpg';

const { width } = Dimensions.get('window');

// El frame "ENTRADA" en Figma mide 907x1920. `scale` convierte cualquier
// medida tomada del diseño a dp reales, preservando las proporciones exactas
// en cualquier ancho de pantalla.
const FIGMA_FRAME_WIDTH = 907;
const scale = (px) => (px / FIGMA_FRAME_WIDTH) * width;

export default function EntradaScreen({ navigation }) {
    const handleCrearCuenta = () => navigation.navigate('Registro');
    const handleLogin = () => navigation.navigate('Login');

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Fondo texturizado real del Figma (mismo asset que CARGA INICIAL) */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Image source={camoImg} style={s.camo} resizeMode="cover" />
            </View>

            <View style={s.content}>
                <OpoxLogo width={width * 0.7} />
                <Text style={s.tagline}>
                    Empieza a preparar tu plaza{'\n'}con un tutor de
                </Text>
            </View>

            <View style={s.footer}>
                <TouchableOpacity
                    style={s.primaryButton}
                    onPress={handleCrearCuenta}
                    activeOpacity={0.85}
                >
                    <Text style={s.primaryButtonText}>Crear cuenta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.secondaryButton}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                >
                    <Text style={s.secondaryButtonText}>Ya tengo cuenta</Text>
                </TouchableOpacity>

                <View style={s.badgeRow}>
                    <Text style={s.badgeLabel}>La APP de</Text>
                    <MasCopLogo width={width * 0.23} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    camo: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        zIndex: 1,
    },
    tagline: {
        color: colors.textDark,
        fontFamily: 'Poppins-Medium',
        fontSize: scale(36),
        lineHeight: scale(36) * 1.28,
        textAlign: 'center',
        marginTop: scale(21),
    },
    footer: {
        width: '100%',
        paddingHorizontal: scale(90),
        paddingBottom: scale(68),
        zIndex: 1,
    },
    primaryButton: {
        backgroundColor: colors.purple,
        paddingVertical: scale(138) / 2 - (scale(36) * 1.1) / 2,
        borderRadius: scale(32),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: scale(138),
    },
    primaryButtonText: {
        color: colors.white,
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(36),
    },
    secondaryButton: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.purple,
        paddingVertical: scale(138) / 2 - (scale(36) * 1.1) / 2,
        borderRadius: scale(32),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: scale(138),
        marginTop: scale(21),
    },
    secondaryButtonText: {
        color: colors.purple,
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(36),
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: scale(278),
    },
    badgeLabel: {
        color: colors.textDark,
        fontFamily: 'Poppins-Bold',
        fontSize: scale(25.96),
    },
});
