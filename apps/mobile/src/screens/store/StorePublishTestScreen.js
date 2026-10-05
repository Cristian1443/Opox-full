import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import { colors } from '../../theme';

const PHASE2_DARK = '#7B1FA2';

// Publicar test en la comunidad — Fase 2, pendiente de mockup
export default function StorePublishTestScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Publicar test"
        onBack={() => navigation.goBack()}
        style={styles.headerBar}
      />
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
  // Banda blanca con separador: el fondo de la pantalla es gris.
  headerBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
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
