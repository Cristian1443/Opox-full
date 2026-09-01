import React from 'react';
import Svg, { Path } from 'react-native-svg';
import AlertCardModal from './AlertCardModal';
import { colors } from '../theme';

// ─── 11.4 · Opopoints insuficientes ───────────────────────────────────────
// Fiel al Figma (TiendaModalesScreen.tsx → OpopointsInsuficientesModal).
// Compartido entre StoreProductDetailScreen, StoreDiscountsScreen,
// StoreRealRewardsScreen y StoreRealRewardDetailScreen — solo se ajustan
// las props que ya recibía (cost, currentBalance), sin tocar AlertCardModal.

// Ícono de diamante/gema — mismo lenguaje visual que el resto de Tienda
// (StoreHomeScreen, StoreProductDetailScreen).
function GemIcon({ size = 56, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 8L2 3L7 3L12 3L17 3L22 3L19 8L12 21L5 8Z" fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M2 3L22 3M5 8L19 8M9 3L12 8L15 3" stroke={color} strokeWidth={1} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

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

  return (
    <AlertCardModal
      visible={visible}
      iconBg="transparent"
      iconSize={64}
      icon={<GemIcon />}
      title={`Te faltan ${missing.toLocaleString('es-ES')} Opopoints`}
      description={`Este pack cuesta ${cost.toLocaleString('es-ES')} y tienes ${currentBalance.toLocaleString('es-ES')}. Sigue tu racha y completa retos para ganar más.`}
      primaryLabel="Cómo ganar Opopoints"
      primaryColor={colors.accentOrange}
      onPrimaryPress={handleHowToEarn}
      secondaryLabel="Cerrar"
      onSecondaryPress={onClose}
    />
  );
}
