import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const ACCENT = '#6C5CE7';

const EARN_METHODS = [
  { icon: 'school-outline', title: 'Completa tests diarios', points: '+10 O por test' },
  { icon: 'flame-outline', title: 'Mantén tu racha', points: '+5 O por día de racha' },
  { icon: 'trophy-outline', title: 'Sube en el ranking', points: '+50 O al top 10 semanal' },
  { icon: 'people-outline', title: 'Invita a un amigo', points: '+100 O por referido activo' },
  { icon: 'checkmark-done-outline', title: 'Completa tu plan diario', points: '+15 O por plan cumplido' },
];

export default function StoreHowToEarnScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={ACCENT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cómo ganar Opopoints</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.heroIcon}>
          <Ionicons name="gift-outline" size={48} color={ACCENT} />
        </View>
        <Text style={styles.subtitle}>
          Gana Opopoints completando actividades dentro de la app y canjéalos en la tienda.
        </Text>

        {EARN_METHODS.map((method, i) => (
          <View key={i} style={styles.methodRow}>
            <View style={styles.methodIcon}>
              <Ionicons name={method.icon} size={24} color={ACCENT} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>{method.title}</Text>
              <Text style={styles.methodPoints}>{method.points}</Text>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  methodPoints: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: '700',
  },
});
