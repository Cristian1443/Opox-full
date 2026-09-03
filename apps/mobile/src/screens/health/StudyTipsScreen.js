// Bloque 3 · Salud — Pantalla 3.7 · Consejos de Estudio
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Colores confirmados contra Figma (frame CONSEJOS DE ESTUDIO, Bloque 3)
// sin equivalente exacto en theme.js.
const FIGMA = {
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
    bannerBorder: 'rgba(255,255,255,0.25)',
    offWhite: '#F5F5F5',
};

// Iconos exactos de Figma (frame CONSEJOS DE ESTUDIO, Bloque 3).
function ClockIcon({ size = 32, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 93 93" fill="none">
            <Path d="M46.2661 3.5C53.2955 3.51108 60.2137 5.25363 66.4087 8.57345C72.6036 11.8933 77.8842 16.688 81.7832 22.5333C85.6821 28.3786 88.0792 35.0943 88.7623 42.0861C89.4454 49.0778 88.3934 56.1301 85.6994 62.6187C83.0055 69.1073 78.7526 74.8323 73.3172 79.2869C67.8819 83.7416 61.4315 86.7886 54.537 88.1583C47.6426 89.528 40.5165 89.1782 33.7896 87.1398C27.0626 85.1014 20.9421 81.4373 15.9697 76.4718" stroke={color} strokeWidth={7} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M37.6001 4.36644L38.6467 4.16399L39.7046 3.99528L40.7738 3.84907C41.1339 3.79283 41.4828 3.75909 41.8992 3.72535L43.0246 3.62412L44.1501 3.55664H45.2755H46.4009" stroke={color} strokeWidth={7} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M23.1611 10.2484L24.039 9.69727" stroke={color} strokeWidth={7} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M12.5708 19.8532L13.2123 19.0547" stroke={color} strokeWidth={7} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M5.36816 33.5401C5.46945 33.2026 5.58199 32.8652 5.69454 32.5391" stroke={color} strokeWidth={7} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M3.56753 49.5343L3.5 48.4883" stroke={color} strokeWidth={7} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M7.66401 64.7846C7.51771 64.4697 7.36015 64.1548 7.2251 63.8398" stroke={color} strokeWidth={7} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M52.7033 13.1152V46.3844L26.0195 66.8768" stroke={color} strokeWidth={7} strokeMiterlimit={10} strokeLinecap="round" />
        </Svg>
    );
}

function RepeatLinesIcon({ size = 32, color = colors.accentOrange }) {
    return (
        <Svg width={(size * 83) / 103} height={size} viewBox="0 0 83 103" fill="none">
            <Path d="M3.41504 3.41406H79.415" stroke={color} strokeWidth={6.83} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3.41504 51.4141H79.415" stroke={color} strokeWidth={6.83} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3.41504 99.4141H79.415" stroke={color} strokeWidth={6.83} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function PersonIcon({ size = 32, color = colors.accentOrange }) {
    return (
        <Svg width={(size * 88) / 82} height={size} viewBox="0 0 88 82" fill="none">
            <Path d="M67.7981 26.6501C70.1202 16.7342 63.9642 6.8134 54.0484 4.49131C44.1325 2.16922 34.2117 8.32518 31.8896 18.241C29.5675 28.1569 35.7235 38.0777 45.6393 40.3998C55.5552 42.7219 65.476 36.566 67.7981 26.6501Z" stroke={color} strokeWidth={8} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M15.77 77.8963C18.1965 70.7874 22.7859 64.6155 28.8954 60.2453C35.0049 55.8751 42.3284 53.5254 49.84 53.5254C57.3517 53.5254 64.6752 55.8751 70.7846 60.2453C76.8941 64.6155 81.4835 70.7874 83.91 77.8963" stroke={color} strokeWidth={8} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M21.76 42.2148L9.62 54.3548L4 48.7348" stroke={color} strokeWidth={8} strokeMiterlimit={10} strokeLinecap="round" />
        </Svg>
    );
}

function TrendUpIcon({ size = 32, color = colors.accentOrange }) {
    return (
        <Svg width={(size * 96) / 54} height={size} viewBox="0 0 96 54" fill="none">
            <Path d="M9.00022 53.9125C7.22188 53.9143 5.48297 53.3886 4.00337 52.4021C2.52377 51.4156 1.36995 50.0124 0.687802 48.3701C0.0056574 46.7278 -0.17417 44.9201 0.171062 43.1756C0.516293 41.4311 1.37108 39.8281 2.62732 38.5694C3.88356 37.3107 5.48485 36.4528 7.22867 36.1042C8.9725 35.7555 10.7805 35.9318 12.4242 36.6108C14.0678 37.2897 15.4732 38.4408 16.4626 39.9184C17.4521 41.3961 17.9811 43.134 17.9829 44.9123C17.9829 47.2963 17.037 49.5829 15.353 51.2702C13.6689 52.9576 11.3842 53.9079 9.00022 53.9125ZM9.00022 41.9328C8.40669 41.931 7.82602 42.1055 7.33179 42.4342C6.83757 42.7629 6.45206 43.2309 6.22412 43.7789C5.99619 44.3269 5.93609 44.9302 6.05146 45.5124C6.16682 46.0947 6.45245 46.6295 6.87214 47.0492C7.29183 47.4689 7.82667 47.7545 8.40888 47.8699C8.99108 47.9852 9.59444 47.9251 10.1424 47.6972C10.6905 47.4693 11.1585 47.0838 11.4871 46.5895C11.8158 46.0953 11.9903 45.5146 11.9886 44.9211C11.9863 44.1293 11.6707 43.3705 11.1107 42.8106C10.5508 42.2507 9.79206 41.9351 9.00022 41.9328Z" fill={color} />
            <Path d="M32.9601 29.9711C31.1847 29.9711 29.449 29.445 27.9724 28.4591C26.4958 27.4732 25.3445 26.0719 24.6638 24.4321C23.9832 22.7922 23.8038 20.9875 24.1482 19.2458C24.4927 17.504 25.3456 15.9034 26.5992 14.6461C27.8528 13.3888 29.4509 12.5313 31.1916 12.1817C32.9323 11.8321 34.7376 12.0063 36.3794 12.6821C38.0212 13.3579 39.4259 14.5051 40.4161 15.9789C41.4063 17.4526 41.9376 19.1867 41.9428 20.9621C41.9451 22.1436 41.7145 23.314 41.2642 24.4064C40.814 25.4987 40.1528 26.4916 39.3186 27.3283C38.4844 28.165 37.4934 28.829 36.4024 29.2825C35.3114 29.736 34.1417 29.97 32.9601 29.9711ZM32.9601 17.9914C32.3674 17.9914 31.7879 18.1671 31.295 18.4965C30.8021 18.8258 30.418 19.2939 30.1911 19.8415C29.9643 20.3892 29.9049 20.9918 30.0206 21.5732C30.1362 22.1546 30.4217 22.6886 30.8408 23.1078C31.26 23.527 31.794 23.8124 32.3754 23.9281C32.9568 24.0437 33.5594 23.9843 34.1071 23.7575C34.6548 23.5307 35.1228 23.1465 35.4522 22.6536C35.7815 22.1607 35.9573 21.5813 35.9573 20.9885C35.9608 20.5927 35.8858 20.2001 35.7368 19.8334C35.5877 19.4668 35.3675 19.1332 35.0888 18.8521C34.8102 18.571 34.4786 18.3479 34.1132 18.1956C33.7479 18.0434 33.356 17.965 32.9601 17.965V17.9914Z" fill={color} />
            <Path d="M62.9138 47.9184C61.1347 47.9201 59.3951 47.3941 57.9151 46.4067C56.4351 45.4194 55.2813 44.0152 54.5997 42.3719C53.9181 40.7286 53.7393 38.92 54.0859 37.175C54.4326 35.43 55.2891 33.8271 56.5471 32.5691C57.8051 31.3111 59.408 30.4545 61.153 30.1079C62.898 29.7612 64.7066 29.94 66.3499 30.6217C67.9933 31.3033 69.3974 32.4571 70.3848 33.9371C71.3721 35.4171 71.8982 37.1567 71.8964 38.9358C71.8941 41.3174 70.947 43.6008 69.2629 45.2849C67.5788 46.9689 65.2954 47.9161 62.9138 47.9184ZM62.9138 35.9386C62.321 35.9386 61.7415 36.1144 61.2487 36.4437C60.7558 36.7731 60.3716 37.2412 60.1448 37.7888C59.9179 38.3365 59.8586 38.9391 59.9742 39.5205C60.0899 40.1019 60.3753 40.6359 60.7945 41.0551C61.2136 41.4742 61.7477 41.7597 62.3291 41.8753C62.9105 41.991 63.5131 41.9316 64.0607 41.7048C64.6084 41.4779 65.0765 41.0938 65.4058 40.6009C65.7352 40.108 65.9109 39.5285 65.9109 38.9358C65.9109 38.1409 65.5952 37.3785 65.0331 36.8165C64.471 36.2544 63.7087 35.9386 62.9138 35.9386Z" fill={color} />
            <Path d="M86.8733 17.9653C85.097 17.9635 83.3612 17.4352 81.8852 16.4472C80.4091 15.4591 79.2592 14.0556 78.5807 12.4141C77.9021 10.7725 77.7255 8.96671 78.0731 7.22483C78.4207 5.48295 79.2769 3.88322 80.5335 2.62785C81.7901 1.37249 83.3906 0.517846 85.1329 0.171961C86.8751 -0.173924 88.6807 0.00447494 90.3216 0.684607C91.9624 1.36474 93.3648 2.51607 94.3515 3.99306C95.3381 5.47006 95.8647 7.20641 95.8647 8.98264C95.8624 11.3658 94.914 13.6505 93.2281 15.3349C91.5421 17.0192 89.2564 17.9653 86.8733 17.9653ZM86.8733 5.98549C86.2805 5.98549 85.701 6.16127 85.2081 6.4906C84.7153 6.81993 84.3311 7.28802 84.1043 7.83568C83.8774 8.38334 83.8181 8.98596 83.9337 9.56735C84.0494 10.1487 84.3348 10.6828 84.754 11.1019C85.1731 11.5211 85.7072 11.8065 86.2886 11.9222C86.8699 12.0378 87.4726 11.9785 88.0202 11.7516C88.5679 11.5248 89.036 11.1406 89.3653 10.6478C89.6946 10.1549 89.8704 9.57541 89.8704 8.98264C89.8704 8.18774 89.5546 7.42541 88.9926 6.86334C88.4305 6.30127 87.6682 5.98549 86.8733 5.98549Z" fill={color} />
            <Path d="M14.9857 41.9348C14.3932 41.9344 13.8142 41.7584 13.3217 41.429C12.8292 41.0996 12.4454 40.6317 12.2187 40.0843C11.9921 39.5369 11.9327 38.9347 12.0482 38.3536C12.1637 37.7724 12.4488 37.2386 12.8675 36.8195L24.8473 24.8397C25.1266 24.5615 25.458 24.3411 25.8225 24.191C26.187 24.0409 26.5775 23.964 26.9717 23.9649C27.3659 23.9657 27.7561 24.0441 28.12 24.1957C28.4839 24.3473 28.8143 24.5691 29.0925 24.8485C29.3707 25.1278 29.5911 25.4592 29.7412 25.8237C29.8913 26.1882 29.9681 26.5787 29.9673 26.9729C29.9665 27.3671 29.888 27.7573 29.7364 28.1212C29.5848 28.4851 29.363 28.8155 29.0837 29.0937L17.1039 41.0559C16.5417 41.6173 15.7802 41.9333 14.9857 41.9348Z" fill={color} />
            <Path d="M56.9187 35.9402C56.328 35.9385 55.7507 35.7644 55.2576 35.4392L37.2484 23.4594C36.5863 23.0188 36.1264 22.3333 35.9699 21.5537C35.8133 20.774 35.9728 19.9641 36.4134 19.3021C36.8539 18.64 37.5395 18.1802 38.3191 18.0236C39.0988 17.867 39.9087 18.0265 40.5707 18.4671L58.5799 30.4557C59.1182 30.81 59.5276 31.3288 59.7469 31.9347C59.9663 32.5407 59.9839 33.2014 59.797 33.8181C59.6102 34.4349 59.229 34.9748 58.7103 35.3572C58.1916 35.7396 57.5632 35.9441 56.9187 35.9402Z" fill={color} />
            <Path d="M68.8902 35.9404C68.2998 35.9373 67.7228 35.7633 67.2291 35.4394C66.9018 35.2207 66.6209 34.9397 66.4023 34.6124C66.1837 34.2851 66.0317 33.9179 65.955 33.5319C65.8782 33.1458 65.8783 32.7485 65.9552 32.3624C66.032 31.9764 66.1841 31.6093 66.4029 31.2821L78.3914 13.2729C78.8463 12.6466 79.5259 12.2206 80.2878 12.0841C81.0497 11.9476 81.8349 12.1111 82.4789 12.5405C83.1229 12.9699 83.5759 13.6317 83.7429 14.3875C83.91 15.1433 83.7781 15.9345 83.375 16.5952L71.3952 34.6044C71.1212 35.0174 70.7488 35.3557 70.3115 35.5889C69.8742 35.8221 69.3858 35.9429 68.8902 35.9404Z" fill={color} />
        </Svg>
    );
}

const STUDY_TECHNIQUES = [
    { id: '1', title: 'Técnica Pomodoro', subtitle: '25 min foco / 5 descanso', Icon: ClockIcon },
    { id: '2', title: 'Repetición espaciada', subtitle: 'Repasa justo antes de olvidar', Icon: RepeatLinesIcon },
    { id: '3', title: 'Active recall', subtitle: 'Recupera de memoria, no releas', Icon: PersonIcon },
    { id: '4', title: 'Curva del olvido', subtitle: 'Por qué repasar a las 24h', Icon: TrendUpIcon },
];

export default function StudyTipsScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Cómo estudiar mejor" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.list}>
                    {STUDY_TECHNIQUES.map((tech, index) => {
                        const { Icon } = tech;
                        return (
                            <View key={tech.id} style={[styles.row, index > 0 && styles.rowSeparator]}>
                                <View style={styles.iconWrap}>
                                    <Icon />
                                </View>
                                <View style={styles.rowTextWrap}>
                                    <Text style={styles.rowTitle}>{tech.title}</Text>
                                    <Text style={styles.rowSubtitle}>{tech.subtitle}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Espacio grande antes del banner, tal como aparece en el frame de Figma */}
                <View style={styles.bannerSpacer} />

                {/* CTA final al Tutor IA */}
                <View style={styles.ctaCard}>
                    <View style={styles.ctaText}>
                        <Text style={styles.ctaTitle}>¿Lo aplicamos a tu temario?</Text>
                        <Text style={styles.ctaSubtitle}>El Tutor IA te hace un plan con estas técnicas</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        activeOpacity={0.75}
                        onPress={() => navigation.navigate('AITutor')}
                    >
                        <Text style={styles.ctaButtonText}>Tutor IA</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: spacing.lg }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
    },
    list: {
        marginTop: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 26,
    },
    rowSeparator: {
        borderTopWidth: 0.44,
        borderTopColor: FIGMA.separator,
    },
    iconWrap: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 18,
    },
    rowTextWrap: {
        flex: 1,
    },
    rowTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: colors.textDark,
    },
    rowSubtitle: {
        marginTop: 3,
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: FIGMA.textNote,
    },
    bannerSpacer: {
        height: 200,
    },
    ctaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ctaGreen,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: FIGMA.bannerBorder,
        paddingVertical: 18,
        paddingHorizontal: 18,
    },
    ctaText: {
        flex: 1,
        marginRight: 12,
    },
    ctaTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 17.8,
        color: colors.white,
    },
    ctaSubtitle: {
        marginTop: 4,
        fontFamily: 'Poppins-Light',
        fontSize: 14.3,
        color: FIGMA.offWhite,
    },
    ctaButton: {
        width: 88,
        height: 36,
        borderRadius: 9.8,
        borderWidth: 1.3,
        borderColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.4,
        color: colors.white,
    },
});
