import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import DestacadoBanner from '../../components/DestacadoBanner';
import AvatarPlaceholder from '../../components/AvatarPlaceholder';
import { motivationApi, trainingApi } from '../../api';
import { colors, spacing } from '../../theme';

// Icono de chevron para el botón de volver (mismo patrón que MotivationHomeScreen.js / ClanDetailScreen.js).
// Figma: ~5.5x11dp dentro de un círculo de 24dp.
function IconChevronLeft({ size = 11, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

const TABS = [
    { key: 'weekly', label: 'Semanal' },
    { key: 'global', label: 'Global' },
    { key: 'oposicion', label: 'Mi oposición' },
    { key: 'topic', label: 'Tema' },
];

// Icono de "sliders" exacto exportado de Figma (antes era una aproximación
// hecha con Path/Circle genéricos).
function IconFilter({ size = 24, color = colors.textDark }) {
    return (
        <Svg width={(size * 54) / 48} height={size} viewBox="0 0 54 48" fill="none">
            <Path d="M7.10698 25.4101H1.42148C1.22868 25.4204 1.03578 25.3916 0.854571 25.3253C0.673358 25.2591 0.507623 25.1569 0.367479 25.025C0.227335 24.893 0.115719 24.7341 0.0394429 24.5579C-0.0368336 24.3817 -0.0761719 24.1918 -0.0761719 24C-0.0761719 23.8082 -0.0368336 23.6184 0.0394429 23.4422C0.115719 23.2659 0.227335 23.107 0.367479 22.9751C0.507623 22.8431 0.673358 22.7409 0.854571 22.6747C1.03578 22.6085 1.22868 22.5796 1.42148 22.5899H7.10698C7.47023 22.6093 7.81216 22.7663 8.06239 23.0287C8.31261 23.291 8.45208 23.6386 8.45208 24C8.45208 24.3614 8.31261 24.7091 8.06239 24.9714C7.81216 25.2337 7.47023 25.3907 7.10698 25.4101Z" fill={color} />
            <Path d="M12.7885 31.0587C11.3824 31.0587 10.0079 30.6443 8.83887 29.868C7.66988 29.0916 6.75898 27.9881 6.22144 26.6973C5.6839 25.4064 5.54388 23.9861 5.8191 22.6162C6.09432 21.2462 6.77241 19.9881 7.76755 19.0012C8.7627 18.0142 10.0302 17.3427 11.4096 17.0717C12.789 16.8006 14.2183 16.9422 15.5167 17.4785C16.8151 18.0147 17.9242 18.9216 18.7036 20.0843C19.4831 21.2471 19.8978 22.6134 19.8954 24.0103C19.8911 25.8805 19.1405 27.6726 17.8083 28.9939C16.4761 30.3151 14.6709 31.0577 12.7885 31.0587ZM12.7885 19.7658C11.9455 19.7658 11.1214 20.0141 10.4203 20.4792C9.71929 20.9444 9.17274 21.6055 8.84976 22.3791C8.52678 23.1528 8.44186 24.0041 8.60573 24.8257C8.7696 25.6472 9.17491 26.4021 9.77043 26.9949C10.366 27.5877 11.125 27.9918 11.9516 28.1562C12.7782 28.3205 13.6353 28.2378 14.4147 27.9184C15.194 27.599 15.8605 27.0573 16.33 26.3617C16.7996 25.6661 17.051 24.8479 17.0526 24.0103C17.0532 23.4535 16.9433 22.902 16.7293 22.3873C16.5153 21.8726 16.2014 21.4048 15.8054 21.0107C15.4094 20.6166 14.9392 20.3038 14.4216 20.0902C13.9039 19.8766 13.349 19.7664 12.7885 19.7658Z" fill={color} />
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

// Iconos exactos de medalla con dígito exportados de Figma (top 1/2/3).
// Cada uno es la cinta + el aro circular + el número, ya integrados en el
// mismo vector — no un número de texto superpuesto sobre un aro genérico.
function IconMedal1({ size = 53 }) {
    return (
        <Svg width={size} height={(size * 101) / 53} viewBox="0 0 53 101" fill="none">
            <Path d="M21.2021 68.9111V63.9922H29.7447V85.8575H24.2553V68.8957L21.2021 68.9111Z" fill={colors.accentOrange} />
            <Path d="M16.8846 45.7276L4.24805 22.1275V0H48.079V22.1275L35.4501 45.7276L32.5435 44.9951V7.81786H35.6274V38.8503L44.995 21.3565V3.08397H7.33973V21.3565L16.6996 38.8503V7.81786H19.7835V44.9951L16.8846 45.7276Z" fill={colors.accentOrange} />
            <Path d="M26.1675 100.229C11.7345 100.229 0 88.7104 0 74.5627C0 60.415 11.7345 48.8887 26.1675 48.8887C40.6005 48.8887 52.335 60.4073 52.335 74.5627C52.335 88.7181 40.5928 100.229 26.1675 100.229ZM26.1675 51.9726C13.4384 51.9726 3.08397 62.1035 3.08397 74.5627C3.08397 87.022 13.4384 97.1451 26.1675 97.1451C38.8966 97.1451 49.251 87.0142 49.251 74.5627C49.251 62.1112 38.8966 51.9726 26.1675 51.9726Z" fill={colors.accentOrange} />
            <Path d="M27.7095 23.4531H24.6255V45.2028H27.7095V23.4531Z" fill={colors.accentOrange} />
            <Path d="M27.7095 13.2539H24.6255V18.859H27.7095V13.2539Z" fill={colors.accentOrange} />
        </Svg>
    );
}

function IconMedal2({ size = 53 }) {
    return (
        <Svg width={size} height={(size * 101) / 53} viewBox="0 0 53 101" fill="none">
            <Path d="M19.5445 80.847C21.5182 79.197 23.0834 77.8632 24.2321 76.8224C25.3172 75.8612 26.2897 74.78 27.1311 73.5996C27.8439 72.6892 28.2537 71.5784 28.303 70.4231C28.3504 69.7282 28.1481 69.0392 27.7324 68.4802C27.5175 68.2444 27.2517 68.0607 26.9551 67.9431C26.6585 67.8255 26.3389 67.7772 26.0208 67.8018C24.4788 67.8018 23.6462 68.9197 23.5845 71.1633H18.4959C18.4825 69.6303 18.8706 68.1205 19.6216 66.7841C20.2799 65.6616 21.2566 64.76 22.428 64.1935C23.6342 63.6301 24.9518 63.3455 26.283 63.3608C27.7068 63.3106 29.1209 63.6125 30.4001 64.2398C31.4406 64.7643 32.2921 65.5996 32.8364 66.6299C33.3637 67.6707 33.6283 68.8248 33.6074 69.9914C33.5848 72.1506 32.7981 74.232 31.3869 75.8663C29.6999 77.8796 27.7854 79.6906 25.6816 81.2633H34.0083V85.5809H18.5576V81.6488C19.1744 81.1322 19.5059 80.8624 19.5445 80.847Z" fill={colors.accentOrange} />
            <Path d="M16.8846 45.7276L4.24805 22.1275V0H48.079V22.1275L35.4424 45.7276L32.5435 44.9951V7.81786H35.6274V38.8503L44.995 21.3565V3.08397H7.33202V21.3565L16.6996 38.8503V7.81786H19.7835V44.9951L16.8846 45.7276Z" fill={colors.accentOrange} />
            <Path d="M26.1598 100.229C11.7345 100.229 0 88.7104 0 74.5627C0 60.415 11.7345 48.8887 26.1598 48.8887C40.585 48.8887 52.3273 60.4073 52.3273 74.5627C52.3273 88.7181 40.5928 100.229 26.1598 100.229ZM26.1598 51.9726C13.4384 51.9726 3.08397 62.1035 3.08397 74.5627C3.08397 87.022 13.4384 97.1451 26.1598 97.1451C38.8811 97.1451 49.2433 87.0142 49.2433 74.5627C49.2433 62.1112 38.8889 51.9726 26.1598 51.9726Z" fill={colors.accentOrange} />
            <Path d="M27.7016 23.4551H24.6177V45.2048H27.7016V23.4551Z" fill={colors.accentOrange} />
            <Path d="M27.7016 13.2539H24.6177V18.859H27.7016V13.2539Z" fill={colors.accentOrange} />
        </Svg>
    );
}

function IconMedal3({ size = 53 }) {
    return (
        <Svg width={size} height={(size * 101) / 53} viewBox="0 0 53 101" fill="none">
            <Path d="M20.5777 64.6251C22.1317 63.3639 24.0996 62.7263 26.098 62.8364C27.4605 62.7867 28.8163 63.0504 30.0609 63.6074C31.0778 64.0661 31.9377 64.8133 32.5339 65.7563C33.1301 66.6992 33.4364 67.7964 33.4147 68.9118C33.4638 70.1007 33.1047 71.2706 32.397 72.2271C31.7967 73.0454 30.9678 73.6677 30.0146 74.0158V74.1392C31.1626 74.4786 32.1618 75.1969 32.8493 76.177C33.5368 77.1571 33.872 78.3411 33.8002 79.5361C33.8256 80.7205 33.5242 81.8889 32.929 82.9131C32.3175 83.9183 31.425 84.7225 30.3616 85.2261C29.1155 85.8091 27.7508 86.0942 26.3755 86.0587C24.2538 86.1685 22.1618 85.5239 20.4697 84.2392C18.9946 83.021 18.2236 81.1912 18.1567 78.7497H23.2838C23.2579 79.5364 23.5337 80.3032 24.0548 80.8931C24.3401 81.1663 24.6799 81.3762 25.0519 81.509C25.4239 81.6419 25.8198 81.6947 26.2136 81.6641C26.5547 81.6852 26.8963 81.6343 27.2165 81.5148C27.5366 81.3952 27.828 81.2097 28.0717 80.9702C28.3 80.7243 28.4769 80.4354 28.5921 80.1203C28.7072 79.8052 28.7584 79.4703 28.7425 79.1352C28.7781 78.727 28.7098 78.3163 28.544 77.9416C28.3782 77.5668 28.1202 77.2401 27.7941 76.9919C26.8829 76.4768 25.8384 76.2459 24.795 76.3288H23.8004V72.0575H24.795C25.6747 72.0915 26.5491 71.9061 27.3393 71.5178C27.6648 71.3196 27.9279 71.0336 28.0984 70.6927C28.2688 70.3518 28.3398 69.9697 28.303 69.5903C28.3301 69.2798 28.2888 68.9671 28.1821 68.6741C28.0755 68.3812 27.906 68.1152 27.6855 67.8948C27.4651 67.6744 27.1991 67.5049 26.9062 67.3982C26.6133 67.2915 26.3006 67.2503 25.99 67.2773C25.6657 67.2529 25.3401 67.3043 25.039 67.4274C24.7379 67.5505 24.4696 67.742 24.2553 67.9867C23.8567 68.49 23.6226 69.1036 23.5845 69.7445H18.4497C18.4259 68.7897 18.6031 67.8406 18.9696 66.9587C19.3362 66.0768 19.8841 65.2817 20.5777 64.6251Z" fill={colors.accentOrange} />
            <Path d="M16.9002 45.7276L4.26367 22.1275V0H48.0946V22.1275L35.458 45.7276L32.5591 44.9951V7.81786H35.6431V38.8503L45.0106 21.3565V3.08397H7.34764V21.3565L16.7152 38.8503V7.81786H19.7992V44.9951L16.9002 45.7276Z" fill={colors.accentOrange} />
            <Path d="M26.1598 100.229C11.7345 100.229 0 88.7104 0 74.5627C0 60.415 11.7345 48.8887 26.1598 48.8887C40.585 48.8887 52.3735 60.4073 52.3735 74.5627C52.3735 88.7181 40.6082 100.229 26.1598 100.229ZM26.1598 51.9726C13.4384 51.9726 3.08397 62.1035 3.08397 74.5627C3.08397 87.022 13.4538 97.1451 26.1598 97.1451C38.8657 97.1451 49.2895 87.0142 49.2895 74.5627C49.2895 62.1112 38.9043 51.9726 26.1598 51.9726Z" fill={colors.accentOrange} />
            <Path d="M27.7173 23.4531H24.6333V45.2028H27.7173V23.4531Z" fill={colors.accentOrange} />
            <Path d="M27.7173 13.252H24.6333V18.8571H27.7173V13.252Z" fill={colors.accentOrange} />
        </Svg>
    );
}

const MEDAL_ICONS = { 1: IconMedal1, 2: IconMedal2, 3: IconMedal3 };

function IconMedal({ position }) {
    const Medal = MEDAL_ICONS[position] || IconMedal1;
    return (
        <View style={styles.medalWrap}>
            <Medal size={26} />
        </View>
    );
}

function RankRow({ entry, index, isMe }) {
    const position = entry.position ?? index + 1;
    return (
        <View style={[styles.row, !isMe && styles.rowSeparator, isMe && styles.rowMe]}>
            <View style={styles.posWrap}>
                {index >= 0 && index < 3 ? <IconMedal position={position} /> : <Text style={styles.pos}>{position}</Text>}
            </View>
            <AvatarPlaceholder size={32} />
            <Text style={styles.name} numberOfLines={1}>{isMe ? 'Tú' : (entry.displayName || 'Opositor')}</Text>
            <Text style={styles.score}>{entry.points.toLocaleString('es-ES')}</Text>
        </View>
    );
}

export default function RankingsScreen({ navigation }) {
    const [tab, setTab] = useState('weekly');
    const [ranking, setRanking] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState(null);

    // Carga la lista de temas una sola vez al montar (para el tab "Tema")
    useEffect(() => {
        trainingApi.listTopics().then(({ data }) => {
            if (data && data.length > 0) setSelectedTopicId(data[0].topicId);
            setTopics(data ?? []);
        });
    }, []);

    useEffect(() => {
        if (tab === 'topic' && !selectedTopicId) { setRanking(null); return; }
        let cancelled = false;
        motivationApi.getRanking(tab, tab === 'topic' ? selectedTopicId : undefined)
            .then(({ data }) => { if (!cancelled && data) setRanking(data); });
        return () => { cancelled = true; };
    }, [tab, selectedTopicId]);

    const entries = ranking?.entries ?? [];
    const meInTop = entries.some((e) => ranking?.me && e.userId === ranking.me.userId);

    // Usamos los puntos del scope activo como proxy de opopoints (solo se muestra
    // el rango global/local cuando ese scope está efectivamente cargado).
    const opopoints = ranking?.me?.points ?? 0;
    const globalRank = tab === 'global' ? (ranking?.me?.position ?? '—') : '—';
    const localRank = tab === 'oposicion' ? (ranking?.me?.position ?? '—') : '—';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.grayLight} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <IconChevronLeft size={22} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rankings</Text>
            </View>

            <View style={styles.tabs}>
                <View style={styles.filterIcon}><IconFilter /></View>
                {/* Fila de tabs con scroll horizontal: a fontSize 16dp (medida exacta de Figma),
                    las 4 pills + ícono de filtro no caben en una sola fila fija en todos los
                    anchos de pantalla — el scroll evita que desborde y rompa el layout. */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScroll}
                >
                    {TABS.map((t) => (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.tab, tab === t.key && styles.tabActive]}
                            onPress={() => setTab(t.key)}
                        >
                            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {tab === 'topic' && topics.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.topicScroll}
                >
                    {topics.map((t) => (
                        <TouchableOpacity
                            key={t.topicId}
                            style={[styles.topicPill, selectedTopicId === t.topicId && styles.topicPillActive]}
                            onPress={() => setSelectedTopicId(t.topicId)}
                        >
                            <Text style={[styles.topicPillText, selectedTopicId === t.topicId && styles.topicPillTextActive]} numberOfLines={1}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <DestacadoBanner opopoints={opopoints} globalRank={globalRank} localRank={localRank} />

                {tab === 'topic' && topics.length === 0 ? (
                    <Text style={styles.empty}>Completa al menos un test para ver el ranking por tema.</Text>
                ) : entries.length === 0 ? (
                    <Text style={styles.empty}>
                        {tab === 'oposicion' ? 'Configura tu oposición para ver este ranking.' : 'Aún no hay datos suficientes.'}
                    </Text>
                ) : (
                    <>
                        {entries.map((e, i) => (
                            <RankRow key={e.userId} entry={e} index={i} isMe={ranking?.me?.userId === e.userId} />
                        ))}
                        {ranking?.me && !meInTop && (
                            <>
                                <Text style={styles.ellipsis}>···</Text>
                                <RankRow entry={ranking.me} index={-1} isMe />
                            </>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.grayLight },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F0F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Figma (2334:262 "Rankings"): fontSize 21dp exacto.
    headerTitle: { flex: 1, fontSize: 21, fontWeight: '600', color: colors.textDark, letterSpacing: -0.3, textAlign: 'center' },
    tabs: { flexDirection: 'row', alignItems: 'center', paddingLeft: 27, paddingBottom: 12 },
    tabsScroll: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 7, paddingRight: 27 },
    tab: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 15, borderWidth: 1.5, borderColor: 'transparent' },
    // Figma: el tab activo es un pill de BORDE (no relleno)
    tabActive: { borderColor: colors.textDark, backgroundColor: colors.white },
    // Figma (2334:451/454/457 "Semanal"/"Global"/"Justicia"): fontSize 16dp exacto.
    tabText: { fontSize: 16, fontWeight: '500', color: colors.textMuted },
    tabTextActive: { fontWeight: '700', color: colors.textDark },
    filterIcon: { padding: 4 },
    scroll: { flex: 1 },
    // Figma: 27dp de padding horizontal (tarjetas de 348dp dentro de una pantalla de 402dp).
    body: { paddingHorizontal: 27, paddingBottom: 24 },
    empty: { textAlign: 'center', color: colors.textMuted, fontSize: 12.5, marginTop: 30 },
    // Figma (2337:1245 "1" — grupo de fila): 348dp de ancho x 44.5dp de alto.
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 3, paddingVertical: spacing.sm },
    rowSeparator: { borderBottomWidth: 1, borderBottomColor: 'rgba(65, 41, 80, 0.12)' },
    // Figma (2334:367 "TÚ", 2334:436 "BG ACTIVO"): la fila resaltada se extiende de
    // borde a borde de la pantalla (402dp), sin el padding lateral de las demás filas.
    rowMe: {
        backgroundColor: 'rgba(36, 189, 144, 0.25)',
        marginHorizontal: -27,
        paddingHorizontal: 27,
        marginVertical: 2,
    },
    posWrap: { width: 40, alignItems: 'center' },
    // Figma (2334:431 "22"): fontSize 18dp exacto para los puestos sin medalla.
    pos: { textAlign: 'center', fontWeight: '800', fontSize: 18, color: colors.textDark },
    medalWrap: { alignItems: 'center' },
    // Figma (2334:370 "Nombre Apellido", 2334:404 "2.200"): fontSize 16dp exacto para ambos.
    name: { fontSize: 16, fontWeight: '700', color: colors.textDark, flex: 1 },
    score: { fontSize: 16, fontWeight: '400', color: colors.textMuted, textAlign: 'right' },
    ellipsis: { textAlign: 'center', color: colors.textMuted, opacity: 0.5, fontSize: 14, marginVertical: 4 },
    topicScroll: { flexDirection: 'row', gap: 7, paddingHorizontal: 27, paddingBottom: 10 },
    topicPill: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: colors.grayLight },
    topicPillActive: { borderColor: colors.textDark, backgroundColor: colors.white },
    topicPillText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
    topicPillTextActive: { fontWeight: '700', color: colors.textDark },
});
