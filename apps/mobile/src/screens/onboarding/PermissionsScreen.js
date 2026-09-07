import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Modal,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Constants from 'expo-constants';
import { colors, spacing } from '../../theme';

// Mismo patrón lazy que App.js — expo-notifications rompe en Expo Go SDK 53+
const IS_EXPO_GO = Constants.appOwnership === 'expo';
let Notifications = null;
if (!IS_EXPO_GO) {
    try { Notifications = require('expo-notifications'); } catch (_) {}
}

// ─── Iconos SVG exactos del wireframe (34×34, viewBox 0 0 24 24) ─────────────
// Tamaño real proporcional al Figma: los grupos de ícono ocupan ~70-110px
// dentro de un frame de 905px de ancho, mucho más grandes que el 17x17 previo.

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Rutas exactas exportadas de Figma (node "ICONO NOTIFICACIONES" 2346:1986) —
// relleno sólido, no trazo. Se conserva la proporción real (no cuadrada).
function IconBell() {
    return (
        <Svg width={35} height={45} viewBox="0 0 77.71 99.9005" fill="none">
            <Path d="M69.2134 88.7881H8.21338C7.84877 88.7881 7.48775 88.7161 7.15103 88.5763C6.8143 88.4365 6.5085 88.2316 6.25115 87.9733C5.9938 87.715 5.78997 87.4085 5.65135 87.0712C5.51274 86.734 5.44206 86.3727 5.44338 86.0081V43.2081C5.44338 23.9781 20.3834 8.32812 38.7434 8.32812C57.1034 8.32812 72.0434 23.9781 72.0434 43.2081V86.0181C72.0435 86.387 71.9699 86.7522 71.8269 87.0922C71.684 87.4322 71.4746 87.7403 71.211 87.9983C70.9474 88.2563 70.6349 88.4591 70.2918 88.5947C69.9488 88.7304 69.5822 88.7961 69.2134 88.7881ZM10.9434 83.2481H66.4434V43.2481C66.4434 27.0781 53.9934 13.9181 38.6934 13.9181C23.3934 13.9181 10.9434 27.0381 10.9434 43.2081V83.2481Z" fill={colors.accentOrange} />
            <Path d="M74.7633 88.7894H2.61334C1.90616 88.7469 1.24188 88.436 0.756178 87.9203C0.270475 87.4046 0 86.7228 0 86.0144C0 85.3059 0.270475 84.6242 0.756178 84.1085C1.24188 83.5927 1.90616 83.2818 2.61334 83.2394H74.7633C75.1418 83.2166 75.5208 83.2716 75.8773 83.4007C76.2337 83.5299 76.5599 83.7306 76.8359 83.9906C77.1119 84.2505 77.3318 84.5641 77.4821 84.9121C77.6325 85.2602 77.71 85.6353 77.71 86.0144C77.71 86.3935 77.6325 86.7686 77.4821 87.1166C77.3318 87.4647 77.1119 87.7783 76.8359 88.0382C76.5599 88.2981 76.2337 88.4988 75.8773 88.628C75.5208 88.7572 75.1418 88.8121 74.7633 88.7894Z" fill={colors.accentOrange} />
            <Path d="M38.6934 99.9004C35.7486 99.8978 32.9253 98.7261 30.8439 96.6428C28.7625 94.5596 27.5934 91.7352 27.5934 88.7904C27.5707 88.412 27.6256 88.0329 27.7547 87.6765C27.8839 87.3201 28.0846 86.9938 28.3446 86.7178C28.6045 86.4418 28.9181 86.2219 29.2661 86.0716C29.6142 85.9213 29.9893 85.8438 30.3684 85.8438C30.7475 85.8438 31.1226 85.9213 31.4706 86.0716C31.8187 86.2219 32.1323 86.4418 32.3922 86.7178C32.6521 86.9938 32.8528 87.3201 32.982 87.6765C33.1112 88.0329 33.1661 88.412 33.1434 88.7904C33.1434 90.2624 33.7281 91.674 34.7689 92.7149C35.8098 93.7557 37.2214 94.3404 38.6934 94.3404C40.1653 94.3404 41.577 93.7557 42.6178 92.7149C43.6586 91.674 44.2434 90.2624 44.2434 88.7904C44.2434 88.4227 44.3158 88.0586 44.4565 87.7189C44.5972 87.3792 44.8035 87.0705 45.0635 86.8105C45.3235 86.5505 45.6322 86.3443 45.9719 86.2035C46.3116 86.0628 46.6757 85.9904 47.0434 85.9904C47.4111 85.9904 47.7752 86.0628 48.1149 86.2035C48.4546 86.3443 48.7633 86.5505 49.0233 86.8105C49.2833 87.0705 49.4895 87.3792 49.6302 87.7189C49.771 88.0586 49.8434 88.4227 49.8434 88.7904C49.8434 90.2528 49.5547 91.7007 48.9939 93.0513C48.433 94.4018 47.6111 95.6284 46.5752 96.6605C45.5393 97.6927 44.3098 98.5102 42.9573 99.0662C41.6047 99.6222 40.1557 99.9057 38.6934 99.9004Z" fill={colors.accentOrange} />
            <Path d="M38.6931 11.1C37.5954 11.1 36.5223 10.7745 35.6097 10.1647C34.697 9.55482 33.9856 8.68803 33.5655 7.6739C33.1455 6.65977 33.0356 5.54385 33.2497 4.46725C33.4639 3.39066 33.9924 2.40174 34.7686 1.62556C35.5448 0.849378 36.5337 0.320792 37.6103 0.106644C38.6869 -0.107504 39.8028 0.00240472 40.817 0.422471C41.8311 0.842537 42.6979 1.55389 43.3077 2.46659C43.9176 3.37928 44.2431 4.45232 44.2431 5.55C44.2404 7.02114 43.6548 8.43127 42.6146 9.47153C41.5743 10.5118 40.1642 11.0974 38.6931 11.1Z" fill={colors.accentOrange} />
        </Svg>
    );
}

// Rutas exactas exportadas de Figma (node "SALUD ICONO" 2346:1990) — corazón + pulso.
function IconHealth() {
    return (
        <Svg width={50} height={43} viewBox="0 0 110.246 94.2256" fill="none">
            <Path d="M101.71 9.13562L101.32 8.73562C98.6185 5.97043 95.3919 3.77316 91.8293 2.27298C88.2667 0.772805 84.4402 0 80.5747 0C76.7091 0 72.8826 0.772805 69.3201 2.27298C65.7575 3.77316 62.5308 5.97043 59.8297 8.73562L59.1997 9.37562L58.5697 8.73562C55.8685 5.97043 52.6419 3.77316 49.0793 2.27298C45.5167 0.772805 41.6902 0 37.8247 0C33.9591 0 30.1326 0.772805 26.5701 2.27298C23.0075 3.77316 19.7808 5.97043 17.0797 8.73562L16.6897 9.12562C11.1729 14.7191 8.09524 22.2694 8.12968 30.1256V31.5456H14.2697V30.1056C14.2413 23.8681 16.6865 17.8736 21.0697 13.4356L21.4497 13.0456C23.5816 10.8643 26.1279 9.13109 28.9391 7.94776C31.7503 6.76442 34.7696 6.15485 37.8197 6.15485C40.8698 6.15485 43.8891 6.76442 46.7003 7.94776C49.5115 9.13109 52.0578 10.8643 54.1897 13.0456L59.1897 18.1256L64.1897 13.0456C66.3223 10.8656 68.8688 9.13342 71.6799 7.95086C74.491 6.7683 77.51 6.15915 80.5597 6.15915C83.6094 6.15915 86.6284 6.7683 89.4394 7.95086C92.2505 9.13342 94.7971 10.8656 96.9297 13.0456L97.3197 13.4456C101.675 17.9033 104.114 23.8883 104.114 30.1206C104.114 36.353 101.675 42.3379 97.3197 46.7956L59.1997 85.4756L21.0597 46.7756C20.4862 46.1961 19.9454 45.5852 19.4397 44.9456L18.5497 43.8456L13.7797 47.6756L14.6597 48.7856C15.3097 49.5956 16.0097 50.3756 16.6597 51.0956L59.1697 94.2256L101.67 51.0956C107.16 45.4948 110.238 37.9667 110.246 30.1238C110.253 22.2809 107.189 14.7469 101.71 9.13562Z" fill={colors.accentOrange} />
            <Path d="M35.58 32.3456L42.62 55.7156L50.88 40.1856H78.74V34.0456H47.19L44.2 39.6656L36.61 14.5156L27.61 35.2856H0V41.4256H31.65L35.58 32.3456Z" fill={colors.accentOrange} />
        </Svg>
    );
}

// Rutas exactas exportadas de Figma (node "CAMARA" 2346:1994).
function IconCamera() {
    return (
        <Svg width={44} height={39} viewBox="0 0 97.2 86.3801" fill="none">
            <Path d="M48.6498 32.3711C44.3753 32.3691 40.1963 33.6348 36.6412 36.0082C33.0861 38.3815 30.3148 41.7558 28.6776 45.7044C27.0405 49.6529 26.6111 53.9983 27.4438 58.1909C28.2765 62.3835 30.3339 66.2349 33.3557 69.2581C36.3775 72.2813 40.228 74.3405 44.4202 75.1751C48.6124 76.0098 52.958 75.5824 56.9073 73.9471C60.8566 72.3118 64.2322 69.542 66.6072 65.988C68.9821 62.434 70.2498 58.2556 70.2498 53.9811C70.2445 48.2531 67.9674 42.7611 63.9181 38.7099C59.8687 34.6587 54.3778 32.379 48.6498 32.3711ZM48.6498 70.1811C45.4429 70.1831 42.3075 69.2338 39.6402 67.4534C36.973 65.673 34.8938 63.1414 33.6656 60.179C32.4375 57.2166 32.1157 53.9565 32.7408 50.8111C33.366 47.6658 34.91 44.7765 37.1776 42.5089C39.4452 40.2413 42.3345 38.6972 45.4798 38.0721C48.6252 37.4469 51.8853 37.7688 54.8477 38.9969C57.8101 40.2251 60.3417 42.3043 62.1221 44.9715C63.9025 47.6388 64.8518 50.7742 64.8498 53.9811C64.8419 58.2742 63.1322 62.3891 60.0956 65.4239C57.0589 68.4587 52.943 70.1658 48.6498 70.1711V70.1811Z" fill={colors.accentOrange} />
            <Path d="M24.3401 21.5508H13.5601C12.8711 21.5927 12.2241 21.8959 11.7511 22.3986C11.278 22.9013 11.0146 23.5655 11.0146 24.2558C11.0146 24.946 11.278 25.6103 11.7511 26.113C12.2241 26.6156 12.8711 26.9189 13.5601 26.9608H24.3701C25.0591 26.9189 25.7061 26.6156 26.1791 26.113C26.6521 25.6103 26.9156 24.946 26.9156 24.2558C26.9156 23.5655 26.6521 22.9013 26.1791 22.3986C25.7061 21.8959 25.0591 21.5927 24.3701 21.5508H24.3401Z" fill={colors.accentOrange} />
            <Path d="M89.16 10.7501H75.16C74.4444 10.7473 73.7585 10.4636 73.25 9.96013L65.64 2.37013C64.1162 0.856933 62.0574 0.00538084 59.91 0.000133911H37.38C36.3152 -0.00602657 35.26 0.200427 34.276 0.607394C33.2921 1.01436 32.3993 1.61365 31.65 2.37013L24.01 10.0101C23.5003 10.5118 22.8152 10.7952 22.1 10.8001H8.10001C5.95175 10.8001 3.89148 11.6535 2.37244 13.1726C0.853392 14.6916 0 16.7519 0 18.9001V78.2801C0.00264626 80.4276 0.856895 82.4863 2.37537 84.0048C3.89384 85.5232 5.95256 86.3775 8.10001 86.3801H89.1C91.2474 86.3775 93.3062 85.5232 94.8246 84.0048C96.3431 82.4863 97.1974 80.4276 97.2 78.2801V18.8501C97.2001 16.7122 96.3549 14.661 94.8488 13.1437C93.3427 11.6263 91.2978 10.766 89.16 10.7501ZM91.86 78.2801C91.86 78.9962 91.5755 79.683 91.0692 80.1893C90.5628 80.6957 89.8761 80.9801 89.16 80.9801H8.16C7.44392 80.9801 6.75717 80.6957 6.25082 80.1893C5.74448 79.683 5.45999 78.9962 5.45999 78.2801V18.8501C5.45999 18.134 5.74448 17.4473 6.25082 16.9409C6.75717 16.4346 7.44392 16.1501 8.16 16.1501H22.16C23.2243 16.153 24.2786 15.945 25.262 15.5382C26.2455 15.1314 27.1387 14.5339 27.89 13.7801L35.53 6.14013C36.0245 5.65479 36.6872 5.37897 37.38 5.37013H59.91C60.2649 5.36827 60.6166 5.43717 60.9445 5.57281C61.2725 5.70846 61.5701 5.90812 61.82 6.16013L69.46 13.8001C70.9837 15.3133 73.0426 16.1649 75.19 16.1701H89.19C89.9061 16.1701 90.5928 16.4546 91.0992 16.9609C91.6055 17.4673 91.89 18.154 91.89 18.8701L91.86 78.2801Z" fill={colors.accentOrange} />
        </Svg>
    );
}

// Rutas exactas exportadas de Figma (node "MICRO" 2346:2007).
function IconMic() {
    return (
        <Svg width={30} height={47} viewBox="0 0 65.8332 102.849" fill="none">
            <Path d="M15.8102 64.3085C17.7444 67.0117 20.296 69.2141 23.2529 70.7326C26.2097 72.251 29.4863 73.0415 32.8102 73.0385C35.0588 73.0516 37.2956 72.7143 39.4402 72.0385C43.5841 70.7656 47.2074 68.1909 49.7725 64.6963C52.3376 61.2017 53.7079 56.9734 53.6802 52.6385C53.6802 48.9485 53.6802 45.2685 53.6802 41.5785C53.6802 39.9185 53.6802 38.2585 53.6802 36.5785V20.3785C53.7291 17.7592 53.2425 15.1576 52.2503 12.7331C51.2581 10.3085 49.7813 8.11211 47.9102 6.2785C45.5252 3.79507 42.5511 1.95474 39.2643 0.9285C35.9775 -0.0977451 32.4847 -0.276618 29.1102 0.408499C24.3935 1.15493 20.0951 3.55232 16.9815 7.17321C13.868 10.7941 12.1416 15.4031 12.1102 20.1785C12.1102 31.0718 12.1102 41.9585 12.1102 52.8385C12.0712 56.9613 13.3694 60.9857 15.8102 64.3085ZM47.8902 36.5385C47.8902 38.2185 47.8902 39.9085 47.8902 41.5385C47.8902 45.2085 47.8902 48.8785 47.8902 52.5385C47.8753 56.2276 46.47 59.7755 43.9547 62.4742C41.4395 65.173 37.9992 66.8242 34.3203 67.0985C31.7977 67.3821 29.2445 67.0166 26.9028 66.0365C24.5612 65.0564 22.5088 63.4944 20.9402 61.4985C18.9673 59.1522 17.887 56.1841 17.8902 53.1185V52.2185C17.8902 41.6085 17.8202 30.6385 17.8902 19.8485C17.9967 16.6039 19.195 13.4901 21.2911 11.0111C23.3872 8.53206 26.2584 6.83288 29.4402 6.1885C32.5847 5.44787 35.8832 5.72697 38.8586 6.9854C41.8339 8.24384 44.3316 10.4163 45.9902 13.1885C47.2443 15.3584 47.8999 17.8223 47.8902 20.3285C47.8902 24.1885 47.8902 28.0518 47.8902 31.9185V36.5385Z" fill={colors.accentOrange} />
            <Path d="M65.28 51.2771C65.0692 51.0901 64.8212 50.9498 64.5524 50.8653C64.2835 50.7809 63.9999 50.7542 63.72 50.7871C63.2004 50.8171 62.6796 50.8171 62.16 50.7871C61.8789 50.761 61.5954 50.7947 61.3282 50.8861C61.0611 50.9774 60.8163 51.1243 60.61 51.3171C60.4189 51.5159 60.2735 51.754 60.1837 52.0148C60.0939 52.2755 60.0619 52.5527 60.09 52.8271C60.1086 53.1201 60.1086 53.414 60.09 53.7071V53.9871C59.8072 58.4732 58.4154 62.819 56.0394 66.6348C53.6634 70.4505 50.3775 73.6169 46.4763 75.85C42.5752 78.083 38.1808 79.3129 33.6873 79.4293C29.1937 79.5458 24.7416 78.5451 20.73 76.5171C11.8 71.8071 6.81 64.2171 5.88 53.9571C5.88 53.5571 5.82999 53.1571 5.79999 52.7571L5.67999 50.8371H1.56L0.609985 50.9071L0 52.0471V52.3071C0 52.4571 0 52.6171 0 52.7671C0.134125 60.9058 3.27148 68.7077 8.80908 74.6736C14.3467 80.6394 21.8938 84.3482 30 85.0871C30 89.0871 30 93.0871 30 97.0871C26.54 97.0871 23.0767 97.0871 19.61 97.0871H18.61C18.2745 97.0845 17.9396 97.1147 17.61 97.1771C16.9904 97.3176 16.4353 97.6604 16.0321 98.1514C15.629 98.6425 15.4009 99.2537 15.3837 99.8888C15.3665 100.524 15.5612 101.147 15.9372 101.659C16.3132 102.171 16.8489 102.543 17.46 102.717C17.8555 102.815 18.2626 102.859 18.67 102.847H47.28C47.6956 102.854 48.11 102.8 48.51 102.687C49.1038 102.504 49.6211 102.13 49.9823 101.624C50.3436 101.119 50.529 100.508 50.51 99.8871C50.5038 99.2508 50.2788 98.636 49.8727 98.1461C49.4665 97.6562 48.9041 97.3211 48.28 97.1971C47.9 97.1081 47.5102 97.0678 47.12 97.0771H35.78V94.1571C35.78 91.1571 35.78 88.1571 35.78 85.0771H35.84C36.779 85.001 37.7135 84.8775 38.64 84.7071C50.97 82.2071 59.49 74.9371 63.96 63.0971C65.1514 59.823 65.7802 56.3709 65.82 52.8871C65.8536 52.5955 65.8227 52.3001 65.7294 52.0219C65.636 51.7437 65.4826 51.4894 65.28 51.2771Z" fill={colors.accentOrange} />
        </Svg>
    );
}

// ─── Icono campana del diálogo nativo (40×40, trazo naranja sobre tarjeta blanca) ──
// Misma ruta exacta que IconBell, exportada a mayor escala en Figma (node
// "ICONO NOTIFICACIONES" 2346:2027, dentro del modal "NOTIFICACIONES" 2346:2015).
function IconBellLarge() {
    return (
        <Svg width={62} height={80} viewBox="0 0 144.771 186.111" fill="none">
            <Path d="M128.942 165.409H15.3013C14.622 165.409 13.9494 165.275 13.3221 165.015C12.6948 164.754 12.1251 164.373 11.6457 163.891C11.1663 163.41 10.7865 162.839 10.5283 162.211C10.2701 161.583 10.1384 160.91 10.1408 160.23V80.4954C10.1408 44.6705 37.9736 15.515 72.1777 15.515C106.382 15.515 134.215 44.6705 134.215 80.4954V160.249C134.215 160.936 134.078 161.617 133.811 162.25C133.545 162.883 133.155 163.457 132.664 163.938C132.173 164.419 131.591 164.797 130.951 165.049C130.312 165.302 129.629 165.424 128.942 165.409ZM20.3872 155.089H123.782V80.5699C123.782 50.4457 100.588 25.929 72.0845 25.929C43.5811 25.929 20.3872 50.3712 20.3872 80.4954V155.089Z" fill={colors.accentOrange} />
            <Path d="M139.282 165.412H4.86857C3.55112 165.333 2.31359 164.754 1.40874 163.793C0.503886 162.832 0 161.562 0 160.242C0 158.922 0.503886 157.652 1.40874 156.691C2.31359 155.731 3.55112 155.151 4.86857 155.072H139.282C139.987 155.03 140.693 155.132 141.357 155.373C142.021 155.614 142.629 155.988 143.143 156.472C143.657 156.956 144.067 157.54 144.347 158.189C144.627 158.837 144.771 159.536 144.771 160.242C144.771 160.948 144.627 161.647 144.347 162.296C144.067 162.944 143.657 163.528 143.143 164.012C142.629 164.497 142.021 164.87 141.357 165.111C140.693 165.352 139.987 165.454 139.282 165.412Z" fill={colors.accentOrange} />
            <Path d="M72.0845 186.111C66.5984 186.106 61.3387 183.924 57.4612 180.043C53.5837 176.162 51.4056 170.9 51.4056 165.414C51.3632 164.709 51.4655 164.002 51.7062 163.338C51.9469 162.674 52.3208 162.067 52.805 161.553C53.2892 161.038 53.8735 160.629 54.5219 160.349C55.1702 160.069 55.869 159.924 56.5753 159.924C57.2816 159.924 57.9804 160.069 58.6288 160.349C59.2772 160.629 59.8614 161.038 60.3456 161.553C60.8298 162.067 61.2038 162.674 61.4444 163.338C61.6851 164.002 61.7874 164.709 61.7451 165.414C61.7451 168.156 62.8344 170.786 64.7734 172.725C66.7124 174.664 69.3423 175.753 72.0845 175.753C74.8267 175.753 77.4566 174.664 79.3956 172.725C81.3347 170.786 82.424 168.156 82.424 165.414C82.424 164.729 82.5589 164.05 82.8211 163.418C83.0832 162.785 83.4674 162.21 83.9518 161.725C84.4362 161.241 85.0112 160.857 85.6441 160.594C86.277 160.332 86.9553 160.197 87.6403 160.197C88.3253 160.197 89.0036 160.332 89.6365 160.594C90.2694 160.857 90.8444 161.241 91.3288 161.725C91.8132 162.21 92.1974 162.785 92.4596 163.418C92.7217 164.05 92.8566 164.729 92.8566 165.414C92.8566 168.138 92.3188 170.836 91.274 173.352C90.2292 175.868 88.698 178.153 86.7681 180.076C84.8383 181.998 82.5478 183.521 80.028 184.557C77.5083 185.593 74.8088 186.121 72.0845 186.111Z" fill={colors.accentOrange} />
            <Path d="M72.0839 20.679C70.039 20.679 68.04 20.0726 66.3397 18.9364C64.6393 17.8003 63.3141 16.1855 62.5315 14.2962C61.749 12.4069 61.5442 10.328 61.9432 8.32235C62.3421 6.31668 63.3268 4.47437 64.7728 3.02837C66.2188 1.58236 68.0612 0.597626 70.0668 0.198675C72.0725 -0.200276 74.1514 0.00447992 76.0407 0.78705C77.93 1.56962 79.5448 2.89486 80.6809 4.59517C81.817 6.29549 82.4234 8.29452 82.4234 10.3395C82.4185 13.0802 81.3276 15.7072 79.3896 17.6452C77.4517 19.5831 74.8246 20.674 72.0839 20.679Z" fill={colors.accentOrange} />
        </Svg>
    );
}

// ─── Diálogo de notificaciones (Figma "NOTIFICACIONES" 2346:2015) ──
// Fondo negro de borde a borde + tarjeta modal blanca (confirmado vía API REST:
// frame fill=#000000, MODAL vector fill=#ffffff, texto fill=#412950).
function PermissionCard({ onAllow, onDeny }) {
    return (
        <View style={modal.backdrop}>
            <View style={modal.card}>
                <View style={modal.cardIcon}>
                    <IconBellLarge />
                </View>

                <Text style={modal.cardTitle}>
                    OPOX quiere enviarte notificaciones
                </Text>

                <Text style={modal.cardDesc}>
                    Avisos de cambios en el BOE, recordatorios de racha y de descanso.
                </Text>

                <View style={modal.cardActions}>
                    <TouchableOpacity style={modal.btnAllow} onPress={onAllow} activeOpacity={0.85}>
                        <Text style={modal.btnAllowText}>¡A por más!</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={modal.btnDeny} onPress={onDeny} activeOpacity={0.7}>
                        <Text style={modal.btnDenyText}>No permitir</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ─── Fila de permiso ─────────────────────────────────────────────────────────
function PermissionRow({ icon, title, subtitle, highlighted }) {
    return (
        <View style={[styles.row, highlighted && styles.rowHighlighted]}>
            <View style={styles.rowIcon}>{icon}</View>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowSubtitle}>{subtitle}</Text>
            </View>
        </View>
    );
}

// ─── Lista de permisos (datos exactos del wireframe) ─────────────────────────
const PERMISSIONS = [
    {
        key: 'notifications',
        icon: <IconBell />,
        title: 'Notificaciones',
        subtitle: 'Avisos BOE, racha y descanso',
        highlighted: true,
    },
    {
        key: 'health',
        icon: <IconHealth />,
        title: 'SALUD',
        subtitle: 'Biometría y control de fatiga',
    },
    {
        key: 'camera',
        icon: <IconCamera />,
        title: 'Cámara',
        subtitle: 'Foto-Test y escaneo de apuntes',
    },
    {
        key: 'mic',
        icon: <IconMic />,
        title: 'Micrófono',
        subtitle: 'Modo voz del Tutor IA',
    },
];

// ─── Icono check verde del estado "Todo listo" (Figma fill #3ab375) ──
function IconCheckCircle() {
    return (
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
            <Path
                d="M4.5 12.5l5 5 10-11"
                stroke={colors.statGreen}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// ─────────────────────────────────────────────
// 0.5 · ok — Estado permiso concedido (Figma "PERMISO CONCEDIDO" 2346:2034)
// Fondo negro de borde a borde + tarjeta modal blanca (confirmado vía API REST).
// ─────────────────────────────────────────────
function SuccessState({ onPress }) {
    return (
        <SafeAreaView style={ok.backdrop}>
            <View style={ok.card}>
                <View style={ok.cardIcon}>
                    <IconCheckCircle />
                </View>

                <Text style={ok.cardTitle}>Todo listo</Text>

                <Text style={ok.cardDesc}>
                    Permisos activados. Ya puedes aprovechar Opox al completo.
                </Text>

                <TouchableOpacity
                    style={ok.btnAllow}
                    onPress={onPress}
                    activeOpacity={0.85}
                >
                    <Text style={ok.btnAllowText}>Empezar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const ok = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.white,
        borderRadius: 28,
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    cardIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textDark,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    cardDesc: {
        fontSize: 14,
        color: colors.textDark,
        marginBottom: spacing.xl,
        textAlign: 'center',
        lineHeight: 20,
    },
    btnAllow: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 12,
        paddingVertical: spacing.md,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnAllowText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});

// ─── Icono alerta roja del estado "Función limitada" (Figma fill #ff2638) ─
// Rutas exactas exportadas de Figma (icono de PERMISO DENEGADO 2346:2066).
function IconAlertCircle() {
    return (
        <Svg width={56} height={56} viewBox="0 0 130 130" fill="none">
            <Path d="M64.9 0C52.064 0 39.5163 3.80632 28.8435 10.9376C18.1708 18.0689 9.85238 28.2049 4.94025 40.0638C0.02812 51.9228 -1.25712 64.972 1.24706 77.5614C3.75125 90.1507 9.93237 101.715 19.0088 110.791C28.0852 119.868 39.6493 126.049 52.2387 128.553C64.828 131.057 77.8773 129.772 89.7362 124.86C101.595 119.948 111.731 111.629 118.862 100.957C125.994 90.2838 129.8 77.736 129.8 64.9C129.774 47.6956 122.927 31.2034 110.762 19.038C98.5967 6.8726 82.1045 0.0264481 64.9 0ZM64.9 123C53.4174 122.994 42.1943 119.584 32.6494 113.201C23.1044 106.818 15.6661 97.7483 11.2746 87.1386C6.88315 76.5289 5.7357 64.8554 7.9773 53.5938C10.2189 42.3321 15.7489 31.9877 23.8683 23.8683C31.9878 15.7489 42.3321 10.2189 53.5938 7.97727C64.8555 5.73567 76.5289 6.88312 87.1386 11.2746C97.7483 15.666 106.818 23.1044 113.201 32.6493C119.584 42.1943 122.994 53.4174 123 64.9C122.989 80.3058 116.865 95.0776 105.971 105.971C95.0777 116.865 80.3059 122.989 64.9 123Z" fill={colors.statRed} />
            <Path d="M76.8602 17.0781H53.0002C52.5198 17.0781 52.0449 17.1793 51.6062 17.3751C51.1676 17.5708 50.7751 17.8568 50.4543 18.2144C50.1336 18.5719 49.8917 18.993 49.7446 19.4502C49.5974 19.9075 49.5482 20.3906 49.6002 20.8681L55.6002 75.5181C55.7025 76.3454 56.1035 77.1068 56.7278 77.6593C57.352 78.2117 58.1566 78.5171 58.9902 78.5181H70.9902C71.8249 78.5174 72.6307 78.2123 73.2566 77.6601C73.8825 77.1078 74.2855 76.3463 74.3902 75.5181L80.3902 20.8681C80.442 20.3914 80.3931 19.9092 80.2465 19.4526C80.0999 18.9961 79.859 18.5755 79.5393 18.2181C79.2196 17.8607 78.8284 17.5745 78.3909 17.3781C77.9535 17.1817 77.4797 17.0795 77.0002 17.0781H76.8602ZM67.8602 71.7281H62.0002L56.7602 23.9081H73.0502L67.8602 71.7281Z" fill={colors.statRed} />
            <Path d="M64.9002 85.3984C62.1986 85.3984 59.5575 86.1996 57.3112 87.7006C55.0648 89.2015 53.3139 91.3349 52.28 93.831C51.2462 96.327 50.9756 99.0736 51.5027 101.723C52.0298 104.373 53.3308 106.807 55.2412 108.718C57.1515 110.628 59.5855 111.929 62.2353 112.456C64.8851 112.983 67.6317 112.713 70.1277 111.679C72.6237 110.645 74.7571 108.894 76.2581 106.648C77.7591 104.401 78.5602 101.76 78.5602 99.0584C78.5549 95.4372 77.1141 91.9658 74.5535 89.4052C71.9929 86.8446 68.5215 85.4037 64.9002 85.3984ZM64.9002 105.888C63.5494 105.888 62.2289 105.488 61.1057 104.737C59.9825 103.987 59.1071 102.92 58.5901 101.672C58.0732 100.424 57.9379 99.0509 58.2015 97.726C58.465 96.4011 59.1155 95.1841 60.0707 94.2289C61.0259 93.2737 62.2429 92.6232 63.5678 92.3597C64.8927 92.0961 66.2659 92.2314 67.514 92.7483C68.762 93.2653 69.8287 94.1407 70.5792 95.2639C71.3297 96.3871 71.7302 97.7076 71.7302 99.0584C71.7302 100.87 71.0107 102.607 69.7298 103.888C68.4489 105.169 66.7117 105.888 64.9002 105.888Z" fill={colors.statRed} />
        </Svg>
    );
}

// ─────────────────────────────────────────────
// 0.5 · err — Estado permiso denegado (Figma "PERMISO DENEGADO" 2346:2051)
// Fondo negro de borde a borde + tarjeta modal blanca (confirmado vía API REST).
// ─────────────────────────────────────────────
function DeniedState({ onContinue }) {
    return (
        <SafeAreaView style={err.backdrop}>
            <View style={err.card}>
                <View style={err.cardIcon}>
                    <IconAlertCircle />
                </View>

                <Text style={err.cardTitle}>Función limitada</Text>

                <Text style={err.cardDesc}>
                    Sin notificaciones no podremos avisarte de cambios en el BOE ni de tu racha. Actívalas cuando quieras en Ajustes.
                </Text>

                <TouchableOpacity
                    style={err.btnAllow}
                    onPress={() => Linking.openSettings()}
                    activeOpacity={0.85}
                >
                    <Text style={err.btnAllowText}>Ir a ajustes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={err.btnDeny}
                    onPress={onContinue}
                    activeOpacity={0.7}
                >
                    <Text style={err.btnDenyText}>Continuar igualmente</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const err = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.white,
        borderRadius: 28,
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    cardIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textDark,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    cardDesc: {
        fontSize: 14,
        color: colors.textDark,
        marginBottom: spacing.xl,
        textAlign: 'center',
        lineHeight: 20,
    },
    btnAllow: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 12,
        paddingVertical: spacing.md,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnAllowText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    btnDeny: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnDenyText: {
        color: colors.textDark,
        fontSize: 14,
        fontWeight: '700',
    },
});

// ─────────────────────────────────────────────
// 0.5 — Pantalla principal de permisos
// ─────────────────────────────────────────────
export default function PermissionsScreen({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [status, setStatus] = useState(null); // null | 'granted' | 'denied'

    // Cuando el usuario pulsa "Activar permisos"
    const handleActivate = () => setModalVisible(true);

    // Botón "¡A por más!" — solicita el permiso real al SO
    const handleAllow = async () => {
        setModalVisible(false);

        if (!Notifications) {
            // Expo Go o módulo no disponible — simular concedido para no bloquear el onboarding
            setStatus('granted');
            return;
        }

        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                });
            }
            const { status } = await Notifications.requestPermissionsAsync();
            setStatus(status === 'granted' ? 'granted' : 'denied');
        } catch (_) {
            // Si falla, no bloquear al usuario
            setStatus('granted');
        }
    };

    // Botón "No permitir" — el usuario rechazó la solicitud sin pasar por el diálogo del SO
    const handleDeny = () => {
        setModalVisible(false);
        setStatus('denied');
    };

    // Navegar al siguiente bloque (1 · Acceso)
    const goNext = () => navigation.replace('Entrada');

    // ── Renderizado condicional de estados ──────
    if (status === 'granted') return <SuccessState onPress={goNext} />;
    if (status === 'denied') return <DeniedState onContinue={goNext} />;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Botón volver */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    accessibilityLabel="Volver"
                >
                    <ChevronLeftIcon />
                </TouchableOpacity>
            </View>

            {/* Cuerpo scrollable (scr-scroll) */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                {/* Título */}
                <Text style={styles.title}>Activa lo esencial</Text>

                {/* Subtítulo */}
                <Text style={styles.subtitle}>Puedes cambiarlo luego en Configuración.</Text>

                {/* Lista de permisos */}
                <View style={styles.list}>
                    {PERMISSIONS.map((perm) => (
                        <PermissionRow
                            key={perm.key}
                            icon={perm.icon}
                            title={perm.title}
                            subtitle={perm.subtitle}
                            highlighted={perm.highlighted}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Botón fijo inferior (btn-row: absolute bottom:16 left:18 right:18) */}
            <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleActivate} activeOpacity={0.85}>
                    <Text style={styles.btnPrimaryText}>Activar permisos</Text>
                </TouchableOpacity>
            </View>

            {/* ── 0.5 · pop — Diálogo nativo simulado ── */}
            <Modal
                visible={modalVisible}
                animationType="fade"
                statusBarTranslucent
            >
                <PermissionCard onAllow={handleAllow} onDeny={handleDeny} />
            </Modal>

        </SafeAreaView>
    );
}

// ─── Estilos pantalla principal ──────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // ── Header / botón volver ────────────────────
    header: {
        paddingHorizontal: 18,
        paddingTop: spacing.sm,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F0F2',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Scroll + body (body-area pad scr-scroll) ─
    scroll: {
        flex: 1,
    },
    body: {
        paddingHorizontal: 18,
        paddingTop: spacing.md,
        paddingBottom: 100, // espacio para el botón absoluto
    },

    // ── Título ───────────────────────────────────
    // Figma: 48px sobre un frame de 905px → escala real ~2.2 → 22pt.
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textDark,
        letterSpacing: -0.4,
        textAlign: 'center',
    },

    // ── Subtítulo ────────────────────────────────
    subtitle: {
        fontSize: 13,
        color: colors.textDark,
        marginTop: 8,
        lineHeight: 19,
        textAlign: 'center',
    },

    // ── Lista de filas ──────────────────────────
    list: {
        marginTop: spacing.lg,
        flexDirection: 'column',
        gap: 20,
    },

    // ── Fila individual — tarjetas grandes, fieles a la proporción real
    // de Figma (cada fila ocupa ~267.9px de 1920px de frame → ~122pt).
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 26,
        paddingHorizontal: 18,
        borderWidth: 1.5,
        borderColor: '#E4E8F0',
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
    },

    // ── Icono contenedor ─────────────────────────
    // Figma: icono desnudo, sin caja de fondo. Se conserva el ancho/alto
    // solo para mantener la alineación de columna con el texto.
    rowIcon: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    // ── Variante resaltada de fila (Notificaciones, primera fila) ──
    rowHighlighted: {
        backgroundColor: 'rgba(235, 235, 235, 0.5)',
    },

    // ── Texto contenedor ─────────────────────────
    rowText: {
        flex: 1,
    },

    rowTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textDark,
    },

    rowSubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        opacity: 0.5,
        marginTop: 2,
    },

    // ── Botón fijo inferior (btn-row) ───────────
    // position:absolute; bottom:16; left:18; right:18
    btnRow: {
        position: 'absolute',
        bottom: 16,
        left: 18,
        right: 18,
        flexDirection: 'column',
        gap: 9,
    },

    // btn base
    btnPrimary: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 12,
        paddingVertical: 19,
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

// ─────────────────────────────────────────────
// Estilos diálogo de notificaciones (Figma "NOTIFICACIONES" 2346:2015)
// Fondo negro de borde a borde + tarjeta modal blanca (confirmado vía API REST:
// frame fill=#000000, MODAL vector fill=#ffffff, texto fill=#412950).
// ─────────────────────────────────────────────
const modal = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },

    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.white,
        borderRadius: 28,
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },

    cardIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },

    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textDark,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },

    cardDesc: {
        fontSize: 14,
        color: colors.textDark,
        marginBottom: spacing.xl,
        textAlign: 'center',
        lineHeight: 20,
    },

    cardActions: {
        flexDirection: 'column',
        gap: spacing.sm,
        width: '100%',
    },

    // ── Botón ¡A por más! (pill) ─────
    btnAllow: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 12,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    btnAllowText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },

    // ── Botón No permitir (texto simple) ───
    btnDeny: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    btnDenyText: {
        color: colors.textDark,
        fontSize: 14,
        fontWeight: '700',
    },
});
