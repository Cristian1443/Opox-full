import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const ACCENT = '#6C5CE7';

// Pantalla de éxito post-canje — pendiente de mockup 11.3·ok
export default function StoreRedeemSuccessScreen({ navigation, route }) {
  const { productName, newBalance } = route?.params ?? {};

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        </View>
        <Text style={styles.title}>¡Canje realizado!</Text>
        {productName && (
          <Text style={styles.subtitle}>Has canjeado "{productName}" correctamente.</Text>
        )}
        {newBalance !== undefined && (
          <Text style={styles.balance}>Nuevo saldo: {newBalance.toLocaleString()} O</Text>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('StoreHome')}
          accessibilityLabel="Volver a la tienda"
        >
          <Text style={styles.buttonText}>Volver a la tienda</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  balance: {
    fontSize: 14,
    color: ACCENT,
    fontWeight: '700',
    marginBottom: 32,
  },
  button: {
    backgroundColor: ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
