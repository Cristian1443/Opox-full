import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const PHASE2_DARK = '#7B1FA2';

// Publicar test en la comunidad — Fase 2, pendiente de mockup
export default function StorePublishTestScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={PHASE2_DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Publicar test</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.body}>
        <View style={styles.phase2Badge}>
          <Text style={styles.phase2Text}>FASE 2</Text>
        </View>
        <Ionicons name="pencil-outline" size={64} color={PHASE2_DARK} />
        <Text style={styles.placeholder}>Próximamente (Fase 2)</Text>
        <Text style={styles.desc}>
          Podrás publicar tus propios tests para que otros opositores los practiquen y valoren.
        </Text>
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  phase2Badge: {
    backgroundColor: PHASE2_DARK,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phase2Text: { color: colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  placeholder: { fontSize: 18, fontWeight: '700', color: colors.text },
  desc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
