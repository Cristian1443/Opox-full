import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    StatusBar,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';
import { storeApi } from '../../api/store';

// ─── 11.1 · Tienda · home ──────────────────────────────────────────────────
// Fiel al Figma (TiendaHomeScreen.tsx) para header, tarjeta de saldo, tabs y
// tarjeta de producto — las únicas piezas que el reference cubre (solo
// muestra el tab "Virtual"). Suscripción/Descuentos/Reales y los accesos
// rápidos de cartera/afiliación son funcionalidad real sin equivalente en
// Figma y se conservan (ver notas junto a cada bloque).
const FIGMA = {
  cardBorder: 'rgba(65, 41, 80, 0.3)',
  tabTextMuted: 'rgba(65, 41, 80, 0.5)',
  comoGanarBg: 'rgba(255,255,255,0.25)',
  quickLinkDivider: 'rgba(255,255,255,0.35)',
  quickLinkBorder: 'rgba(255,255,255,0.3)',
};

const TABS = [
  { key: 'discounts', label: 'Descuentos' },
  { key: 'real', label: 'Reales', isPhase2: true },
  { key: 'subscription', label: 'Suscripción', navigateTo: 'StoreSubscription' },
  { key: 'comunidad', label: 'Comunidad', isPhase2: true, navigateTo: 'StoreMarketplace' },
];

// Ícono de diamante/gema — path exacto exportado de Figma. Reutilizado
// para el saldo y para el precio de cada tarjeta de producto.
function GemIcon({ size = 32, color = colors.white }) {
  return (
    <Svg width={size} height={(size * 89) / 121} viewBox="0 0 121 89" fill="none">
      <Path d="M60.4491 88.6297C60.1966 88.6299 59.9465 88.5804 59.7132 88.4839C59.4799 88.3875 59.2678 88.246 59.0892 88.0676L0.5768 26.8898C0.317128 26.6283 0.143318 26.2938 0.0785304 25.931C0.0137425 25.5682 0.0610529 25.1943 0.214158 24.859C0.350185 24.5279 0.581184 24.2444 0.878044 24.0444C1.1749 23.8443 1.52434 23.7366 1.88231 23.7348H118.961C119.326 23.7294 119.683 23.8337 119.987 24.0342C120.291 24.2347 120.528 24.5221 120.666 24.859C120.819 25.1943 120.866 25.5682 120.801 25.931C120.737 26.2938 120.563 26.6283 120.303 26.8898L61.7183 88.0676C61.3811 88.408 60.9278 88.6087 60.4491 88.6297ZM6.27029 27.4519L60.4491 84.0967L114.61 27.4519H6.27029Z" fill={color} />
      <Path d="M60.4488 88.6294C60.0816 88.6385 59.7203 88.5359 59.4127 88.3352C59.1051 88.1344 58.8657 87.845 58.7263 87.5052L32.9424 26.3274L36.3512 24.8768L60.4488 81.993L81.5546 31.9665L84.9816 33.4171L62.1532 87.5052C62.0149 87.8421 61.7783 88.1295 61.4743 88.33C61.1703 88.5305 60.813 88.6348 60.4488 88.6294Z" fill={color} />
      <Path d="M118.962 27.6336H1.88241C1.53796 27.6467 1.19691 27.5614 0.899208 27.3877C0.60151 27.2139 0.359507 26.9589 0.201561 26.6525C0.0436146 26.3461 -0.0237299 26.0011 0.00742021 25.6578C0.0385703 25.3145 0.166924 24.9872 0.377439 24.7143L16.4969 0.816144C16.6645 0.561558 16.8936 0.353333 17.163 0.210717C17.4324 0.0681018 17.7334 -0.00430239 18.0381 0.000197658H102.86C103.165 -0.00430239 103.466 0.0681018 103.735 0.210717C104.005 0.353333 104.234 0.561558 104.401 0.816144L120.503 24.7143C120.71 24.9898 120.835 25.3188 120.862 25.6626C120.889 26.0063 120.817 26.3507 120.655 26.6552C120.493 26.9598 120.248 27.2119 119.948 27.3819C119.648 27.552 119.306 27.633 118.962 27.6154V27.6336ZM5.50883 23.9165H115.462L101.863 3.71728H19.0173L5.50883 23.9165Z" fill={color} />
      <Path d="M35.9164 27.125L33.3779 24.4233L59.1618 0.253174H61.7184L80.9566 18.2946L78.4181 20.9963L60.4492 4.16971L35.9164 27.125Z" fill={color} />
      <Path d="M24.1233 7.5405L21.0381 9.62207L32.8472 27.1248L35.9324 25.0433L24.1233 7.5405Z" fill={color} />
      <Path d="M118.962 27.6332H86.4508C86.1098 27.639 85.7741 27.5485 85.4823 27.3721C85.1904 27.1957 84.9542 26.9405 84.8008 26.636C84.6605 26.3493 84.5984 26.0307 84.6206 25.7123C84.6429 25.3939 84.7488 25.0871 84.9277 24.8227L101.247 0.906475C101.414 0.651889 101.643 0.443665 101.913 0.301049C102.182 0.158434 102.483 0.0860296 102.788 0.0905297C103.097 0.0911267 103.401 0.165478 103.675 0.307399C103.95 0.44932 104.186 0.654707 104.365 0.906475L120.503 24.714C120.71 24.9895 120.835 25.3184 120.862 25.6622C120.889 26.006 120.817 26.3504 120.655 26.6549C120.494 26.9595 120.248 27.2115 119.948 27.3816C119.648 27.5517 119.306 27.6327 118.962 27.6151V27.6332ZM89.9503 23.9161H115.462L102.77 5.13126L89.9503 23.9161Z" fill={color} />
    </Svg>
  );
}

// Ícono exacto exportado de Figma (sliders de filtro con topes) — mismo
// componente visual que Monitor BOE (10.1), reutilizado tal cual.
function FilterIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={(size * 48) / 54} viewBox="0 0 54 48" fill="none">
      <Path d="M7.10698 25.4101H1.42148C1.22868 25.4204 1.03578 25.3916 0.854571 25.3253C0.673358 25.2591 0.507623 25.1569 0.367479 25.025C0.227335 24.893 0.115719 24.7341 0.0394429 24.5579C-0.0368336 24.3817 -0.0761719 24.1918 -0.0761719 24C-0.0761719 23.8082 -0.0368336 23.6184 0.0394429 23.4422C0.115719 23.2659 0.227335 23.107 0.367479 22.9751C0.507623 22.8431 0.673358 22.7409 0.854571 22.6747C1.03578 22.6085 1.22868 22.5796 1.42148 22.5899H7.10698C7.47023 22.6093 7.81216 22.7663 8.06239 23.0287C8.31261 23.291 8.45208 23.6386 8.45208 24C8.45208 24.3614 8.31261 24.7091 8.06239 24.9714C7.81216 25.2337 7.47023 25.3907 7.10698 25.4101Z" fill={color} />
      <Path d="M12.7885 31.0586C11.3824 31.0586 10.0079 30.6442 8.83887 29.8678C7.66988 29.0915 6.75898 27.988 6.22144 26.6972C5.6839 25.4063 5.54388 23.986 5.8191 22.616C6.09432 21.2461 6.77241 19.988 7.76755 19.0011C8.7627 18.0141 10.0302 17.3426 11.4096 17.0716C12.789 16.8005 14.2183 16.9421 15.5167 17.4783C16.8151 18.0146 17.9242 18.9215 18.7036 20.0842C19.4831 21.2469 19.8978 22.6132 19.8954 24.0102C19.8911 25.8804 19.1405 27.6725 17.8083 28.9937C16.4761 30.315 14.6709 31.0575 12.7885 31.0586ZM12.7885 19.7657C11.9455 19.7657 11.1214 20.014 10.4203 20.4791C9.71929 20.9442 9.17274 21.6054 8.84976 22.379C8.52678 23.1526 8.44186 24.004 8.60573 24.8256C8.7696 25.6471 9.17491 26.402 9.77043 26.9948C10.366 27.5876 11.125 27.9917 11.9516 28.156C12.7782 28.3204 13.6353 28.2377 14.4147 27.9183C15.194 27.5989 15.8605 27.0572 16.33 26.3616C16.7996 25.666 17.051 24.8477 17.0526 24.0102C17.0532 23.4533 16.9433 22.9018 16.7293 22.3872C16.5153 21.8725 16.2014 21.4047 15.8054 21.0106C15.4094 20.6164 14.9392 20.3036 14.4216 20.09C13.9039 19.8764 13.349 19.7662 12.7885 19.7657Z" fill={color} />
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

// --- Sub-componentes ---

const OpopointsHeader = ({ balance, onEarnClick, onWalletClick, onAffiliateClick }) => (
  <View style={styles.heroContainer}>
    <View style={styles.balanceCard}>
      <GemIcon />
      <View style={styles.balanceTextWrap}>
        <Text style={styles.balanceAmount}>
          {balance !== null && balance !== undefined ? balance.toLocaleString('es-ES') : '—'}
        </Text>
        <Text style={styles.balanceLabel}>OPOPOINTS DISPONIBLES</Text>
      </View>
      <TouchableOpacity
        style={styles.earnButton}
        onPress={onEarnClick}
        accessibilityLabel="Ver cómo ganar Opopoints"
      >
        <Text style={styles.earnButtonText}>Cómo ganar +</Text>
      </TouchableOpacity>
    </View>

    {/* Accesos rápidos (Mi cartera / Invita y ahorra) — funcionalidad real
        sin equivalente en Figma, se conserva porque son los únicos puntos
        de entrada a StoreWallet/StoreAffiliate. */}
    <View style={styles.quickLinks}>
      <TouchableOpacity
        style={styles.quickLink}
        onPress={onWalletClick}
        accessibilityLabel="Mi cartera de recompensas"
      >
        <Ionicons name="wallet-outline" size={16} color={colors.textDark} />
        <Text style={styles.quickLinkText}>Mi cartera</Text>
      </TouchableOpacity>
      <View style={styles.quickLinkDivider} />
      <TouchableOpacity
        style={styles.quickLink}
        onPress={onAffiliateClick}
        accessibilityLabel="Programa de afiliación"
      >
        <Ionicons name="people-outline" size={16} color={colors.textDark} />
        <Text style={styles.quickLinkText}>Invita y ahorra</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ProductCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.8}
    onPress={onPress}
    accessibilityLabel={`${item.name}, ${item.price} Opopoints`}
  >
    <Ionicons name={item.icon} size={40} color={colors.accentOrange} />
    <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
    {item.desc ? (
      <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
    ) : null}
    <View style={styles.cardFooter}>
      <Text style={styles.cardPrice}>{item.price}</Text>
      <GemIcon size={14} color={colors.accentOrange} />
    </View>
  </TouchableOpacity>
);

// --- Pantalla principal ---

export default function StoreHomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('discounts');
  const [balance, setBalance] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [realProducts, setRealProducts] = useState([]);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    storeApi.getBalance().then(res => {
      if (cancelled || !res?.data) return;
      setBalance(res.data.balance);
    });
    storeApi.listDiscounts().then(res => {
      if (cancelled || !res?.data) return;
      setDiscounts(res.data.map(d => ({
        id: d.id,
        name: d.title,
        price: d.cost,
        icon: d.icon,
        desc: d.subtitle,
        type: 'discounts',
      })));
    });
    storeApi.listProducts().then(res => {
      if (cancelled || !res?.data) return;
      setRealProducts(res.data.map(p => ({
        id: p.id,
        name: p.title,
        price: p.cost,
        icon: p.icon,
        desc: p.subtitle,
        type: 'real',
        isPhase2: true,
      })));
    });
    return () => { cancelled = true; };
  }, []));

  const getCurrentItems = () => {
    if (activeTab === 'real') return realProducts;
    return discounts;
  };

  const renderItem = ({ item }) => (
    <ProductCard
      item={item}
      onPress={() => {
        if (item.type === 'real') {
          navigation.navigate('StoreRealRewards');
        } else if (item.type === 'discounts') {
          navigation.navigate('StoreDiscounts');
        } else {
          navigation.navigate('StoreProductDetail', { item });
        }
      }}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

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
        <Text style={styles.headerTitle}>Tienda</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <OpopointsHeader
        balance={balance}
        onEarnClick={() => navigation.navigate('StoreHowToEarn')}
        onWalletClick={() => navigation.navigate('StoreWallet')}
        onAffiliateClick={() => navigation.navigate('StoreAffiliate')}
      />

      {/* Pestañas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsWrapper}
        contentContainerStyle={styles.tabsContainer}
      >
        <View style={styles.filterIconWrap}>
          <FilterIcon />
        </View>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                if (tab.navigateTo) {
                  navigation.navigate(tab.navigateTo);
                  return;
                }
                setActiveTab(tab.key);
              }}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.contentArea}>
        <FlatList
          data={getCurrentItems()}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay productos en esta categoría.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(65, 41, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
    textAlign: 'center',
  },

  // ── Tarjeta de saldo ──────────────────────────────────────────────
  heroContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentOrange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  balanceTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  balanceAmount: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: colors.white,
  },
  balanceLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: colors.white,
    marginTop: 2,
  },
  earnButton: {
    backgroundColor: FIGMA.comoGanarBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  earnButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.white,
  },

  // ── Accesos rápidos (real, sin equivalente en Figma) ─────────────
  quickLinks: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'center',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  quickLinkText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.textDark,
  },
  quickLinkDivider: {
    width: 1,
    backgroundColor: colors.separator,
  },

  // ── Pestañas ──────────────────────────────────────────────────────
  tabsWrapper: {
    backgroundColor: colors.white,
    flexGrow: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterIconWrap: {
    marginRight: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tabActive: {
    backgroundColor: colors.purple,
  },
  tabText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: FIGMA.tabTextMuted,
  },
  tabTextActive: {
    fontFamily: 'Poppins-SemiBold',
    color: colors.white,
  },
  contentArea: {
    flex: 1,
  },

  // ── Grid de productos ─────────────────────────────────────────────
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 40,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 11,
    padding: 16,
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  cardDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.accentOrange,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
