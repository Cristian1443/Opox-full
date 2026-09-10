import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Modal,
    FlatList,
    Alert,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

function changeTypeToFeedType(ct) {
    if (ct === 'modificacion' || ct === 'derogacion') return 'critical';
    if (ct === 'tipografica') return 'review';
    return 'info';
}

// ─── 10.1 · Monitor BOE · feed "LEYES ACTUALIZADAS" ───────────────────────────
// Fiel al Figma (archivo OPOX_AI (2), Bloque 10, 905 x 2176px) para header,
// filtro, tarjeta y estado "Todo en orden". El sistema de búsqueda/seguimiento
// de normas (modal "Añadir norma") y los estados de carga no tienen
// equivalente en el reference — son funcionalidad real imprescindible (sin
// seguir ninguna norma no hay nada que monitorizar) y se conservan,
// reestilizados con la misma paleta confirmada.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
    borderMuted: 'rgba(65, 41, 80, 0.3)',
};

// Mapeo confirmado por Figma: los 3 ítems mock ("Modificación del art. 14",
// "Nueva instrucción · Registro electrónico", "Corrección de errores · Ley
// 40/2015") son los mismos 3 del reference TSX, con categorías
// urgente(rojo)/afecta(naranja)/informativa(verde) — reemplaza la paleta
// azul/amarilla que tenía este archivo antes del rediseño.
const TYPE_CFG = {
    critical: { color: colors.statRed, label: 'Afecta a tu tema' },
    info: { color: colors.accentOrange, label: 'Afecta a tu tema' },
    review: { color: colors.ctaGreen, label: 'Informativa' },
};

// Solo "Mi temario"/"Guardados": "Toda mi opo" era mock puro (sin backend
// real detrás) y se retiró al conectar el feed real — ver handleFollow/
// watchedCount más abajo, que reemplazan por completo el sistema de mocks.
const TABS = [
    { key: 'myTopics', label: 'Mi temario' },
    { key: 'saved', label: 'Guardados' },
];

// El feed real llega agrupado por sección (fecha) desde boeApi.getFeed(). El
// Figma confirmado no muestra encabezados de sección: cada tarjeta lleva su
// propia marca de tiempo coloreada por categoría. Aplanamos sin perder el
// dato — el nombre de la sección pasa a ser el timestamp de cada ítem.
function flattenSections(sections) {
    return sections.flatMap(s => s.items.map(item => ({ ...item, timestamp: s.section })));
}

// ─── Íconos confirmados en Figma ───────────────────────────────────────────
// Ícono exacto exportado de Figma (sliders de filtro con topes).
function FilterIcon({ size = 20, color = colors.textDark }) {
    return (
        <Svg width={size} height={(size * 48) / 54} viewBox="0 0 54 48" fill="none">
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

// Ícono exacto exportado de Figma (sync/refresh, dos flechas circulares).
function SyncIcon({ size = 26, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={(size * 67) / 78} viewBox="0 0 78 67" fill="none">
            <Path d="M77.9999 19.1444L66.7341 15.5854L65.2288 15.1152L64.5938 16.5727L59.9981 27.1744L63.2203 28.5848L66.3531 21.3493C68.8312 26.8823 69.5685 33.0373 68.4672 38.9986C67.3659 44.9599 64.478 50.4459 60.1862 54.7294C54.5672 60.3436 46.9474 63.4974 39.0023 63.4974C31.0571 63.4974 23.4373 60.3436 17.8183 54.7294L15.3252 57.2212C18.434 60.329 22.1248 62.7942 26.187 64.4762C30.2491 66.1582 34.603 67.0239 38.9999 67.0239C43.3968 67.0239 47.7507 66.1582 51.8128 64.4762C55.875 62.7942 59.5658 60.329 62.6746 57.2212C67.4276 52.4712 70.6402 46.4014 71.8944 39.8015C73.1486 33.2016 72.3864 26.3773 69.7069 20.2163L76.9368 22.5012L77.9999 19.1444Z" fill={color} />
            <Path d="M14.7796 38.4342L11.6421 45.6697C9.16523 40.1361 8.42906 33.981 9.5312 28.0198C10.6333 22.0587 13.5217 16.5729 17.8137 12.2895C20.595 9.50801 23.8974 7.30148 27.5322 5.79604C31.1671 4.29059 35.0631 3.51573 38.9976 3.51573C42.9322 3.51573 46.8282 4.29059 50.4631 5.79604C54.0979 7.30148 57.4003 9.50801 60.1816 12.2895L62.67 9.79779C59.5612 6.69 55.8704 4.22473 51.8082 2.54277C47.7461 0.860816 43.3922 -0.00488281 38.9953 -0.00488281C34.5984 -0.00488281 30.2445 0.860816 26.1824 2.54277C22.1202 4.22473 18.4294 6.69 15.3206 9.79779C10.5713 14.5452 7.36088 20.6108 6.10672 27.2062C4.85257 33.8015 5.61269 40.6214 8.28826 46.7792L1.05838 44.4943L0 47.8511L11.2893 51.4101L12.7946 51.8802L13.4296 50.4181L18.0253 39.8164L14.7796 38.4342Z" fill={color} />
        </Svg>
    );
}

// Ícono confirmado en Figma para el estado "Todo en orden" (10.1·vacío) —
// círculo + check verde grande, sin círculo de fondo detrás.
function SuccessCheckIcon({ size = 96, color = colors.ctaGreen }) {
    return (
        <Svg width={size} height={(size * 158) / 240} viewBox="0 0 240 158" fill="none">
            <Path d="M232.992 3.6811C235.578 5.88163 237.541 8.58613 238.723 11.5768C239.905 14.5674 240.272 17.7606 239.796 20.8991C237.076 26.515 233.842 30.2469 228.998 34.4463L227.128 36.0929L221.178 41.1839L215.212 46.3504L209.854 50.9164C207.755 52.7644 205.77 54.6604 203.9 56.6042C200.554 59.8976 197.125 63.0662 193.613 66.1103L187.169 71.7981L180.198 77.8598L165.497 90.8029L148.406 105.774L135.485 117.153C131.067 121.043 131.067 121.043 130.128 122.693H128.425V124.189H126.718L125.019 127.184C121.617 130.179 121.617 130.179 119.914 130.179L118.215 133.17C114.814 136.165 114.814 136.165 113.115 136.165V137.664L107.161 142.155L104.441 145.002C96.5349 152.786 89.9887 158.923 77.4027 157.874C71.5988 155.721 66.3608 152.539 62.0153 148.526L60.0592 146.879L53.8479 141.414L49.5967 137.596L28.8514 119.404L9.71514 102.567L6.31748 99.4964C3.56719 96.9489 1.61896 93.8139 0.665048 90.401C-0.288861 86.9881 -0.215471 83.4152 0.877975 80.035C4.78609 73.1499 10.3971 69.1807 18.9893 68.4328C35.4834 69.702 49.854 87.8943 60.9086 97.7743L67.5406 103.689L69.5824 105.486C77.2353 112.224 77.2353 112.224 84.2062 112.224C91.5161 108.334 97.5518 102.117 103.592 96.8035L106.144 94.5601C109.43 91.7126 112.603 88.7164 115.663 85.5717C119.632 81.7775 123.716 78.0348 127.914 74.3436L130.548 72.0965L139.051 64.4636L142.113 61.839L186.062 23.0096L200.257 10.4978L202.707 8.25076C212.08 0.0174689 220.835 -3.04934 232.992 3.68829" fill={color} />
        </Svg>
    );
}

export default function BoeHomeScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('myTopics');
    const [readSet, setReadSet] = useState(() => new Set());
    const [bookmarkSet, setBookmarkSet] = useState(() => new Set());
    const [myTopicsSections, setMyTopicsSections] = useState([]);
    const [watchedCount, setWatchedCount] = useState(null); // null = cargando
    const [totalUnread, setTotalUnread] = useState(0);

    // Sheet de búsqueda y seguimiento de normas ("Añadir norma")
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [followedIds, setFollowedIds] = useState(() => new Set());
    const searchTimeout = useRef(null);

    // Recarga el feed cada vez que la pantalla entra en foco, para reflejar
    // cambios de isRead/isBookmarked producidos en Detalle, Comparativa o Mini-test.
    useFocusEffect(
        useCallback(() => {
            boeApi.getFeed().then(res => {
                if (!res?.error && res?.data) {
                    const d = res.data;
                    const sections = d.sections.map(s => ({
                        section: s.sectionTitle,
                        items: s.data.map(c => ({
                            id: c.id,
                            type: changeTypeToFeedType(c.changeType),
                            title: `${c.articulo} · ${c.shortTitle}`,
                            description: c.affectedQuestionsCount > 0
                                ? `${c.affectedQuestionsCount} pregunta${c.affectedQuestionsCount > 1 ? 's' : ''} afectada${c.affectedQuestionsCount > 1 ? 's' : ''}.`
                                : 'Cambio detectado en tu temario.',
                            read: c.isRead,
                        })),
                    }));
                    setMyTopicsSections(sections);
                    setWatchedCount(d.watchedRegulationsCount ?? 0);
                    setTotalUnread(d.totalUnread ?? 0);
                    const bmarks = new Set();
                    d.sections.flatMap(s => s.data).forEach(c => {
                        if (c.isBookmarked) bmarks.add(c.id);
                    });
                    setBookmarkSet(bmarks);
                } else {
                    setWatchedCount(prev => prev ?? 0);
                }
            }).catch(() => { setWatchedCount(prev => prev ?? 0); });
        }, [])
    );

    // Precarga sugerencias y normas ya seguidas cuando el modal abre
    useEffect(() => {
        if (!searchVisible) return;
        boeApi.listRegulations().then(res => {
            if (!res?.error && res?.data) {
                setFollowedIds(new Set((res.data ?? []).map(r => r.boeIdentifier)));
            }
        }).catch(() => {});
        setSearchLoading(true);
        boeApi.searchCatalog('', 20).then(res => {
            if (!res?.error && res?.data) setSearchResults(res.data.resultados ?? []);
        }).catch(() => {}).finally(() => setSearchLoading(false));
    }, [searchVisible]);

    function triggerSearch(q) {
        setSearchQuery(q);
        clearTimeout(searchTimeout.current);
        if (!q.trim()) {
            // Sin query: volver a mostrar todas las sugerencias cargadas al abrir
            setSearchLoading(true);
            boeApi.searchCatalog('', 20).then(res => {
                if (!res?.error && res?.data) setSearchResults(res.data.resultados ?? []);
            }).catch(() => {}).finally(() => setSearchLoading(false));
            return;
        }
        searchTimeout.current = setTimeout(() => {
            setSearchLoading(true);
            boeApi.searchCatalog(q, 15).then(res => {
                if (!res?.error && res?.data) {
                    setSearchResults(res.data.resultados ?? []);
                }
            }).catch(() => {}).finally(() => setSearchLoading(false));
        }, 400);
    }

    function handleFollow(entry) {
        const boeId = entry.identificador_boe;
        if (followedIds.has(boeId)) return; // ya seguida — no relanzar
        boeApi.followRegulation(boeId, entry.titulo).then(res => {
            if (!res?.error) {
                setFollowedIds(prev => new Set([...prev, boeId]));
                setWatchedCount(c => (c ?? 0) + 1);
            } else {
                Alert.alert('Error', res.error?.message ?? 'No se pudo añadir la norma.');
            }
        }).catch(() => Alert.alert('Error', 'No se pudo conectar con el servidor.'));
    }

    function toggleBookmark(id) {
        setBookmarkSet(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        boeApi.toggleBookmark(id).catch(() => {});
    }

    const myTopicsItems = flattenSections(myTopicsSections);
    const savedItems = myTopicsItems.filter(item => bookmarkSet.has(item.id));
    const feedItems = activeTab === 'saved' ? savedItems : myTopicsItems;

    function markRead(id) {
        setReadSet(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        boeApi.markRead(id).catch(() => {});
    }

    function handleCardPress(item) {
        markRead(item.id);
        navigation.navigate('BoeDetail', { itemId: item.id, type: item.type });
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.screen}>
                {/* ── Header ──────────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Volver"
                    >
                        <Feather name="chevron-left" size={22} color={colors.textDark} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.headerTitle}>Monitor BOE</Text>
                        {totalUnread > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
                            </View>
                        )}
                    </View>
                    {/* Añadir norma a monitorizar — única vía persistente para seguir
                        más normas una vez el temario ya tiene alguna (el CTA del
                        estado vacío solo aparece antes de la primera). */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={() => setSearchVisible(true)}
                        accessibilityLabel="Seguir norma"
                    >
                        <SyncIcon />
                    </TouchableOpacity>
                </View>

                {/* ── Filtro ──────────────────────────────────────────────────── */}
                <View style={styles.filterRow}>
                    <FilterIcon />
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.filterTab, isActive && styles.filterTabActive]}
                                onPress={() => setActiveTab(tab.key)}
                                accessibilityLabel={tab.label}
                                accessibilityState={{ selected: isActive }}
                            >
                                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Feed ────────────────────────────────────────────────────── */}
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {feedItems.length === 0 ? (
                        activeTab === 'saved' ? (
                            /* ── Empty: tab Guardados ──────────────────────────── */
                            <View style={styles.empty}>
                                <Ionicons name="bookmark-outline" size={44} color={colors.textSecondary} />
                                <Text style={styles.emptyTitle}>Nada guardado aún</Text>
                                <Text style={styles.emptySubtitle}>
                                    Guarda artículos desde el feed para revisarlos después.
                                </Text>
                            </View>
                        ) : watchedCount === null ? (
                            /* ── Cargando ───────────────────────────────────────── */
                            <ActivityIndicator style={{ marginTop: 60 }} color={colors.accentOrange} />
                        ) : watchedCount === 0 ? (
                            /* ── Empty: sin normas seguidas ────────────────────── */
                            <View style={styles.empty}>
                                <Ionicons name="telescope-outline" size={48} color={colors.textSecondary} />
                                <Text style={styles.emptyTitle}>Empieza a monitorizar</Text>
                                <Text style={styles.emptySubtitle}>
                                    Añade las normas de tu temario y te avisaremos en cuanto el BOE publique un cambio que te afecte.
                                </Text>
                                <TouchableOpacity
                                    style={styles.followCta}
                                    onPress={() => setSearchVisible(true)}
                                    accessibilityLabel="Añadir norma"
                                >
                                    <Ionicons name="add" size={18} color={colors.white} />
                                    <Text style={styles.followCtaText}>Añadir norma</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* ── Empty: temario al día (10.1·vacío) ────────────── */
                            <View style={styles.upToDate}>
                                <SuccessCheckIcon />
                                <Text style={styles.upToDateTitle}>Todo en orden</Text>
                                <Text style={styles.upToDateDesc}>
                                    Tu temario está actualizado. Te avisaremos en cuanto el BOE publique
                                    algún cambio que te afecte.
                                </Text>
                            </View>
                        )
                    ) : (
                        feedItems.map(item => {
                            const cfg = TYPE_CFG[item.type];
                            const isRead = readSet.has(item.id) || item.read;
                            const isBookmarked = bookmarkSet.has(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.card, !isRead && { borderColor: cfg.color, borderWidth: 1.5 }]}
                                    activeOpacity={0.8}
                                    onPress={() => handleCardPress(item)}
                                    accessibilityLabel={item.title}
                                >
                                    <View style={styles.cardHeaderRow}>
                                        <View style={[styles.tag, { backgroundColor: `${cfg.color}1A` }]}>
                                            <Text style={[styles.tagText, { color: cfg.color }]}>{cfg.label}</Text>
                                        </View>
                                        <View style={styles.cardTopRight}>
                                            <Text style={[styles.timestamp, { color: cfg.color }]}>
                                                {item.timestamp}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => toggleBookmark(item.id)}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                accessibilityLabel={isBookmarked ? 'Quitar de guardados' : 'Guardar artículo'}
                                            >
                                                <Ionicons
                                                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                                    size={14}
                                                    color={isBookmarked ? colors.purple : colors.textSecondary}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardSubtitle}>{item.description}</Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </View>

            {/* ── Modal: buscar y seguir normas ──────────────────────────────── */}
            <Modal
                visible={searchVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setSearchVisible(false);
                    setSearchQuery('');
                    setSearchResults([]);
                }}
            >
                <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Añadir norma</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setSearchVisible(false);
                                setSearchQuery('');
                                setSearchResults([]);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityLabel="Cerrar"
                        >
                            <Ionicons name="close" size={22} color={colors.textDark} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por nombre o identificador BOE…"
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={triggerSearch}
                            autoFocus
                            returnKeyType="search"
                        />
                        {searchLoading && <ActivityIndicator size="small" color={colors.accentOrange} />}
                    </View>

                    {searchResults.length === 0 && !searchLoading ? (
                        <View style={styles.empty}>
                            <Ionicons
                                name={searchQuery.trim() ? 'search-outline' : 'book-outline'}
                                size={40}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.emptyTitle}>
                                {searchQuery.trim() ? 'Sin resultados' : 'Sin normas disponibles'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery.trim()
                                    ? 'Prueba con otro término o identificador BOE (ej. BOE-A-2023-...).'
                                    : 'Verifica que MOTOR_BOE_BASE_URL y MOTOR_BOE_CURSO_ID estén configurados en el backend.'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={searchResults}
                            keyExtractor={item => item.id ?? item.identificador_boe}
                            contentContainerStyle={{ padding: spacing.md }}
                            renderItem={({ item }) => (
                                <View style={styles.searchResultRow}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <Text style={styles.searchResultId}>{item.identificador_boe}</Text>
                                        <Text style={styles.searchResultTitle} numberOfLines={2}>
                                            {item.titulo}
                                        </Text>
                                    </View>
                                    {followedIds.has(item.identificador_boe) ? (
                                        <View style={styles.followedBadge}>
                                            <Text style={styles.followedBadgeText}>Siguiendo</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.followBtn}
                                            onPress={() => handleFollow(item)}
                                            accessibilityLabel={`Seguir ${item.titulo}`}
                                        >
                                            <Text style={styles.followBtnText}>Seguir</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            ItemSeparatorComponent={() => (
                                <View style={{ height: 1, backgroundColor: colors.separator }} />
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },
    screen: {
        flex: 1,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },

    // ── Header ────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },
    unreadBadge: {
        backgroundColor: colors.statRed,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    unreadBadgeText: {
        fontFamily: 'Poppins-Bold',
        fontSize: 11,
        color: colors.white,
    },

    // ── Filtro ────────────────────────────────────────────────────
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    filterTabActive: {
        backgroundColor: colors.purple,
    },
    filterTabText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10.7,
        color: FIGMA.subtitleMuted,
    },
    filterTabTextActive: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
    },

    // ── Feed ──────────────────────────────────────────────────────
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.lg,
    },

    // ── Card ──────────────────────────────────────────────────────
    card: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: spacing.sm,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    tag: {
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    tagText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 10.2,
    },
    cardTopRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timestamp: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10.2,
    },
    cardTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 17.8,
        color: colors.textDark,
    },
    cardSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.subtitleMuted,
        marginTop: 2,
    },

    // ── Empty (Guardados / sin normas / búsqueda sin resultados) ──
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        color: colors.textDark,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 19,
    },
    followCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: spacing.lg,
        backgroundColor: colors.purple,
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        borderRadius: 12,
    },
    followCtaText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },

    // ── Empty: temario al día (10.1·vacío) ───────────────────────
    upToDate: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    upToDateTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    upToDateDesc: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
        lineHeight: 17,
        marginTop: spacing.sm,
    },

    // ── Modal de búsqueda / seguimiento de normas ──────────────────
    modalContainer: {
        flex: 1,
        backgroundColor: colors.white,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    modalTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 17,
        color: colors.textDark,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: FIGMA.borderMuted,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: colors.textDark,
        padding: 0,
    },
    searchResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    searchResultId: {
        fontFamily: 'Poppins-Bold',
        fontSize: 10,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 3,
    },
    searchResultTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: colors.textDark,
        lineHeight: 20,
    },
    followBtn: {
        backgroundColor: `${colors.purple}1A`,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.purple,
    },
    followBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: colors.purple,
    },
    followedBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.grayLight,
    },
    followedBadgeText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: colors.textSecondary,
    },
});
