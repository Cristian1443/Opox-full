import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';

const ACCENT = '#6C5CE7';
const ACCENT_LIGHT = '#A29BFE';

// Datos extra que el backend devolverá en el detalle del producto.
// La home solo pasa nombre/precio/icono; aquí completamos hasta que exista el endpoint.
const MOCK_EXTRA = {
  subtitle: '500 preguntas extra elaboradas por examinadores humanos',
  description: 'Accede a casos prácticos reales. Estos tests están diseñados para simular la dificultad real del examen, con explicaciones detalladas en cada respuesta.',
  features: [
    '500 preguntas de alta calidad',
    'Casos prácticos reales',
    'Explicaciones detalladas por examinadores',
    'Actualizaciones mensuales',
  ],
};

export default function StoreProductDetailScreen({ navigation, route }) {
  const item = route.params?.item ?? {};
  const insets = useSafeAreaInsets();

  const [userBalance] = useState(1840);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const productCost = item.price ?? 0;
  const remainingBalance = userBalance - productCost;
  const canAfford = remainingBalance >= 0;

  const handleRedeem = () => {
    if (isLoading) return;
    if (!canAfford) {
      setShowErrorModal(true);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('StoreConfirmRedeem', {
        product: item,
        currentBalance: userBalance,
        newBalance: remainingBalance,
      });
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{item.name ?? 'Detalle del producto'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={item.icon ?? 'cube-outline'}
              size={64}
              color={ACCENT}
            />
          </View>
          <Text style={styles.productTitle}>{item.name ?? '—'}</Text>
          <Text style={styles.productSubtitle}>{MOCK_EXTRA.subtitle}</Text>
        </View>

        {/* Saldo y coste */}
        <View style={styles.balanceCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tu saldo actual</Text>
            <Text style={styles.rowValue}>{userBalance.toLocaleString()} O</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Coste del producto</Text>
            <Text style={[styles.rowValue, { color: ACCENT }]}>{productCost} O</Text>
          </View>

          <View style={styles.divider} />

          <View style={[
            styles.row,
            styles.remainingRow,
            { backgroundColor: canAfford ? colors.successBg : colors.errorBg },
          ]}>
            <Text style={[styles.rowLabel, { color: canAfford ? colors.text : colors.error }]}>
              Te quedarían
            </Text>
            <Text style={[
              styles.rowValue,
              { fontWeight: '800', color: canAfford ? colors.success : colors.error },
            ]}>
              {remainingBalance.toLocaleString()} O
            </Text>
          </View>

          {!canAfford && (
            <Text style={styles.errorText}>
              Te faltan {Math.abs(remainingBalance)} Opopoints para canjear este producto.
            </Text>
          )}
        </View>

        {/* Descripción y características */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>¿Qué incluye?</Text>
          <Text style={styles.descriptionText}>{MOCK_EXTRA.description}</Text>

          <Text style={styles.featuresTitle}>Características</Text>
          {MOCK_EXTRA.features.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer fijo */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.redeemButton, !canAfford && styles.redeemButtonDisabled]}
          onPress={handleRedeem}
          disabled={isLoading}
          accessibilityLabel={`Canjear ${item.name ?? 'producto'} por ${productCost} Opopoints`}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.redeemButtonText}>Canjear ahora</Text>
              <Text style={styles.redeemSubtext}>Por {productCost} Opopoints</Text>
            </>
          )}
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingVertical: 0,
  },
  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  productSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  // Saldo
  balanceCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 14,
  },
  remainingRow: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    textAlign: 'center',
    color: colors.error,
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  // Detalles
  detailsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 18,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  redeemButton: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.grayMid,
    shadowOpacity: 0,
    elevation: 0,
  },
  redeemButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  redeemSubtext: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
});
