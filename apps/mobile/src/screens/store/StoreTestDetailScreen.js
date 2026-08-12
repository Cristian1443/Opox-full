import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const ACCENT = '#6C5CE7';

// Detalle de test de comunidad — pendiente de mockup
export default function StoreTestDetailScreen({ navigation, route }) {
  const { test } = route?.params ?? {};
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={ACCENT} />
        </TouchableOpacity>
        <Text style={styles.title}>{test?.title ?? 'Detalle del test'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.body}>
        <Ionicons name="document-text-outline" size={64} color={ACCENT} />
        <Text style={styles.placeholder}>Próximamente (mockup pendiente)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  placeholder: { fontSize: 15, color: colors.textSecondary },
});
