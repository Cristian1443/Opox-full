import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import { colors } from '../../theme';

const ACCENT = '#6C5CE7';

// Detalle de test de comunidad — pendiente de mockup
export default function StoreTestDetailScreen({ navigation, route }) {
  const { test } = route?.params ?? {};
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        title={test?.title ?? 'Detalle del test'}
        onBack={() => navigation.goBack()}
        style={styles.headerBar}
      />
      <View style={styles.body}>
        <Ionicons name="document-text-outline" size={64} color={ACCENT} />
        <Text style={styles.placeholder}>Próximamente (mockup pendiente)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // Banda blanca con separador: el fondo de la pantalla es gris.
  headerBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  placeholder: { fontSize: 15, color: colors.textSecondary },
});
