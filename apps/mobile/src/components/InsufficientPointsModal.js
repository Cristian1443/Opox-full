import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlertCardModal from './AlertCardModal';
import { colors } from '../theme';

const ACCENT = '#6C5CE7';

// ─── Pop-up "Opopoints insuficientes" (mockup 11.2 · err) ────────────────────
// Muestra el saldo actual, el coste del producto y cuántos puntos faltan.
// CTA principal navega a StoreHowToEarn; el botón de la pantalla siempre es
// tappable — el modal se activa cuando el usuario no puede pagar.
export default function InsufficientPointsModal({
  visible,
  onClose,
  cost,
  currentBalance,
  navigation,
}) {
  const missing = cost - currentBalance;

  const handleHowToEarn = () => {
    onClose();
    navigation.navigate('StoreHowToEarn');
  };

  const balanceRows = (
    <View style={styles.rows}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Tu saldo</Text>
        <Text style={styles.rowValue}>{currentBalance.toLocaleString()} O</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Precio del producto</Text>
        <Text style={[styles.rowValue, { color: ACCENT }]}>{cost} O</Text>
      </View>
      <View style={styles.divider} />
      <View style={[styles.row, styles.missingRow]}>
        <Text style={styles.missingLabel}>Te faltan</Text>
        <Text style={styles.missingValue}>{missing.toLocaleString()} O</Text>
      </View>
    </View>
  );

  return (
    <AlertCardModal
      visible={visible}
      iconBg={colors.errorBg}
      iconSize={72}
      icon={<Ionicons name="cash-outline" size={32} color={colors.error} />}
      title="Opopoints insuficientes"
      description="No tienes suficientes puntos para este producto."
      extraContent={balanceRows}
      primaryLabel="Cómo ganar Opopoints"
      primaryColor={ACCENT}
      onPrimaryPress={handleHowToEarn}
      secondaryLabel="Cancelar"
      onSecondaryPress={onClose}
    />
  );
}

const styles = StyleSheet.create({
  rows: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 2,
  },
  missingRow: {
    marginTop: 4,
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  missingLabel: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '700',
  },
  missingValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.error,
  },
});
