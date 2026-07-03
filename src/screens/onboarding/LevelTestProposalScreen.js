import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

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

                    {/* Icono con fondo circular */}
                    <View style={styles.iconCircle}>
                        <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
                            <Path
                                d="M3 17l5-5 4 3 8-8"
                                stroke="#FF6B4A"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <Circle cx={20} cy={7} r={2} fill="#FF6B4A" />
                        </Svg>
                    </View>

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
                        style={styles.btnGhost}
                        onPress={() => navigation.navigate('Permissions')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnGhostText}>Ahora no, lo haré luego</Text>
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
        paddingHorizontal: 16,
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
        paddingVertical: 16,
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

    // Círculo con icono
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFF6F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },

    // Título
    title: {
        fontSize: 21,
        fontWeight: '800',
        color: '#0F1B33',
        letterSpacing: -0.4,
        textAlign: 'center',
    },

    // Subtítulo
    subtitle: {
        fontSize: 12.5,
        color: '#5A6373',
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

    // Botón primario (naranja)
    btnPrimary: {
        backgroundColor: '#FF6B4A',
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 13,
        width: '100%',
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
    },

    // Botón ghost (blanco con borde)
    btnGhost: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 13,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#D4DAE6',
    },
    btnGhostText: {
        color: '#1B2A4A',
        fontSize: 13.5,
        fontWeight: '700',
    },
});
