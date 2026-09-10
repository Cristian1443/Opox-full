import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Modal,
} from 'react-native';
import Text from './AppText';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../theme';

// Colores confirmados contra Figma (frame FLASHCARDS CREADAS, Bloque 8)
// sin equivalente exacto en theme.js. Mismo patrón de overlay + tarjeta
// blanca que los pop-ups del Bloque 4.
const FIGMA = {
    overlay: '#000000',
    cardBorder: 'rgba(65,41,80,0.3)',
};

// Icono exacto exportado de Figma para "N flashcards listas".
function ThumbsUpIcon({ width = 60, height = 59, color = colors.accentOrange }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 131 129" fill="none">
            <Path d="M123.873 64.5229C123.873 62.7568 123.767 60.6764 123.564 58.6634C123.263 55.67 122.766 52.8787 121.969 52.3324C119.011 50.3118 100.805 50.4166 90.6976 50.469C88.3042 50.469 86.3475 50.469 85.1056 50.469L79.4083 50.3567L82.9456 45.934L85.6626 42.529L88.3645 39.139L88.4096 39.0791C94.2273 31.7304 103.153 20.4603 99.473 11.3903C98.8802 9.90905 97.9165 8.60302 96.6733 7.5962C95.494 6.63649 94.0777 6.00855 92.5716 5.77772C89.7794 5.35116 87.7097 5.77772 86.084 6.75805C84.4584 7.73839 82.9381 9.69905 81.621 12.0713C73.0036 27.6893 60.5779 44.4972 49.236 59.7784C46.9782 62.8317 44.7204 65.8251 42.3271 69.1327V69.1777V69.23V123.395H111.688C113.515 123.421 115.322 123.01 116.956 122.198C118.41 121.447 119.628 120.313 120.479 118.92C120.998 118.075 120.923 113.6 120.87 110.277C120.87 109.97 120.87 109.671 120.87 109.379H112.779C112.397 109.398 112.014 109.341 111.655 109.209C111.296 109.077 110.968 108.873 110.69 108.611C110.412 108.349 110.191 108.033 110.04 107.684C109.889 107.334 109.811 106.957 109.811 106.576C109.811 106.196 109.889 105.819 110.04 105.469C110.191 105.119 110.412 104.804 110.69 104.541C110.968 104.279 111.296 104.076 111.655 103.944C112.014 103.812 112.397 103.754 112.779 103.774H124.934C124.972 103.774 125.024 103.729 125.084 103.654C125.27 103.417 125.363 103.123 125.348 102.823V90.7001C125.36 90.4011 125.267 90.1072 125.084 89.8694C125.024 89.8021 124.972 89.7572 124.934 89.7572H112.892C112.144 89.7572 111.426 89.4615 110.896 88.9352C110.367 88.409 110.07 87.6952 110.07 86.9509C110.07 86.2066 110.367 85.4928 110.896 84.9665C111.426 84.4402 112.144 84.1446 112.892 84.1446H124.934C124.972 84.1446 125.024 84.0997 125.084 84.0323C125.267 83.7946 125.36 83.5007 125.348 83.2017V71.0934C125.363 70.7941 125.27 70.4993 125.084 70.2627C125.024 70.1879 124.972 70.143 124.934 70.143H112.012C111.629 70.1627 111.247 70.1048 110.888 69.9728C110.528 69.8408 110.2 69.6376 109.922 69.3754C109.645 69.1132 109.424 68.7976 109.273 68.4478C109.122 68.0979 109.044 67.7212 109.044 67.3405C109.044 66.9597 109.122 66.583 109.273 66.2331C109.424 65.8833 109.645 65.5677 109.922 65.3055C110.2 65.0434 110.528 64.8401 110.888 64.7081C111.247 64.5762 111.629 64.5182 112.012 64.5379L123.873 64.5229ZM126.439 109.169C126.439 109.491 126.439 109.835 126.439 110.187C126.507 114.206 126.597 119.616 125.235 121.831C123.851 124.09 121.87 125.928 119.508 127.145C117.076 128.387 114.377 129.024 111.643 129H42.0486C40.6231 128.995 39.2574 128.431 38.2473 127.43C37.2373 126.43 36.6642 125.075 36.6523 123.657V69.0953C36.656 68.7808 36.6913 68.4674 36.7577 68.1599C36.8091 67.9063 36.877 67.6564 36.9609 67.4116V67.3143C37.0209 67.1201 37.0938 66.9301 37.1792 66.7455C37.2267 66.6321 37.282 66.5221 37.3447 66.4163L37.5178 66.1468C39.6026 63.3031 42.1163 59.9131 44.6827 56.4183C55.8967 41.3092 68.2095 24.7184 76.6161 9.33985C78.3697 6.18931 80.3792 3.65241 83.0209 1.99108C85.798 0.254919 89.1095 -0.448527 93.3468 0.195051C95.8537 0.57212 98.2148 1.60521 100.188 3.18844C102.17 4.79884 103.706 6.88509 104.651 9.25005C109.551 21.3284 99.3827 34.1401 92.7974 42.4841L92.7522 42.544L90.9384 44.789C101.731 44.7292 120.764 44.6468 125.115 47.6103C127.591 49.3016 128.682 53.5971 129.134 58.0198C129.45 61.2003 129.48 64.508 129.472 66.6782C130.45 67.9014 130.981 69.4186 130.977 70.9812V83.1044C130.977 84.4302 130.596 85.7282 129.879 86.8461C130.596 87.964 130.977 89.2621 130.977 90.5879V102.711C130.99 104.354 130.41 105.946 129.344 107.201C128.594 108.13 127.583 108.815 126.439 109.169Z" fill={color} />
            <Path d="M28.0876 70.1276H5.6371V123.395H28.0876V70.1276ZM4.83933 64.5225H28.923C29.6328 64.5294 30.3315 64.6991 30.9646 65.0184C31.5977 65.3377 32.1482 65.798 32.5732 66.3634C33.3499 67.3813 33.7678 68.6253 33.7623 69.9031V123.619C33.7651 124.232 33.6686 124.841 33.4763 125.423C33.3228 125.891 33.1077 126.336 32.8366 126.747C32.7578 126.889 32.6672 127.025 32.5656 127.152L32.4979 127.226C32.4067 127.342 32.306 127.449 32.1968 127.548C31.8427 127.925 31.4282 128.241 30.9701 128.484C30.3425 128.825 29.6382 129.002 28.923 129H4.83933C4.13182 128.992 3.43572 128.822 2.80523 128.502C2.17473 128.183 1.62684 127.723 1.2042 127.159C0.421067 126.144 -0.00231148 124.899 2.21747e-05 123.619V69.8881C-0.00353158 68.6128 0.420155 67.3727 1.2042 66.3634C1.62684 65.7991 2.17473 65.3395 2.80523 65.0202C3.43572 64.7009 4.13182 64.5306 4.83933 64.5225Z" fill={color} />
        </Svg>
    );
}

// ─── Pop-up · Flashcards creadas (8.2 · ok) ──────────────────────────────────
// Modal de éxito que aparece al terminar la generación de un mazo.
// - onReviewNow: navega al visor de flashcards.
// - onClose: cierra sin repasar (el mazo queda guardado).
export default function FlashcardsSuccessModal({
    visible,
    onClose,
    onReviewNow,
    mazoName = 'Constitución',
    count = 12,
}) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

                <View style={styles.card}>
                    <View style={styles.iconWrap}>
                        <ThumbsUpIcon />
                    </View>

                    <Text style={styles.title}>{count} flashcards listas</Text>
                    <Text style={styles.subtitle}>Las hemos guardado en tu mazo de {mazoName}.</Text>

                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={onReviewNow}
                        activeOpacity={0.85}
                        accessibilityLabel="Repasar las flashcards ahora"
                    >
                        <Text style={styles.primaryBtnText}>Repasar ahora</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.6}
                        accessibilityLabel="Repasar más tarde"
                    >
                        <Text style={styles.secondaryLink}>Luego</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: FIGMA.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 27,
    },
    card: {
        width: 348,
        backgroundColor: colors.white,
        borderRadius: 24,
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 28,
    },
    iconWrap: {
        marginBottom: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 16.6,
        marginBottom: spacing.lg,
    },
    primaryBtn: {
        width: 322,
        height: 61,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    secondaryLink: {
        marginTop: 16,
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
    },
});
