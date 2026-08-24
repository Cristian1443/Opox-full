import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Banner de notificación in-app.
 * Aparece sobre cualquier pantalla durante 4 s y desaparece sólo.
 *
 * Props:
 *   visible  {boolean}          — controla la visibilidad
 *   title    {string}
 *   body     {string}
 *   type     {'boe_alert'|'note_ready'|'streak_warning'|'daily_reminder'}
 *   onPress  {() => void}       — acción al tocar el banner
 *   onDismiss {() => void}      — llamado al cerrar (automático o manual)
 */
export default function InAppNotificationBanner({
  visible,
  title,
  body,
  type = 'daily_reminder',
  onPress,
  onDismiss,
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const iconMap = {
    boe_alert:       { name: 'document-text', color: '#2D6FB0' },
    note_ready:      { name: 'checkmark-circle', color: '#1f9d6b' },
    streak_warning:  { name: 'flame', color: '#F26C4F' },
    daily_reminder:  { name: 'notifications', color: '#7B4BC4' },
  };
  const icon = iconMap[type] ?? iconMap.daily_reminder;

  useEffect(() => {
    if (visible) {
      // Entrar
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // Auto-dismiss a los 4 s
      timer.current = setTimeout(() => {
        dismiss();
      }, 4000);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => { if (onDismiss) onDismiss(); });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, opacity, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={() => {
          dismiss();
          if (onPress) onPress();
        }}
        activeOpacity={0.9}
      >
        <View style={[styles.iconWrap, { backgroundColor: icon.color + '22' }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.body} numberOfLines={2}>{body}</Text>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#1C1C1E',
    marginBottom: 1,
  },
  body: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#636366',
    lineHeight: 16,
  },
});
