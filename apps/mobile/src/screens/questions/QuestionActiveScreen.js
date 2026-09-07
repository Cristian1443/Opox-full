import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Vibration,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// Iconos exactos exportados de Figma para la barra inferior de herramientas
// (antes Ionicons genéricos: star/star-outline, warning-outline,
// bookmark-outline, bulb-outline, library-outline).
function IconStar({ size = 14, filled = true }) {
  return filled ? (
    <Svg width={size} height={(size * 49) / 51} viewBox="0 0 51 49" fill="none">
      <Path d="M26.8465 1.07632L32.1165 17.5663H49.6365C49.9923 17.5687 50.3334 17.7083 50.5887 17.9561C50.8439 18.204 50.9936 18.5408 51.0065 18.8963C51.0069 19.1343 50.9454 19.3682 50.8279 19.5751C50.7104 19.782 50.541 19.9548 50.3365 20.0763L36.2765 30.1863L41.7265 46.8463C41.8196 47.1301 41.8174 47.4366 41.7202 47.719C41.6231 48.0014 41.4363 48.2443 41.1883 48.4108C40.9403 48.5772 40.6447 48.6581 40.3465 48.641C40.0483 48.624 39.7639 48.51 39.5365 48.3163L25.5365 38.0463L11.3965 48.3763C11.1589 48.5483 10.8723 48.6395 10.579 48.6364C10.2857 48.6333 10.0011 48.5362 9.76714 48.3593C9.53315 48.1824 9.36212 47.9351 9.2792 47.6537C9.19628 47.3724 9.20585 47.0718 9.30652 46.7963L14.7665 30.2863L0.576517 19.9963C0.330123 19.8213 0.148537 19.5696 0.06004 19.2806C-0.0284574 18.9916 -0.0188981 18.6815 0.0872291 18.3985C0.193356 18.1155 0.390094 17.8755 0.6468 17.7159C0.903506 17.5564 1.20577 17.4862 1.50652 17.5163L18.8265 17.6063L24.2065 0.996324C24.2556 0.8195 24.3399 0.654436 24.4545 0.51107C24.569 0.367705 24.7114 0.249004 24.873 0.162115C25.0347 0.0752259 25.2122 0.0219461 25.395 0.00548373C25.5778 -0.0109787 25.762 0.00971689 25.9365 0.0663242C26.1627 0.138287 26.366 0.268623 26.5257 0.444191C26.6855 0.619759 26.7961 0.83435 26.8465 1.06632V1.07632Z" fill={colors.accentOrange} />
    </Svg>
  ) : (
    <Svg width={size} height={(size * 49) / 52} viewBox="0 0 52 49" fill="none">
      <Path d="M26.8465 1.03078L32.1165 17.5208H49.6365C50.0008 17.5208 50.3503 17.6648 50.6088 17.9214C50.8673 18.1781 51.0139 18.5265 51.0165 18.8908C51.0169 19.1287 50.9554 19.3627 50.8379 19.5696C50.7204 19.7765 50.5511 19.9492 50.3465 20.0708L36.2465 30.1408L41.6965 46.8008C41.7896 47.0846 41.7874 47.391 41.6902 47.6734C41.593 47.9558 41.4063 48.1988 41.1583 48.3652C40.9103 48.5317 40.6147 48.6125 40.3165 48.5955C40.0183 48.5784 39.7339 48.4644 39.5065 48.2708L25.5065 38.0008L11.3965 48.3308C11.1591 48.5071 10.8711 48.6019 10.5754 48.601C10.2797 48.6001 9.99222 48.5035 9.75593 48.3257C9.51964 48.148 9.34722 47.8985 9.26442 47.6146C9.18161 47.3308 9.19287 47.0277 9.29652 46.7508L14.7565 30.2408L0.576519 19.9508C0.330125 19.7757 0.148537 19.5241 0.0600391 19.2351C-0.0284582 18.9461 -0.0188969 18.6359 0.0872303 18.3529C0.193357 18.0699 0.390094 17.83 0.646801 17.6704C0.903507 17.5108 1.20577 17.4407 1.50652 17.4708L18.8165 17.5608L24.2465 0.95078C24.3009 0.77845 24.3891 0.618684 24.5059 0.480815C24.6227 0.342947 24.7658 0.229741 24.9269 0.147812C25.088 0.0658834 25.2637 0.0168741 25.444 0.00364787C25.6242 -0.00957841 25.8052 0.0132435 25.9765 0.0707803C26.2027 0.142743 26.406 0.273079 26.5657 0.448647C26.7255 0.624215 26.8361 0.838806 26.8865 1.07078L26.8465 1.03078Z" fill="none" stroke={colors.grayMid} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

function IconWarningTriangle({ size = 22, color = colors.textDark }) {
  return (
    <Svg width={size} height={(size * 44) / 47} viewBox="0 0 47 44" fill="none">
      <Path d="M45.3651 42.7746H1.2251L23.2951 1.22461L45.3651 42.7746Z" stroke={color} strokeWidth={2.45} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M23.2949 14.6445V29.3545" stroke={color} strokeWidth={2.45} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M23.2949 36.7146V34.2646" stroke={color} strokeWidth={2.45} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconBookmark({ size = 22, color = colors.textDark, filled = false }) {
  return (
    <Svg width={(size * 42) / 44} height={size} viewBox="0 0 42 44" fill="none">
      <Path
        d="M37.5699 42.0004L20.6399 28.0004L3.63989 42.0004C3.41775 42.1845 3.14778 42.3016 2.86154 42.338C2.57531 42.3744 2.28465 42.3286 2.0235 42.2058C1.76235 42.0831 1.54151 41.8886 1.38681 41.6451C1.23211 41.4015 1.14995 41.1189 1.1499 40.8304V4.53041C1.1499 4.0857 1.23766 3.64536 1.40814 3.23462C1.57863 2.82389 1.82848 2.45084 2.1434 2.13684C2.45832 1.82285 2.83211 1.57409 3.24335 1.40482C3.65458 1.23555 4.09521 1.14909 4.53992 1.15041H36.6599C37.5563 1.15041 38.4161 1.50651 39.0499 2.14038C39.6838 2.77426 40.0399 3.63397 40.0399 4.53041V40.8304C40.0368 41.1154 39.9537 41.3937 39.8 41.6337C39.6463 41.8737 39.4282 42.0656 39.1707 42.1876C38.9131 42.3096 38.6265 42.3567 38.3434 42.3236C38.0604 42.2905 37.7924 42.1785 37.5699 42.0004Z"
        stroke={color}
        strokeWidth={2.3}
        strokeMiterlimit={10}
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}

function IconHintMark({ size = 22, color = colors.textDark }) {
  return (
    <Svg width={(size * 31) / 47} height={size} viewBox="0 0 31 47" fill="none">
      <Path d="M11.6039 47C9.50214 47 7.74585 46.3677 6.38623 45.1175C5.71658 44.52 5.18443 43.7876 4.82571 42.9695C4.46699 42.1515 4.29005 41.267 4.30683 40.3756C4.29013 39.4733 4.46676 38.5777 4.82514 37.7477C5.18352 36.9176 5.71553 36.1719 6.38623 35.5594C7.74745 34.2854 9.50534 33.6389 11.6119 33.6389C13.677 33.6389 15.4141 34.2854 16.7753 35.5594C17.4462 36.1717 17.9784 36.9174 18.3368 37.7475C18.6952 38.5776 18.8717 39.4733 18.8547 40.3756C18.8713 41.2669 18.6944 42.1515 18.3356 42.9695C17.9769 43.7875 17.4448 44.52 16.7753 45.1175C15.3997 46.3662 13.6658 47 11.6039 47ZM11.6039 35.885C10.0764 35.885 8.88472 36.3134 7.93779 37.1922C7.4921 37.5963 7.13926 38.0901 6.90306 38.6403C6.66687 39.1905 6.55281 39.7844 6.56858 40.3819C6.55512 40.9644 6.66988 41.5428 6.9049 42.0772C7.13993 42.6116 7.48962 43.0891 7.92979 43.4768C8.87033 44.3398 10.0716 44.7602 11.6087 44.7602C13.0995 44.7602 14.28 44.3398 15.2205 43.4768C15.661 43.0893 16.011 42.6118 16.2463 42.0774C16.4816 41.543 16.5966 40.9645 16.5833 40.3819C16.5989 39.7843 16.4846 39.1903 16.2481 38.6401C16.0116 38.0898 15.6585 37.5961 15.2125 37.1922C14.2688 36.3134 13.0899 35.8803 11.6039 35.8803V35.885ZM17.0792 31.4593H5.84399L5.47929 18.1045H10.2779C13.2003 18.1045 15.43 17.7584 16.9016 17.0755C18.1285 16.5065 18.6995 15.5186 18.6995 13.9649C18.6995 12.8584 18.426 12.0365 17.8614 11.4501C17.2967 10.8637 16.5337 10.6029 15.478 10.6029C14.336 10.6029 13.493 10.8937 12.9028 11.4912C12.3125 12.0886 12.0166 12.9248 12.0166 14.0202V15.1408H0.0440464L0.00885645 14.0676C-0.0791184 11.4406 0.488719 9.03171 1.69477 6.90735C2.90083 4.78298 4.73391 3.06484 7.11723 1.83195C9.46695 0.616445 12.3157 0 15.5948 0C20.1695 0 23.9124 1.21866 26.71 3.62122C29.5572 6.06487 31 9.52645 31 13.9095C31 17.9797 29.6148 21.2105 26.8828 23.515C24.4275 25.5872 21.2348 26.7395 17.3831 26.9481L17.0792 31.4593ZM8.04976 29.2227H14.9582L15.2589 24.7511L16.3098 24.74C20.0879 24.7036 23.151 23.7189 25.4112 21.8111C27.6506 19.927 28.7334 17.3411 28.7334 13.908C28.7334 10.1492 27.585 7.33728 25.2225 5.31091C22.8599 3.28455 19.6065 2.23975 15.5948 2.23975C12.69 2.23975 10.1899 2.77084 8.16813 3.82038C6.17829 4.84305 4.66673 6.25139 3.67821 8.00272C2.83382 9.50629 2.35775 11.1845 2.28821 12.9027H9.82685C9.97664 11.7842 10.4844 10.7425 11.276 9.92951C12.2997 8.89262 13.7121 8.36627 15.4732 8.36627C17.1608 8.36627 18.5124 8.8863 19.5009 9.91054C20.4894 10.9348 20.9613 12.2815 20.9613 13.968C20.9613 16.3895 19.8896 18.1662 17.8598 19.1066C16.0587 19.9412 13.5778 20.3474 10.2731 20.3474H7.80823L8.04976 29.2227Z" fill={color} />
    </Svg>
  );
}

function IconGavelLaw({ size = 22, color = colors.textDark }) {
  return (
    <Svg width={(size * 50) / 44} height={size} viewBox="0 0 50 44" fill="none">
      <Path d="M47.7069 32.5931C43.4918 28.9912 39.2423 25.4159 35.0158 21.8215C32.8642 19.9903 30.726 18.1438 28.1491 15.9334C29.4462 15.1751 30.3352 14.3258 31.3659 14.0926C34.2398 13.4386 35.3204 11.9125 34.4736 9.09168C34.1738 8.11191 33.7434 7.17603 33.1937 6.30874C31.3085 3.32486 28.7296 1.16183 25.2445 0.221541C22.66 -0.476089 20.4241 0.505901 20.2631 2.71633C20.1233 4.61206 19.081 5.7078 17.9334 6.90211C15.8776 9.04239 13.8735 11.2282 11.7775 13.3249C11.2463 13.8404 10.5755 14.1927 9.84622 14.3391C7.18499 14.8073 6.00095 16.3827 6.52783 18.9571C7.41107 23.2642 12.6588 27.9618 17.0501 28.3694C19.2803 28.576 20.7268 27.3362 21.1636 25.2073C21.4012 24.0395 22.0967 22.9628 22.5871 21.8443H23.3535C23.8861 22.485 24.3766 23.1713 24.961 23.7609C30.2451 29.141 35.5407 34.5122 40.8479 39.8746C43.3118 42.3561 46.6761 42.468 48.7319 40.2026C50.7436 37.9959 50.3317 34.8377 47.7069 32.5931ZM25.0664 2.29547C28.7564 3.62249 31.4732 6.04524 32.6304 9.89927C33.0443 11.2775 32.4389 11.9694 30.7279 12.1059C30.4118 11.9353 29.7872 11.7268 29.3427 11.3324C27.2352 9.43671 25.0894 7.58457 23.1581 5.5296C22.5527 4.88694 22.5833 3.66799 22.3132 2.71254C23.2386 2.55329 24.3019 2.02059 25.0664 2.29547ZM18.8089 25.6547C18.7285 26.068 17.918 26.3429 17.7111 26.4888C13.931 26.3656 8.83269 21.7097 8.47441 18.3144C8.42077 17.7931 8.75222 16.8547 9.10476 16.7486C9.81556 16.5324 10.9306 16.4452 11.4039 16.849C13.8563 18.9211 16.2167 21.1106 18.4698 23.395C18.9239 23.8519 18.9488 24.9305 18.8089 25.6547ZM20.1022 22.085L12.676 15.2187L21.0487 6.40164L28.4863 13.2813L20.1022 22.085ZM46.952 38.6595C45.5975 40.1021 43.7562 39.9865 42.0262 38.2424C37.5199 33.7154 33.0749 29.1296 28.538 24.6329C27.1739 23.2832 25.5875 22.1514 23.9934 20.8282L27.0417 17.668C28.1797 18.6159 29.2661 19.4974 30.3352 20.4035C35.3587 24.6614 40.381 28.9223 45.402 33.1865C45.6473 33.395 45.8983 33.5997 46.1397 33.814C47.9387 35.4159 48.251 37.2775 46.952 38.6595Z" fill={color} />
      <Path d="M19.3515 36.3317C18.5162 35.8824 18.0678 34.5933 16.696 34.6065C12.6726 34.6464 8.64913 34.6065 4.62568 34.6634C4.07964 34.6634 3.35159 34.798 3.02397 35.1544C1.40501 36.9174 -0.486017 38.4833 0.113669 41.4331C0.458536 43.1184 0.94135 44.0227 2.74807 43.9999C5.40738 43.9658 8.06669 43.9999 10.726 43.9999C13.4505 43.9999 16.1749 43.9866 18.8994 43.9999C20.5011 44.0113 21.3537 43.289 21.277 41.6738C21.1851 39.7269 21.8422 37.6701 19.3515 36.3317ZM19.2136 42.0397H2.1982V39.5108L5.02803 36.6539H16.4987L19.2155 39.4634L19.2136 42.0397Z" fill={color} />
    </Svg>
  );
}

// Engranaje exacto — mismo patrón que TrainingHomeScreen/GeneratorConfigScreen
// (círculo morado @10% + Feather chevron-left para volver, engranaje suelto sin
// círculo para ajustes). Reemplaza el icono de pausa del header.
function IconGear({ size = 22, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="740 0 52 55" fill="none">
      <Path d="M789.75 31.0005V23.9205L783.54 23.4005C783.118 21.1364 782.288 18.9678 781.09 17.0005L785.24 12.0005L780.3 7.00055L775.55 11.0705C773.663 9.7728 771.555 8.83066 769.33 8.29055L768.8 1.81055H761.8L761.28 8.09055C759.053 8.5372 756.925 9.38425 755 10.5905L750.1 6.39055L745.16 11.3905L749.16 16.2005C747.871 18.1175 746.939 20.2519 746.41 22.5005L740 23.0005V30.0705L746.21 30.5905C746.63 32.86 747.457 35.0349 748.65 37.0105L744.51 42.0105L749.44 47.0105L754.2 42.9405C756.082 44.2404 758.187 45.1827 760.41 45.7205L761 52.2005H768L768.52 45.9205C770.764 45.4889 772.91 44.6483 774.85 43.4405L779.75 47.6405L784.69 42.6405L780.69 37.8305C781.979 35.9136 782.911 33.7792 783.44 31.5305L789.75 31.0005Z" stroke={color} strokeWidth={3.38} />
      <Path d="M772.62 27.0004C772.6 28.5288 772.129 30.0172 771.266 31.2785C770.402 32.5397 769.185 33.5175 767.767 34.0888C766.349 34.66 764.794 34.7993 763.298 34.4891C761.801 34.1789 760.429 33.433 759.356 32.3452C758.282 31.2575 757.553 29.8765 757.262 28.3759C756.971 26.8754 757.131 25.3223 757.72 23.912C758.309 22.5016 759.303 21.2971 760.575 20.4499C761.847 19.6026 763.341 19.1505 764.87 19.1504C765.894 19.1569 766.907 19.3652 767.851 19.7632C768.795 20.1613 769.651 20.7413 770.371 21.4703C771.09 22.1992 771.659 23.0628 772.045 24.0116C772.431 24.9605 772.627 25.9761 772.62 27.0004Z" stroke={color} strokeWidth={3.38} />
    </Svg>
  );
}

// Check/X de trazo grueso sin chip circular — feedback de respuesta correcta/incorrecta.
function IconFeedbackCheck({ size = 22, color = colors.statGreen }) {
  return (
    <Svg width={size} height={(size * 70) / 107} viewBox="0 0 107 70" fill="none">
      <Path d="M8 34L40 62L99 8" stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconFeedbackCross({ size = 22, color = colors.statRed }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 70 70" fill="none">
      <Path d="M9 9L61 61" stroke={color} strokeWidth={9} strokeLinecap="round" />
      <Path d="M61 9L9 61" stroke={color} strokeWidth={9} strokeLinecap="round" />
    </Svg>
  );
}

// Icono exacto del cronómetro de la barra navy — círculo + manecilla, reemplaza
// el "time-outline" genérico de Ionicons.
function IconTimerClock({ size = 14, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Path d="M22 44.0001C9.86624 44.0001 -0.0201553 34.1084 3.08573e-05 21.9862C0.020217 9.83709 9.91719 -0.0421659 22.026 0.00013534C34.1771 0.0424366 43.9799 9.85055 44 21.9862C44.0202 34.1218 34.1377 44.0001 22 44.0001ZM40.5713 22.0256C40.6049 11.7762 32.3171 3.47076 22.026 3.42846C11.783 3.39192 3.46051 11.6907 3.42975 21.9737C3.39803 32.2202 11.6888 40.5334 21.975 40.5709C32.2152 40.6093 40.5376 32.3096 40.5713 22.0256Z" fill={color} />
      <Path d="M19.7246 8.09863H24.3136V8.74853C24.3136 12.6441 24.3204 16.5358 24.304 20.4342C24.2962 20.629 24.3315 20.8232 24.4073 21.0028C24.483 21.1824 24.5974 21.3431 24.7423 21.4735C27.3281 24.0372 29.9052 26.6099 32.4736 29.1916C32.612 29.331 32.7447 29.48 32.8533 29.5905L29.5937 32.8516C29.5236 32.7872 29.4015 32.6853 29.2871 32.5728C26.1861 29.4707 23.0884 26.3683 19.9938 23.2655C19.8448 23.1146 19.7054 22.8714 19.7054 22.6714C19.6907 17.8702 19.6884 13.0693 19.6987 8.2688C19.7038 8.21159 19.7125 8.15476 19.7246 8.09863Z" fill={color} />
    </Svg>
  );
}
import AbandonTestModal from '../../components/AbandonTestModal';
import TimeUpModal from '../../components/TimeUpModal';
import ToastNotification from '../../components/ToastNotification';
import HintBottomSheet from '../../components/HintBottomSheet';
import LawReferenceBottomSheet from '../../components/LawReferenceBottomSheet';
import ReportQuestionModal from '../../components/ReportQuestionModal';
import PauseSessionModal from '../../components/PauseSessionModal';
import { trainingApi } from '../../api';

// Datos mock para desarrollo — se reemplazarán con route.params.questions
const MOCK_QUESTIONS = [
  {
    id: 'q1',
    difficulty: 2,
    law: 'Ley 39/2015',
    title: 'Según el artículo 159 de la Constitución Española, ¿cómo se compone el Tribunal Constitucional?',
    options: [
      { id: 'A', text: 'Se compone de 12 miembros nombrados por el Rey; de ellos, cuatro a propuesta del Congreso, cuatro a propuesta del Senado, dos a propuesta del Gobierno y dos a propuesta del Consejo General del Poder Judicial.', correct: true },
      { id: 'B', text: 'Se compone de 10 miembros nombrados por el Rey; cuatro a propuesta del Congreso, cuatro del Senado y dos del Gobierno.', correct: false },
      { id: 'C', text: 'Se compone de 12 miembros nombrados por el Presidente del Gobierno, a propuesta de las Cortes Generales y el Consejo General del Poder Judicial.', correct: false },
      { id: 'D', text: 'Se compone de 12 miembros; seis a propuesta del Congreso y seis a propuesta del Senado, por mayoría absoluta de sus miembros.', correct: false },
    ],
    explanation: 'El plazo general son 3 meses (art. 21). Solo se amplía si lo fija una norma con rango de ley.',
    explanationWrong: 'La correcta es la A. Confundiste el plazo general (3 meses) con el límite máximo que no se puede exceder (6 meses).',
    articleRef: {
      article: 'Artículo 21',
      title: 'Obligación de responder',
      text: '"El plazo máximo en el que debe notificarse la resolución expresa será el fijado por la norma reguladora del correspondiente procedimiento. Este plazo no podrá exceder de seis meses salvo que una norma con rango de Ley establezca uno mayor…"',
      boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565',
    },
  },
];

const TIMER_WARNING = 30;
const TIMER_DANGER = 10;
const MAX_HINTS = 3;

export default function QuestionActiveScreen({ navigation, route }) {
  const {
    questions = MOCK_QUESTIONS,
    startIndex = 0,
    // Sources soportados: 'generator' | 'official' | 'surgical' | 'notes' (Bloque 9).
    // El runner es agnóstico al source; solo lo propaga a TrainingResult y usa
    // examTitle para el subtítulo del header.
    source = 'generator',
    timedMode = true,
    secondsPerQuestion = 60,
    examTitle = 'Examen oficial 2021',
    challengeId = null,
    clanId = null,
    taskId = null,
  } = route?.params ?? {};

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(secondsPerQuestion);
  const [answers, setAnswers] = useState([]);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHintSheet, setShowHintSheet] = useState(false);
  const [showLawSheet, setShowLawSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState('');
  const [isHintLoading, setIsHintLoading] = useState(false);

  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(Date.now());
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef(null);

  const question = questions[currentIndex];
  const total = questions.length;
  const progress = total > 0 ? (currentIndex + 1) / total : 0;

  useEffect(() => {
    setTimeLeft(secondsPerQuestion);
    questionStartTimeRef.current = Date.now();
  }, [currentIndex, secondsPerQuestion]);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  useEffect(() => {
    if (!timedMode || isSubmitted || isPaused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIndex, isSubmitted, timedMode, isPaused]);

  useEffect(() => {
    const shouldPulse = timedMode && !isSubmitted && timeLeft <= TIMER_DANGER && timeLeft > 0;
    if (shouldPulse) {
      if (!pulseRef.current) {
        pulseRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(timerPulseAnim, { toValue: 1.06, duration: 450, useNativeDriver: true }),
            Animated.timing(timerPulseAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
          ])
        );
        pulseRef.current.start();
      }
    } else {
      if (pulseRef.current) {
        pulseRef.current.stop();
        pulseRef.current = null;
      }
      timerPulseAnim.setValue(1);
    }
  }, [timeLeft, isSubmitted, timedMode]);

  useEffect(() => {
    if (!timedMode) return;
    if (timeLeft === TIMER_WARNING) {
      AccessibilityInfo.announceForAccessibility(`Atención: quedan ${TIMER_WARNING} segundos.`);
    } else if (timeLeft === TIMER_DANGER) {
      AccessibilityInfo.announceForAccessibility(`¡Urgente! Quedan ${TIMER_DANGER} segundos.`);
    }
  }, [timeLeft, timedMode]);

  const animateFeedback = useCallback(() => {
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [feedbackAnim]);

  const handleTimeout = useCallback(() => {
    setAnswers(prev => [...prev, { questionId: question?.id, selected: null, isCorrect: false, timeSecs: secondsPerQuestion }]);
    setShowTimeUpModal(true);
  }, [question, secondsPerQuestion]);

  const handleSelectOption = (id) => {
    if (isSubmitted) return;
    Vibration.vibrate(10);
    setSelectedOption(id);
  };

  const handleConfirm = () => {
    if (!selectedOption) return;
    clearInterval(timerRef.current);
    const timeSecs = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    const selected = question.options.find(o => o.id === selectedOption);
    const isCorrect = selected?.correct ?? false;
    if (!isCorrect) Vibration.vibrate(80);
    setIsSubmitted(true);
    setAnswers(prev => [...prev, { questionId: question.id, selected: selectedOption, isCorrect, timeSecs }]);
    animateFeedback();
  };

  const handleNext = () => {
    const isLast = currentIndex + 1 >= total;
    if (isLast) {
      navigation.replace('TrainingResult', { source, answers, questions, elapsedSeconds, challengeId, clanId, taskId });
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsBookmarked(false);
    setIsReported(false);
    feedbackAnim.setValue(0);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  if (!question) return null;

  const isCorrectAnswer =
    isSubmitted && question.options.find(o => o.id === selectedOption)?.correct === true;
  const isTimeOut = isSubmitted && selectedOption === null;
  const isLastQuestion = currentIndex + 1 >= total;
  const hintsRemaining = MAX_HINTS - hintsUsed;
  const isHintDisabled = isSubmitted || hintsRemaining <= 0;

  // Cuando el usuario ha respondido, se ocultan las opciones incorrectas no elegidas.
  // Correcta se muestra en verde, elegida (si fue mal) en rojo — mockup.
  const visibleOptions = question.options.filter((opt) => {
    if (!isSubmitted) return true;
    if (opt.correct) return true;
    if (opt.id === selectedOption) return true;
    return false;
  });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>

      {/* ── HEADER BLANCO ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowAbandonModal(true)}
          accessibilityLabel="Salir de la sesión"
        >
          <Feather name="chevron-left" size={22} color={colors.textDark} />
        </TouchableOpacity>

        <View style={styles.topHeaderTexts}>
          <Text style={styles.topHeaderTitle}>Zona de entrenamiento</Text>
          {examTitle ? (
            <Text style={styles.topHeaderSub}>{examTitle}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => { setIsPaused(true); setShowPauseModal(true); }}
          accessibilityLabel="Pausar sesión"
        >
          <IconGear size={20} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* ── BARRA NAVY DE PROGRESO ── */}
      <View style={styles.progressBar}>
        <View style={styles.progressRow}>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={currentIndex === 0}
            onPress={() => {
              if (currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
                setSelectedOption(null);
                setIsSubmitted(false);
                feedbackAnim.setValue(0);
              }
            }}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={currentIndex === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)'}
            />
          </TouchableOpacity>

          <Text style={styles.progressLabel}>Pregunta {currentIndex + 1} de {total}</Text>

          <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.25)" />
        </View>

        <View style={styles.progressTrackRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          {timedMode && (
            <TouchableOpacity
              activeOpacity={0.7}
              onLongPress={() => {
                // Dev: long-press en el timer fuerza el "tiempo agotado" para poder
                // ver el TimeUpModal sin tener que esperar los 60 s reales.
                setTimeLeft(0);
                clearInterval(timerRef.current);
                handleTimeout();
              }}
              delayLongPress={600}
            >
              <Animated.View
                style={[styles.timerArea, { transform: [{ scale: timerPulseAnim }] }]}
              >
                <IconTimerClock
                  size={14}
                  color={timeLeft <= TIMER_DANGER ? colors.statRed : '#FFFFFF'}
                />
                <Text style={[
                  styles.timerText,
                  timeLeft <= TIMER_DANGER && { color: colors.statRed },
                ]}>
                  {formatTime(timeLeft)}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── CONTENIDO ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
        <Text style={styles.questionText}>{question.title}</Text>

        <View style={styles.optionsList}>
          {visibleOptions.map(option => {
            const isSelected = selectedOption === option.id;
            let bg = colors.card;
            let border = '#E4E8F0';
            let borderW = 1.5;
            let textColor = colors.textDark;

            if (!isSubmitted) {
              if (isSelected) {
                border = colors.selectionBorder;
                borderW = 2;
              }
            } else if (option.correct) {
              bg = '#DCFCE7';
              border = colors.statGreen;
              borderW = 1.5;
            } else if (isSelected) {
              bg = '#FCA5A5';
              border = colors.statRed;
              borderW = 1.5;
            }

            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleSelectOption(option.id)}
                disabled={isSubmitted}
                activeOpacity={0.75}
                style={[
                  styles.optionCard,
                  { backgroundColor: bg, borderColor: border, borderWidth: borderW },
                ]}
                accessibilityLabel={`Opción ${option.id}: ${option.text}`}
              >
                <Text style={[styles.optionLetter, { color: textColor }]}>{option.id}.</Text>
                <Text style={[styles.optionText, { color: textColor }]}>{option.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── FEEDBACK ── */}
        {isSubmitted && (
          <Animated.View
            style={[
              styles.feedbackCard,
              isCorrectAnswer ? styles.feedbackCardOk : styles.feedbackCardErr,
              {
                opacity: feedbackAnim,
                transform: [{
                  translateY: feedbackAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.feedbackHeader}>
              {isCorrectAnswer ? (
                <IconFeedbackCheck size={22} color={colors.statGreen} />
              ) : (
                <IconFeedbackCross size={22} color={colors.statRed} />
              )}
              <Text style={[
                styles.feedbackTitle,
                { color: isCorrectAnswer ? colors.statGreen : colors.statRed },
              ]}>
                {isTimeOut ? 'Tiempo agotado' : isCorrectAnswer ? '¡Correcto!' : 'Incorrecto'}
              </Text>
            </View>

            <Text style={styles.feedbackBody}>
              {isCorrectAnswer ? question.explanation : question.explanationWrong}
            </Text>

            {!isCorrectAnswer && !isTimeOut && (
              <Text style={styles.errorLabLink}>
                + Esta pregunta irá a tu Laboratorio de Errores
              </Text>
            )}
          </Animated.View>
        )}

        <View style={{ height: spacing.md }} />

        {/* ── CTA PRINCIPAL ── */}
        {!isSubmitted ? (
          <TouchableOpacity
            style={[styles.mainBtn, !selectedOption && styles.mainBtnDisabled]}
            onPress={handleConfirm}
            disabled={!selectedOption}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>Confirmar respuesta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>
              {isLastQuestion ? 'Ver resultados' : 'Siguiente pregunta'}
            </Text>
          </TouchableOpacity>
        )}
        </View>

        {/* ── TOOLBAR INFERIOR ── */}
        <View style={styles.toolbar}>
          <View style={styles.toolsRow}>
            <View style={styles.toolItem}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <IconStar key={i} size={14} filled={i <= (question.difficulty ?? 3)} />
                ))}
              </View>
              <Text style={styles.toolLabel}>Evalúa esta pregunta</Text>
            </View>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => setShowReportModal(true)}
              accessibilityLabel="Reportar pregunta"
            >
              <IconWarningTriangle size={22} color={isReported ? colors.statRed : colors.textDark} />
              <Text style={[styles.toolLabel, isReported && { color: colors.statRed }]}>
                {isReported ? 'Reportado' : 'Reportar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => {
                const next = !isBookmarked;
                setIsBookmarked(next);
                setToast({
                  message: next ? 'Pregunta guardada' : 'Guardado eliminado',
                  type: 'success',
                });
              }}
              accessibilityLabel={isBookmarked ? 'Quitar de guardados' : 'Guardar pregunta'}
            >
              <IconBookmark
                size={22}
                filled={isBookmarked}
                color={isBookmarked ? colors.purple : colors.textDark}
              />
              <Text style={[styles.toolLabel, isBookmarked && { color: colors.purple }]}>
                Guardar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolItem, isHintDisabled && styles.toolItemDisabled]}
              onPress={async () => {
                if (isHintDisabled) return;
                setHintsUsed(prev => prev + 1);
                setHintText('');
                setIsHintLoading(true);
                setShowHintSheet(true);
                try {
                  const res = await trainingApi.generateHint({
                    questionId: question.id,
                    questionText: question.title,
                    options: question.options.map(o => o.text),
                    topicId: question.topicId ?? 'all',
                    topic: question.law ?? 'Derecho Administrativo',
                    oposicion: route?.params?.oposicion ?? 'justicia-tramitacion',
                  });
                  setHintText(res?.data?.hint ?? '');
                } catch (_err) {
                  setHintText('No se pudo obtener la pista. Inténtalo de nuevo.');
                } finally {
                  setIsHintLoading(false);
                }
              }}
              accessibilityLabel={
                isSubmitted ? 'Pista no disponible tras responder' :
                hintsRemaining <= 0 ? 'Has agotado las pistas' :
                `Pedir pista a la IA — ${hintsRemaining} restantes`
              }
            >
              <IconHintMark
                size={22}
                color={isHintDisabled ? colors.gray : colors.purple}
              />
              <Text style={[
                styles.toolLabel,
                { color: isHintDisabled ? colors.gray : colors.purple, fontWeight: '700' },
              ]}>
                Pista IA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => setShowLawSheet(true)}
              accessibilityLabel="Ver ley relacionada"
            >
              <IconGavelLaw size={22} color={colors.textDark} />
              <Text style={styles.toolLabel}>Ley</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── MODALES ── */}
      <AbandonTestModal
        visible={showAbandonModal}
        currentIndex={currentIndex}
        total={total}
        onStay={() => setShowAbandonModal(false)}
        onConfirmExit={() => {
          setShowAbandonModal(false);
          navigation.goBack();
        }}
      />

      <TimeUpModal
        visible={showTimeUpModal}
        onContinue={() => {
          setShowTimeUpModal(false);
          navigation.replace('TrainingResult', { source, answers, questions, elapsedSeconds, challengeId, clanId, taskId });
        }}
      />

      <ReportQuestionModal
        visible={showReportModal}
        questionId={question?.id}
        onClose={() => setShowReportModal(false)}
        onSendReport={() => {
          setIsReported(true);
          setToast({ message: 'Enviado. Gracias por reportarlo.', type: 'info' });
        }}
      />

      <LawReferenceBottomSheet
        visible={showLawSheet}
        law={question?.law}
        article={question?.articleRef?.article}
        articleTitle={question?.articleRef?.title}
        articleText={question?.articleRef?.text}
        boeUrl={question?.articleRef?.boeUrl}
        onClose={() => setShowLawSheet(false)}
      />

      <HintBottomSheet
        visible={showHintSheet}
        questionSummary={question?.title}
        hint={hintText}
        isLoading={isHintLoading}
        onClose={() => setShowHintSheet(false)}
      />

      <PauseSessionModal
        visible={showPauseModal}
        currentIndex={currentIndex}
        total={total}
        correctAnswers={answers.filter(a => a.isCorrect).length}
        elapsedSeconds={elapsedSeconds}
        onResume={() => {
          setShowPauseModal(false);
          setIsPaused(false);
        }}
        onExitAndSave={() => {
          setShowPauseModal(false);
          setIsPaused(false);
          navigation.goBack();
        }}
      />

      <ToastNotification
        visible={!!toast}
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.card,
  },

  // ── Header blanco superior ─────────────
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(65, 41, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTexts: {
    flex: 1,
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: colors.textDark,
  },
  topHeaderSub: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ── Barra morada de progreso ─────────────
  progressBar: {
    backgroundColor: colors.textDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
  progressTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(246,150,36,0.15)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentOrange,
    borderRadius: 5,
  },
  timerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  // ── Scroll ─────────────────────────────
  scroll: { flex: 1, backgroundColor: colors.card },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  // ── Enunciado ──────────────────────────
  questionText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 22,
    color: colors.textDark,
    marginBottom: spacing.md,
    marginTop: 4,
  },

  // ── Opciones ───────────────────────────
  optionsList: {
    gap: 8,
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionLetter: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    width: 18,
    lineHeight: 18,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },

  // ── Feedback card ──────────────────────
  feedbackCard: {
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: colors.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  feedbackCardOk: {
    borderColor: colors.statGreen,
  },
  feedbackCardErr: {
    borderColor: colors.statRed,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 19,
    fontFamily: 'Poppins-SemiBold',
  },
  feedbackBody: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    lineHeight: 21,
    color: colors.textDark,
  },
  errorLabLink: {
    fontSize: 13,
    color: colors.purple,
    fontFamily: 'Poppins-Medium',
    marginTop: 8,
  },

  // ── Botón principal ────────────────────
  mainBtn: {
    backgroundColor: colors.ctaGreen,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  mainBtnDisabled: {
    backgroundColor: colors.gray,
  },
  mainBtnText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2,
  },

  // ── Toolbar inferior ───────────────────
  toolbar: {
    marginTop: spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toolItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  toolItemDisabled: {
    opacity: 0.4,
  },
  toolLabel: {
    fontSize: 10,
    color: colors.textDark,
    fontFamily: 'Poppins-Medium',
  },
});
