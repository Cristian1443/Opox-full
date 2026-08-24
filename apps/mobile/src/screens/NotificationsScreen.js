import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { dashboardApi } from '../api';
import { colors } from '../theme';

// ─── Iconos SVG — trazados reales exportados de Figma ────────────────────────
// Archivo "OPOX_AI (2)" (fileKey jeiU2Otw0TADm0lwGwHPe7), frame "CENTRO
// NOTIFICACIONES" (node 2357:1425). Los `d` de cada <Path> son los vectores
// tal cual los expone Figma (solo reposicionados con <G transform="translate">
// usando los offsets relativos reales calculados a partir de los insets del
// frame) — no son formas inventadas.

// Chevron "‹" (usado también rotado 180° como "›" en cada fila y en el botón
// "Volver"). Vector original: 16.67×29.16, stroke #412950, strokeWidth 4.17.
function IconChevron({ size = 8, color = colors.textDark, pointRight = false }) {
    const height = size * 1.75;
    return (
        <Svg
            width={size}
            height={height}
            viewBox="0 0 16.67 29.16"
            fill="none"
            style={pointRight ? { transform: [{ rotate: '180deg' }] } : undefined}
        >
            <Path
                d="M14.585 2.085L2.085 14.585L14.585 27.075"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// Icono "reloj" antes del timestamp de cada notificación (28×28, #343A3D 50%).
function IconClock({ size = 14 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
            <Path
                d="M13.9986 27.9998C11.2295 27.9998 8.5225 27.1786 6.22003 25.6401C3.91756 24.1017 2.123 21.915 1.06329 19.3566C0.00357733 16.7983 -0.273692 13.9831 0.266545 11.2672C0.806781 8.5512 2.14026 6.05644 4.09835 4.09835C6.05644 2.14026 8.5512 0.806781 11.2672 0.266545C13.9831 -0.273692 16.7983 0.00357733 19.3566 1.06329C21.915 2.123 24.1017 3.91756 25.6401 6.22003C27.1786 8.5225 27.9998 11.2295 27.9998 13.9986C27.9962 17.7109 26.5199 21.27 23.895 23.895C21.27 26.5199 17.7109 27.9962 13.9986 27.9998ZM13.9986 1.55569C11.5376 1.55791 9.13246 2.28974 7.08728 3.65868C5.04211 5.02763 3.44872 6.9722 2.50856 9.24659C1.5684 11.521 1.32367 14.0231 1.80532 16.4365C2.28697 18.85 3.47336 21.0664 5.21452 22.8057C6.95568 24.545 9.17343 25.729 11.5874 26.208C14.0014 26.6871 16.5032 26.4396 18.7766 25.497C21.0499 24.5544 22.9928 22.9589 24.3595 20.9123C25.7262 18.8656 26.4555 16.4597 26.455 13.9986C26.4509 10.6975 25.1367 7.53297 22.8012 5.19998C20.4657 2.86699 17.2998 1.55628 13.9986 1.55569Z"
                fill="#343A3D"
                fillOpacity={0.5}
            />
            <Path
                d="M14.7768 15.5548H6.99944C6.79311 15.5548 6.59523 15.4728 6.44934 15.3269C6.30344 15.1811 6.22148 14.9832 6.22148 14.7768C6.22148 14.5705 6.30344 14.3726 6.44934 14.2267C6.59523 14.0808 6.79311 13.9989 6.99944 13.9989H13.9989V6.99944C13.9989 6.79311 14.0808 6.59523 14.2267 6.44934C14.3726 6.30344 14.5705 6.22148 14.7768 6.22148C14.9832 6.22148 15.1811 6.30344 15.3269 6.44934C15.4728 6.59523 15.5548 6.79311 15.5548 6.99944V14.7768C15.5548 14.9832 15.4728 15.1811 15.3269 15.3269C15.1811 15.4728 14.9832 15.5548 14.7768 15.5548Z"
                fill="#343A3D"
                fillOpacity={0.5}
            />
        </Svg>
    );
}

// Icono de filtro (sliders) junto a los tabs (54×48, #412950).
function IconFilterSliders({ width = 27, height = 24, color = colors.textDark }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 54 48" fill="none">
            <Path d="M7.10688 25.4101H1.42138C1.22857 25.4204 1.03568 25.3915 0.854467 25.3253C0.673254 25.2591 0.507519 25.1569 0.367375 25.025C0.227231 24.893 0.115615 24.7341 0.0393388 24.5579C-0.0369377 24.3816 -0.076276 24.1918 -0.076276 24C-0.076276 23.8082 -0.0369377 23.6184 0.0393388 23.4421C0.115615 23.2659 0.227231 23.107 0.367375 22.975C0.507519 22.8431 0.673254 22.7409 0.854467 22.6747C1.03568 22.6085 1.22857 22.5796 1.42138 22.5899H7.10688C7.47012 22.6093 7.81206 22.7663 8.06228 23.0286C8.31251 23.291 8.45198 23.6386 8.45198 24C8.45198 24.3614 8.31251 24.709 8.06228 24.9714C7.81206 25.2337 7.47012 25.3907 7.10688 25.4101Z" fill={color} />
            <Path d="M12.7883 31.0586C11.3822 31.0586 10.0076 30.6442 8.83864 29.8678C7.66966 29.0914 6.75876 27.988 6.22122 26.6971C5.68368 25.4062 5.54366 23.986 5.81888 22.616C6.09409 21.2461 6.77218 19.988 7.76733 19.001C8.76247 18.0141 10.0299 17.3426 11.4094 17.0715C12.7888 16.8005 14.2181 16.942 15.5165 17.4783C16.8149 18.0146 17.924 18.9215 18.7034 20.0842C19.4829 21.2469 19.8976 22.6132 19.8952 24.0102C19.8908 25.8803 19.1403 27.6725 17.8081 28.9937C16.4759 30.315 14.6707 31.0575 12.7883 31.0586ZM12.7883 19.7657C11.9453 19.7657 11.1212 20.0139 10.4201 20.4791C9.71907 20.9442 9.17252 21.6054 8.84954 22.379C8.52656 23.1526 8.44164 24.004 8.6055 24.8255C8.76937 25.6471 9.17468 26.4019 9.77021 26.9947C10.3657 27.5875 11.1248 27.9916 11.9514 28.156C12.778 28.3204 13.6351 28.2377 14.4144 27.9183C15.1937 27.5989 15.8603 27.0572 16.3298 26.3616C16.7993 25.666 17.0508 24.8477 17.0524 24.0102C17.053 23.4533 16.9431 22.9018 16.7291 22.3871C16.5151 21.8724 16.2011 21.4047 15.8052 21.0105C15.4092 20.6164 14.939 20.3036 14.4214 20.09C13.9037 19.8764 13.3488 19.7662 12.7883 19.7657Z" fill={color} />
            <Path d="M24.1676 8.4687H1.42148C1.22868 8.47899 1.03578 8.45015 0.854571 8.38394C0.673358 8.31772 0.507623 8.21552 0.367479 8.08357C0.227335 7.95162 0.115719 7.79269 0.0394429 7.61647C-0.0368336 7.44025 -0.0761719 7.25043 -0.0761719 7.05861C-0.0761719 6.86678 -0.0368336 6.67697 0.0394429 6.50075C0.115719 6.32453 0.227335 6.16559 0.367479 6.03364C0.507623 5.90169 0.673358 5.79949 0.854571 5.73328C1.03578 5.66707 1.22868 5.63823 1.42148 5.64852H24.1676C24.5308 5.66791 24.8728 5.82493 25.123 6.08725C25.3732 6.34956 25.5127 6.69721 25.5127 7.05861C25.5127 7.42001 25.3732 7.76765 25.123 8.02997C24.8728 8.29228 24.5308 8.4493 24.1676 8.4687Z" fill={color} />
            <Path d="M52.5784 8.4687H35.526C35.3332 8.47899 35.1403 8.45015 34.9591 8.38394C34.7778 8.31772 34.6121 8.21552 34.472 8.08357C34.3318 7.95162 34.2202 7.79269 34.1439 7.61647C34.0677 7.44025 34.0283 7.25043 34.0283 7.05861C34.0283 6.86678 34.0677 6.67697 34.1439 6.50075C34.2202 6.32453 34.3318 6.16559 34.472 6.03364C34.6121 5.90169 34.7778 5.79949 34.9591 5.73328C35.1403 5.66707 35.3332 5.63823 35.526 5.64852H52.5784C52.7712 5.63823 52.9641 5.66707 53.1453 5.73328C53.3265 5.79949 53.4922 5.90169 53.6324 6.03364C53.7725 6.16559 53.8841 6.32453 53.9604 6.50075C54.0367 6.67697 54.076 6.86678 54.076 7.05861C54.076 7.25043 54.0367 7.44025 53.9604 7.61647C53.8841 7.79269 53.7725 7.95162 53.6324 8.08357C53.4922 8.21552 53.3265 8.31772 53.1453 8.38394C52.9641 8.45015 52.7712 8.47899 52.5784 8.4687Z" fill={color} />
            <Path d="M29.8408 14.1173C28.435 14.1173 27.0608 13.7031 25.892 12.9271C24.7232 12.1511 23.8123 11.0482 23.2745 9.75776C22.7367 8.46736 22.5962 7.0475 22.8707 5.67776C23.1453 4.30802 23.8226 3.04995 24.8169 2.06267C25.8112 1.07538 27.0779 0.403245 28.4568 0.131269C29.8357 -0.140707 31.2648 -0.000302307 32.5633 0.534723C33.8618 1.06975 34.9715 1.97536 35.7519 3.13701C36.5323 4.29866 36.9485 5.66415 36.9476 7.06079C36.9455 8.93234 36.1959 10.7266 34.8634 12.0496C33.531 13.3726 31.7246 14.1163 29.8408 14.1173ZM29.8408 2.82441C28.9974 2.82441 28.173 3.07287 27.4717 3.53837C26.7705 4.00387 26.224 4.6655 25.9012 5.4396C25.5785 6.21369 25.494 7.06548 25.6586 7.88726C25.8231 8.70904 26.2292 9.46388 26.8256 10.0564C27.4219 10.6488 28.1817 11.0523 29.0089 11.2158C29.836 11.3792 30.6934 11.2953 31.4726 10.9747C32.2517 10.654 32.9177 10.1111 33.3863 9.41439C33.8548 8.71772 34.1049 7.89866 34.1049 7.06079C34.1038 5.93756 33.6542 4.86065 32.8548 4.06641C32.0553 3.27217 30.9714 2.82549 29.8408 2.82441Z" fill={color} />
            <Path d="M52.5786 25.4101H18.4737C18.2809 25.4204 18.088 25.3916 17.9068 25.3253C17.7256 25.2591 17.5599 25.1569 17.4197 25.025C17.2796 24.893 17.168 24.7341 17.0917 24.5579C17.0154 24.3817 16.9761 24.1918 16.9761 24C16.9761 23.8082 17.0154 23.6184 17.0917 23.4422C17.168 23.2659 17.2796 23.107 17.4197 22.9751C17.5599 22.8431 17.7256 22.7409 17.9068 22.6747C18.088 22.6085 18.2809 22.5796 18.4737 22.5899H52.5786C52.7714 22.5796 52.9643 22.6085 53.1455 22.6747C53.3267 22.7409 53.4924 22.8431 53.6326 22.9751C53.7727 23.107 53.8843 23.2659 53.9606 23.4422C54.0369 23.6184 54.0762 23.8082 54.0762 24C54.0762 24.1918 54.0369 24.3817 53.9606 24.5579C53.8843 24.7341 53.7727 24.893 53.6326 25.025C53.4924 25.1569 53.3267 25.2591 53.1455 25.3253C52.9643 25.3916 52.7714 25.4204 52.5786 25.4101Z" fill={color} />
            <Path d="M32.6836 42.3515H1.42148C1.22868 42.3618 1.03578 42.333 0.854571 42.2667C0.673358 42.2005 0.507623 42.0983 0.367479 41.9664C0.227335 41.8344 0.115719 41.6755 0.0394429 41.4993C-0.0368336 41.3231 -0.0761719 41.1332 -0.0761719 40.9414C-0.0761719 40.7496 -0.0368336 40.5598 0.0394429 40.3836C0.115719 40.2073 0.227335 40.0484 0.367479 39.9165C0.507623 39.7845 0.673358 39.6823 0.854571 39.6161C1.03578 39.5499 1.22868 39.521 1.42148 39.5313H32.6836C32.8764 39.521 33.0693 39.5499 33.2505 39.6161C33.4317 39.6823 33.5974 39.7845 33.7376 39.9165C33.8777 40.0484 33.9893 40.2073 34.0656 40.3836C34.1419 40.5598 34.1812 40.7496 34.1812 40.9414C34.1812 41.1332 34.1419 41.3231 34.0656 41.4993C33.9893 41.6755 33.8777 41.8344 33.7376 41.9664C33.5974 42.0983 33.4317 42.2005 33.2505 42.2667C33.0693 42.333 32.8764 42.3618 32.6836 42.3515Z" fill={color} />
            <Path d="M52.5786 42.3515H44.0504C43.8576 42.3618 43.6647 42.333 43.4835 42.2667C43.3023 42.2005 43.1365 42.0983 42.9964 41.9664C42.8562 41.8344 42.7446 41.6755 42.6683 41.4993C42.5921 41.3231 42.5527 41.1332 42.5527 40.9414C42.5527 40.7496 42.5921 40.5598 42.6683 40.3836C42.7446 40.2073 42.8562 40.0484 42.9964 39.9165C43.1365 39.7845 43.3023 39.6823 43.4835 39.6161C43.6647 39.5499 43.8576 39.521 44.0504 39.5313H52.5786C52.7714 39.521 52.9643 39.5499 53.1455 39.6161C53.3268 39.6823 53.4925 39.7845 53.6326 39.9165C53.7728 40.0484 53.8844 40.2073 53.9607 40.3836C54.037 40.5598 54.0763 40.7496 54.0763 40.9414C54.0763 41.1332 54.037 41.3231 53.9607 41.4993C53.8844 41.6755 53.7728 41.8344 53.6326 41.9664C53.4925 42.0983 53.3268 42.2005 53.1455 42.2667C52.9643 42.333 52.7714 42.3618 52.5786 42.3515Z" fill={color} />
            <Path d="M38.369 48.0197C36.9637 48.0213 35.5895 47.609 34.4201 46.8348C33.2506 46.0607 32.3384 44.9595 31.7988 43.6704C31.2592 42.3814 31.1163 40.9623 31.3883 39.5926C31.6602 38.2229 32.3348 36.964 33.3268 35.9751C34.3187 34.9862 35.5835 34.3116 36.9613 34.0367C38.339 33.7618 39.7679 33.8988 41.0672 34.4305C42.3666 34.9621 43.4782 35.8646 44.2614 37.0237C45.0446 38.1829 45.4644 39.5467 45.4677 40.9428C45.4693 41.8705 45.2869 42.7895 44.9311 43.6472C44.5752 44.505 44.0528 45.2847 43.3936 45.9418C42.7344 46.599 41.9514 47.1207 41.0893 47.4772C40.2272 47.8338 39.3028 48.0181 38.369 48.0197ZM38.369 36.7268C37.5254 36.7259 36.7006 36.9737 35.9988 37.4387C35.2971 37.9037 34.7499 38.5651 34.4265 39.3391C34.1031 40.1131 34.0181 40.9651 34.1822 41.7871C34.3462 42.6091 34.752 43.3644 35.3482 43.9573C35.9444 44.5501 36.7042 44.954 37.5315 45.1178C38.3587 45.2816 39.2163 45.1979 39.9957 44.8774C40.7751 44.5569 41.4413 44.0139 41.9101 43.3172C42.3788 42.6204 42.629 41.8012 42.629 40.9631C42.6311 40.4056 42.5226 39.8531 42.3096 39.3373C42.0966 38.8214 41.7832 38.3524 41.3876 37.957C40.9919 37.5617 40.5216 37.2477 40.0036 37.0331C39.4856 36.8185 38.9302 36.7075 38.369 36.7064V36.7268Z" fill={color} />
        </Svg>
    );
}

// Botón "volver": círculo bg #412950 10% + chevron (grupo "NAV", node 2357:1502).
function IconBackButton() {
    return (
        <View style={styles.backCircle}>
            <IconChevron size={8} />
        </View>
    );
}

// Campana + badge de notificaciones (node 2374:2317). Reconstrucción fiel:
// los 4 trazos de la campana y el círculo del badge, reposicionados con los
// offsets reales calculados a partir de los insets del frame Figma (905×2145).
function IconBellBadge({ count = 0 }) {
    return (
        <View style={styles.bellWrap}>
            <Svg width={29} height={37} viewBox="0 0 58 75" fill="none">
                <G transform="translate(4.2, 6.2)">
                    <Path d="M47.39 59.75H2.06C1.78948 59.75 1.5216 59.6967 1.27167 59.5932C1.02174 59.4897 0.794649 59.3379 0.60336 59.1466C0.412071 58.9553 0.260333 58.7283 0.156808 58.4783C0.0532837 58.2284 0 57.9605 0 57.69V25.9C0 11.62 11.09 0 24.73 0C38.37 0 49.45 11.62 49.45 25.9V57.69C49.45 57.9605 49.3967 58.2284 49.2932 58.4783C49.1897 58.7283 49.0379 58.9553 48.8466 59.1466C48.6554 59.3379 48.4283 59.4897 48.1783 59.5932C47.9284 59.6967 47.6605 59.75 47.39 59.75ZM4.12 55.63H45.33V25.9C45.33 13.9 36.09 4.12 24.73 4.12C13.37 4.12 4.12 13.89 4.12 25.9V55.63Z" fill={colors.accentOrange} />
                </G>
                <G transform="translate(0, 60.9)">
                    <Path d="M55.63 4.12H2.06C1.51365 4.12 0.989685 3.90296 0.60336 3.51664C0.217035 3.13031 0 2.60634 0 2.06C0 1.51365 0.217035 0.989684 0.60336 0.603359C0.989685 0.217034 1.51365 0 2.06 0H55.63C56.1763 0 56.7003 0.217034 57.0866 0.603359C57.473 0.989684 57.69 1.51365 57.69 2.06C57.69 2.60634 57.473 3.13031 57.0866 3.51664C56.7003 3.90296 56.1763 4.12 55.63 4.12Z" fill={colors.accentOrange} />
                </G>
                <G transform="translate(20.6, 63.0)">
                    <Path d="M8.25 10.31C6.06278 10.3074 3.96589 9.43731 2.41929 7.89071C0.872691 6.34411 0.00264637 4.24723 0 2.06C0.036406 1.53716 0.269785 1.04759 0.65304 0.690098C1.0363 0.332601 1.54089 0.133793 2.065 0.133793C2.58911 0.133793 3.0937 0.332601 3.47696 0.690098C3.86021 1.04759 4.09359 1.53716 4.13 2.06C4.13 2.60105 4.23657 3.13679 4.44361 3.63665C4.65066 4.13652 4.95414 4.5907 5.33672 4.97328C5.7193 5.35586 6.17348 5.65933 6.67334 5.86638C7.17321 6.07343 7.70895 6.18 8.25 6.18C8.79105 6.18 9.32679 6.07343 9.82666 5.86638C10.3265 5.65933 10.7807 5.35586 11.1633 4.97328C11.5459 4.5907 11.8493 4.13652 12.0564 3.63665C12.2634 3.13679 12.37 2.60105 12.37 2.06C12.37 1.51366 12.587 0.989684 12.9734 0.603359C13.3597 0.217034 13.8837 0 14.43 0C14.9763 0 15.5003 0.217034 15.8866 0.603359C16.273 0.989684 16.49 1.51366 16.49 2.06C16.4874 4.2455 15.6187 6.34087 14.0742 7.88719C12.5298 9.4335 10.4355 10.3047 8.25 10.31Z" fill={colors.accentOrange} />
                </G>
                <G transform="translate(24.8, 0)">
                    <Path d="M4.09 8.23989C3.27645 8.23397 2.48286 7.98731 1.80928 7.53101C1.13571 7.07471 0.612313 6.42921 0.305075 5.67587C-0.00216255 4.92254 -0.0794851 4.0951 0.0828577 3.29789C0.245201 2.50067 0.63994 1.76937 1.21731 1.19617C1.79468 0.622978 2.52883 0.233555 3.3272 0.077C4.12557 -0.0795548 4.95242 0.00376793 5.70351 0.316463C6.45459 0.629158 7.09629 1.15723 7.54768 1.83409C7.99908 2.51096 8.23998 3.30632 8.24 4.11989C8.24002 4.66347 8.13247 5.20168 7.92354 5.70351C7.71462 6.20534 7.40845 6.66086 7.02269 7.04383C6.63693 7.4268 6.1792 7.72965 5.67587 7.93493C5.17254 8.14021 4.63357 8.24385 4.09 8.23989Z" fill={colors.accentOrange} />
                </G>
            </Svg>
            {count > 0 && (
                <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{count > 9 ? '9+' : count}</Text>
                </View>
            )}
        </View>
    );
}

// Checkbox de selección (estado "Seleccionar" — sin referencia directa en los
// 4 frames de Figma dados; usa tokens de theme.js ya existentes para no
// inventar paleta).
function IconCheckCircle({ checked }) {
    return (
        <View
            style={[
                styles.checkCircle,
                checked && { backgroundColor: colors.purple, borderColor: colors.purple },
            ]}
        >
            {checked && (
                <Svg width={11} height={9} viewBox="0 0 24 24" fill="none">
                    <Path d="M5 13l4 4L19 7" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            )}
        </View>
    );
}

const TABS = [
    { key: 'all', label: 'Todas' },
    { key: 'boe', label: 'BOE' },
    { key: 'social', label: 'Social' },
];

function formatRelativeTime(isoDate) {
    const diffMin = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return new Date(isoDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

// ─── Fila de notificación (NOTIFICACION 1-5, node 2357:1560…1608) ────────────
function NotificationRow({ item, selectionMode, selected, onPress }) {
    const unread = !item.readAt;
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[styles.notifOuter, unread && styles.notifUnread]}
        >
            <View style={styles.notif}>
                {selectionMode && <IconCheckCircle checked={selected} />}
                <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifSubtitle}>{item.body}</Text>
                    <View style={styles.notifTimeRow}>
                        <IconClock size={13} />
                        <Text style={styles.notifTime}>{formatRelativeTime(item.createdAt)}</Text>
                    </View>
                </View>
                {!selectionMode && (
                    <View style={styles.notifChevron}>
                        <IconChevron size={8} pointRight />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

// ─── Pantalla principal (2.3 · CENTRO NOTIFICACIONES) ────────────────────────
export default function NotificationsScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        let cancelled = false;
        const category = activeTab === 'all' ? undefined : activeTab;
        dashboardApi.listNotifications({ category }).then(({ data }) => {
            if (!cancelled && data) setNotifications(data.items);
        });
        return () => { cancelled = true; };
    }, [activeTab]);

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    const handleMarkAllRead = () => {
        dashboardApi.markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    };

    const handleToggleSelectionMode = () => {
        setSelectionMode((prev) => !prev);
        setSelectedIds(new Set());
    };

    const handleRowPress = (item) => {
        if (selectionMode) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(item.id)) next.delete(item.id);
                else next.add(item.id);
                return next;
            });
            return;
        }
        if (!item.readAt) {
            dashboardApi.markNotificationRead(item.id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
            );
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        // TODO(bloque-2): no existe aún endpoint de borrado en dashboardApi —
        // se elimina de forma local/óptica hasta que el backend lo expone.
        setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
        setSelectedIds(new Set());
        setSelectionMode(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <IconBackButton />
                </TouchableOpacity>
                <Text style={styles.title}>Notificaciones</Text>
                <IconBellBadge count={unreadCount} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <IconFilterSliders />
                {TABS.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={active ? styles.tabActive : styles.tab}
                            onPress={() => setActiveTab(tab.key)}
                            activeOpacity={0.8}
                        >
                            <Text style={active ? styles.tabTextActive : styles.tabText}>{tab.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Lista */}
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                    <Text style={styles.empty}>No tienes notificaciones.</Text>
                ) : (
                    notifications.map((item) => (
                        <NotificationRow
                            key={item.id}
                            item={item}
                            selectionMode={selectionMode}
                            selected={selectedIds.has(item.id)}
                            onPress={() => handleRowPress(item)}
                        />
                    ))
                )}
            </ScrollView>

            {/* Footer — "Marcar leídas / Seleccionar / Eliminar" */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={handleMarkAllRead}>
                    <Text style={styles.footerMarkRead}>Marcar leídas</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToggleSelectionMode}>
                    <Text style={styles.footerAction}>{selectionMode ? 'Cancelar' : 'Seleccionar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteSelected} disabled={selectedIds.size === 0}>
                    <Text style={[styles.footerAction, selectedIds.size === 0 && styles.footerActionDisabled]}>
                        Eliminar
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos — colores/medidas del frame Figma "CENTRO NOTIFICACIONES" ───────
// (fileKey jeiU2Otw0TADm0lwGwHPe7, node 2357:1425, frame base 905×2145,
// factor de escala aplicado a mobile: ×0.5).
const DIVIDER = 'rgba(65, 41, 80, 0.5)'; // #412950 @ 50% — mismo valor que colors.textDark
const UNREAD_BG = 'rgba(128, 76, 201, 0.1)'; // colors.bannerPurple (#804CC9) @ 10%
const MUTED_TEXT = 'rgba(52, 58, 61, 0.5)'; // #343A3D @ 50% — mismo valor que colors.textMuted

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 22,
        paddingTop: 10,
        paddingBottom: 4,
    },
    backCircle: {
        width: 27,
        height: 27,
        borderRadius: 13.5,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Poppins-SemiBold',
        fontSize: 22,
        color: colors.textDark,
    },
    bellWrap: {
        width: 30,
        height: 37,
    },
    bellBadge: {
        position: 'absolute',
        left: 22,
        top: 22,
        minWidth: 15,
        height: 15,
        paddingHorizontal: 2,
        borderRadius: 7.5,
        backgroundColor: '#FE2B54',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bellBadgeText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 9,
        color: '#FFFFFF',
    },

    tabs: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 22,
        paddingTop: 14,
        paddingBottom: 14,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tabActive: {
        borderWidth: 1.5,
        borderColor: colors.textDark,
        borderRadius: 11,
        paddingVertical: 7,
        paddingHorizontal: 18,
    },
    tabText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: MUTED_TEXT,
    },
    tabTextActive: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.textDark,
    },

    scroll: {
        flex: 1,
        paddingHorizontal: 22,
        borderTopWidth: 1,
        borderTopColor: DIVIDER,
    },
    empty: {
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
        color: MUTED_TEXT,
        fontSize: 13,
        marginTop: 40,
    },

    notifOuter: {
        marginHorizontal: -22,
        paddingHorizontal: 22,
        borderBottomWidth: 1,
        borderBottomColor: DIVIDER,
    },
    notifUnread: {
        backgroundColor: UNREAD_BG,
    },
    notif: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 14,
    },
    notifTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 15,
        color: colors.textDark,
        opacity: 0.9,
    },
    notifSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: MUTED_TEXT,
        marginTop: 2,
    },
    notifTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 5,
    },
    notifTime: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: MUTED_TEXT,
    },
    notifChevron: {
        alignSelf: 'center',
        marginLeft: 4,
    },

    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.gray,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: DIVIDER,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    footerMarkRead: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: colors.accentOrange,
    },
    footerAction: {
        fontFamily: 'Poppins-Light',
        fontSize: 14,
        color: colors.textDark,
    },
    footerActionDisabled: {
        opacity: 0.4,
    },
});
