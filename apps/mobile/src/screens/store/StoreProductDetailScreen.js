import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';
import { storeApi } from '../../api/store';

// ─── 11.2 · Tienda · detalle de producto ──────────────────────────────────
// Fiel al Figma (DetalleProductoScreen.tsx). El diseño confirma naranja
// (#F69624) como color de CTA primario en todo el Bloque 11 — coherente con
// el que ya usé en StoreHomeScreen (tarjeta de saldo, precios), a diferencia
// del verde usado en Bloques 9/10.
//
// ⚠️ Nota de alcance: tras la conexión real al backend (fusión de
// feat/revision-bloque-11-tienda), la pestaña "Virtual" de StoreHomeScreen
// se eliminó por no tener catálogo real detrás, y era la única vía que
// navegaba a esta pantalla — hoy queda inalcanzable desde la app. Se
// rediseña igualmente porque el backend (getProduct/redeem) sigue
// funcionando, por si se reconecta una fuente real de productos.
const FIGMA = {
  bodyMuted: 'rgba(52, 58, 61, 0.7)',
  balanceMuted: 'rgba(65, 41, 80, 0.5)',
};

// Ícono exacto exportado de Figma para esta pantalla (proporción propia,
// distinta a la exportación usada en StoreHomeScreen).
function GemIcon({ size = 22, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={(size * 52) / 71} viewBox="0 0 71 52" fill="none">
      <Path d="M35.2945 51.8608C35.147 51.861 35.0008 51.832 34.8645 51.7757C34.7281 51.7193 34.6042 51.6366 34.4998 51.5324L0.307669 15.7827C0.155927 15.6298 0.05436 15.4344 0.0165007 15.2224C-0.0213585 15.0104 0.00628764 14.7919 0.0957556 14.596C0.175244 14.4025 0.31023 14.2368 0.483703 14.1199C0.657175 14.003 0.86137 13.9401 1.07056 13.939H69.4866C69.6994 13.9358 69.9082 13.9968 70.0859 14.114C70.2635 14.2311 70.4018 14.3991 70.4826 14.596C70.5721 14.7919 70.5998 15.0104 70.5619 15.2224C70.524 15.4344 70.4225 15.6298 70.2707 15.7827L36.0362 51.5324C35.8391 51.7313 35.5743 51.8486 35.2945 51.8608ZM3.6347 16.1111L35.2945 49.2119L66.9437 16.1111H3.6347Z" fill={color} />
      <Path d="M35.6937 51.7913C35.4791 51.7966 35.268 51.7367 35.0883 51.6194C34.9085 51.5021 34.7686 51.3329 34.6871 51.1344L19.6201 15.3846L21.6121 14.537L35.6937 47.9133L48.027 18.6799L50.0296 19.5275L36.6897 51.1344C36.6089 51.3312 36.4706 51.4992 36.293 51.6163C36.1153 51.7335 35.9065 51.7945 35.6937 51.7913Z" fill={color} />
      <Path d="M69.8865 16.1479H1.47036C1.26908 16.1556 1.06978 16.1057 0.89582 16.0042C0.721859 15.9027 0.580442 15.7536 0.488145 15.5746C0.395848 15.3956 0.356495 15.1939 0.374697 14.9933C0.3929 14.7927 0.467905 14.6015 0.590921 14.442L10.0105 0.47692C10.1084 0.328151 10.2423 0.206473 10.3997 0.123134C10.5571 0.0397958 10.733 -0.00251413 10.9111 0.000115503H60.4775C60.6556 -0.00251413 60.8315 0.0397958 60.9889 0.123134C61.1463 0.206473 61.2802 0.328151 61.3782 0.47692L70.7871 14.442C70.9083 14.603 70.981 14.7952 70.9968 14.9961C71.0126 15.197 70.9707 15.3982 70.8762 15.5762C70.7816 15.7542 70.6383 15.9015 70.463 16.0008C70.2877 16.1002 70.0877 16.1476 69.8865 16.1373V16.1479ZM3.58949 13.9758H67.8415L59.8948 2.17222H11.4832L3.58949 13.9758Z" fill={color} />
      <Path d="M21.3589 15.8507L19.8755 14.272L34.9425 0.14798H36.4365L47.6785 10.6906L46.1951 12.2694L35.6948 2.43664L21.3589 15.8507Z" fill={color} />
      <Path d="M14.4664 4.40636L12.6636 5.62274L19.5643 15.8506L21.3672 14.6342L14.4664 4.40636Z" fill={color} />
      <Path d="M69.8865 16.1477H50.8885C50.6892 16.1511 50.493 16.0982 50.3225 15.9951C50.1519 15.892 50.0139 15.7429 49.9243 15.5649C49.8423 15.3974 49.806 15.2112 49.819 15.0252C49.832 14.8391 49.8939 14.6598 49.9984 14.5054L59.5345 0.529715C59.6325 0.380945 59.7663 0.259268 59.9237 0.17593C60.0812 0.0925912 60.2571 0.0502813 60.4351 0.0529109C60.6157 0.0532598 60.7935 0.0967076 60.9538 0.17964C61.1142 0.262573 61.2524 0.382592 61.357 0.529715L70.7871 14.4418C70.9083 14.6028 70.981 14.795 70.9968 14.9959C71.0126 15.1968 70.9707 15.3981 70.8762 15.576C70.7817 15.754 70.6383 15.9013 70.463 16.0007C70.2877 16.1 70.0877 16.1474 69.8865 16.1371V16.1477ZM52.9334 13.9756H67.8415L60.4246 2.9985L52.9334 13.9756Z" fill={color} />
    </Svg>
  );
}

// Ícono exacto exportado de Figma para el producto "Pack de Tests Premium"
// (icon key 'document-text-outline', ver MOCK_FALLBACK de StoreConfirmRedeemScreen.js).
function DocumentIcon({ size = 80, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={(size * 274) / 213} viewBox="0 0 213 274" fill="none">
      <Path d="M190.144 273.084H22.8226C16.7714 273.078 10.9698 270.682 6.69099 266.421C2.41219 262.159 0.00580446 256.382 0 250.355L0 23.1352C0.00580446 17.109 2.41219 11.3312 6.69099 7.07005C10.9698 2.80887 16.7714 0.412399 22.8226 0.406618H141.956C145.207 0.405199 148.42 1.09606 151.381 2.43287C154.342 3.76967 156.981 5.72151 159.122 8.15748L207.355 63.0903C210.981 67.2366 212.982 72.5477 212.989 78.0462V250.355C212.983 256.385 210.574 262.167 206.29 266.428C202.007 270.69 196.199 273.084 190.144 273.084ZM22.8226 15.559C20.805 15.559 18.8699 16.3572 17.4433 17.778C16.0166 19.1988 15.2151 21.1259 15.2151 23.1352V250.355C15.2005 251.36 15.3866 252.356 15.7624 253.288C16.1382 254.22 16.6963 255.068 17.4041 255.783C18.112 256.499 18.9556 257.066 19.8858 257.454C20.816 257.841 21.8143 258.041 22.8226 258.041H190.144C192.162 258.041 194.097 257.243 195.524 255.822C196.95 254.401 197.752 252.474 197.752 250.465V78.0462C197.748 76.2145 197.079 74.446 195.867 73.0682L147.634 18.1353C146.919 17.3261 146.038 16.6779 145.052 16.2337C144.065 15.7895 142.995 15.5595 141.912 15.559H22.8226Z" fill={color} />
      <Path d="M205.359 106.451H144.499C138.45 106.446 132.65 104.048 128.375 99.7867C124.1 95.5249 121.698 89.7471 121.698 83.7228V7.98276C121.643 6.95508 121.798 5.92693 122.155 4.96103C122.512 3.99513 123.062 3.11173 123.773 2.36474C124.484 1.61774 125.34 1.02282 126.289 0.616248C127.239 0.20968 128.261 0 129.295 0C130.328 0 131.351 0.20968 132.3 0.616248C133.25 1.02282 134.106 1.61774 134.817 2.36474C135.527 3.11173 136.078 3.99513 136.435 4.96103C136.791 5.92693 136.947 6.95508 136.891 7.98276V83.7228C136.897 85.7304 137.701 87.6541 139.126 89.0737C140.551 90.4932 142.483 91.2933 144.499 91.299H205.359C207.377 91.299 209.312 92.0972 210.738 93.5181C212.165 94.9389 212.967 96.8659 212.967 98.8752C212.967 100.885 212.165 102.812 210.738 104.232C209.312 105.653 207.377 106.451 205.359 106.451Z" fill={color} />
      <Path d="M174.93 227.627H38.0382C37.0063 227.682 35.9739 227.527 35.004 227.172C34.0341 226.817 33.1471 226.269 32.397 225.561C31.6469 224.853 31.0495 224 30.6413 223.055C30.233 222.109 30.0225 221.091 30.0225 220.062C30.0225 219.033 30.233 218.014 30.6413 217.069C31.0495 216.123 31.6469 215.271 32.397 214.563C33.1471 213.855 34.0341 213.306 35.004 212.951C35.9739 212.596 37.0063 212.441 38.0382 212.496H174.93C175.962 212.441 176.994 212.596 177.964 212.951C178.934 213.306 179.821 213.855 180.571 214.563C181.321 215.271 181.919 216.123 182.327 217.069C182.735 218.014 182.946 219.033 182.946 220.062C182.946 221.091 182.735 222.109 182.327 223.055C181.919 224 181.321 224.853 180.571 225.561C179.821 226.269 178.934 226.817 177.964 227.172C176.994 227.527 175.962 227.682 174.93 227.627Z" fill={color} />
      <Path d="M98.8765 106.451H38.0382C36.0206 106.451 34.0855 105.653 32.6589 104.232C31.2322 102.812 30.4307 100.885 30.4307 98.8753C30.4307 96.8659 31.2322 94.9389 32.6589 93.5181C34.0855 92.0973 36.0206 91.2991 38.0382 91.2991H98.8765C100.894 91.2991 102.829 92.0973 104.256 93.5181C105.683 94.9389 106.484 96.8659 106.484 98.8753C106.484 100.885 105.683 102.812 104.256 104.232C102.829 105.653 100.894 106.451 98.8765 106.451Z" fill={color} />
      <Path d="M174.93 167.039H38.0382C36.0206 167.039 34.0855 166.241 32.6589 164.82C31.2322 163.399 30.4307 161.472 30.4307 159.463C30.4307 157.454 31.2322 155.527 32.6589 154.106C34.0855 152.685 36.0206 151.887 38.0382 151.887H174.93C176.948 151.887 178.883 152.685 180.309 154.106C181.736 155.527 182.537 157.454 182.537 159.463C182.537 161.472 181.736 163.399 180.309 164.82C178.883 166.241 176.948 167.039 174.93 167.039Z" fill={color} />
    </Svg>
  );
}

export default function StoreProductDetailScreen({ navigation, route }) {
  const item = route.params?.item ?? {};
  const insets = useSafeAreaInsets();

  const [userBalance, setUserBalance] = useState(null);
  const [product, setProduct] = useState(item);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    storeApi.getBalance().then(res => {
      if (cancelled || !res?.data) return;
      setUserBalance(res.data.balance);
    });
    if (item.id) {
      storeApi.getProduct(item.id).then(res => {
        if (cancelled || !res?.data) return;
        setProduct(res.data);
      });
    }
    return () => { cancelled = true; };
  }, [item.id]));

  const title = product.title ?? item.name ?? '—';
  const description = product.description ?? product.subtitle ?? '';
  const productCost = product.cost ?? item.cost ?? item.price ?? 0;
  const remainingBalance = (userBalance ?? 0) - productCost;
  const canAfford = userBalance !== null && remainingBalance >= 0;

  const handleRedeem = () => {
    if (userBalance === null) return;
    if (!canAfford) {
      setShowErrorModal(true);
      return;
    }
    navigation.navigate('StoreConfirmRedeem', {
      productId: item.id,
      redeemType: 'product',
      product: { name: title, icon: product.icon ?? item.icon, price: productCost },
      currentBalance: userBalance,
      newBalance: remainingBalance,
    });
  };

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
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {(product.icon ?? item.icon) === 'document-text-outline' ? (
            <DocumentIcon />
          ) : (
            <Ionicons
              name={product.icon ?? item.icon ?? 'cube-outline'}
              size={80}
              color={colors.accentOrange}
            />
          )}
          <Text style={styles.productTitle}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {product.conditions?.length > 0 && (
            <View style={styles.conditions}>
              {product.conditions.map((c, i) => (
                <View key={i} style={styles.conditionRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.ctaGreen} />
                  <Text style={styles.conditionText}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{productCost}</Text>
            <GemIcon />
          </View>
          <Text style={[styles.balanceNote, !canAfford && styles.balanceNoteError]}>
            {userBalance === null
              ? 'Consultando tu saldo…'
              : canAfford
                ? `Tienes ${userBalance.toLocaleString('es-ES')} · te sobran ${remainingBalance.toLocaleString('es-ES')}`
                : `Tienes ${userBalance.toLocaleString('es-ES')} · te faltan ${Math.abs(remainingBalance).toLocaleString('es-ES')}`}
          </Text>
        </View>
      </ScrollView>

      {/* ── CTA fijo al fondo ─────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: spacing.sm + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.ctaButton, !canAfford && styles.ctaButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleRedeem}
          disabled={userBalance === null}
          accessibilityLabel={`Canjear ${title} por ${productCost} Opopoints`}
        >
          <Text style={styles.ctaButtonText}>Canjear ahora</Text>
          <Text style={styles.ctaButtonSubtext}>Por {productCost} Opopoints</Text>
        </TouchableOpacity>
      </View>

      <InsufficientPointsModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        cost={productCost}
        currentBalance={userBalance}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Header ────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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

  // ── Hero ──────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: 12,
  },
  productTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 19,
    color: colors.textDark,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: FIGMA.bodyMuted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
  },
  conditions: {
    width: '100%',
    gap: 8,
    marginTop: spacing.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  conditionText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 19,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  price: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: colors.accentOrange,
  },
  balanceNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.balanceMuted,
  },
  balanceNoteError: {
    color: colors.statRed,
  },

  // ── CTA fijo al fondo ─────────────────────────────────────────
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  ctaButton: {
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: colors.grayMid,
  },
  ctaButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  ctaButtonSubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
