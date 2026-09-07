import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, storeApi, settingsApi } from '../api';
import { colors, spacing } from '../theme';

// ─── 12.1 · Ajustes · hub principal ────────────────────────────────────────
// Fiel al Figma (HomeConfigScreen.tsx). El reference no muestra la fila
// "Tu opinión" (Feedback) ni las acciones de sesión (cerrar sesión / eliminar
// cuenta) — son funcionalidad real imprescindible (sin logout no hay forma
// de salir de la cuenta) y se conservan, añadidas al final de la lista plana
// que sí confirma Figma. El saldo de Opopoints en el header es un dato real
// (mismo sistema de Bloque 11 · Tienda) que se conecta con storeApi.getBalance().
// El tono de la IA y la probabilidad de aprobado también son datos reales
// (GET /config/preferences y GET /config/pro-stats) en vez de los valores
// fijos que mostraba el diseño.
const TONE_KEY = 'opox.ai.tone';
const PERSONALITY_LABELS = { cercano: 'Cercano', equilibrado: 'Equilibrado', exigente: 'Exigente' };

const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  separator: 'rgba(65, 41, 80, 0.12)',
  highlightBg: '#F5F5F7',
};

function resetToSplash(navigation) {
  navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
}

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Ruta exacta exportada de Figma (avatar circular, 355×355).
function AvatarIcon({ size = 96 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 355 355">
      <Path d="M177.31 0C79.54 0 0 79.54 0 177.31C0 276.82 81 354.56 177.31 354.56C273.31 354.56 354.61 277.11 354.61 177.31C354.61 79.54 275.07 0 177.31 0Z" fill={colors.white} />
      <Path d="M177.31 0C79.54 0 0 79.54 0 177.31C0 276.82 81 354.56 177.31 354.56C273.31 354.56 354.61 277.11 354.61 177.31C354.61 79.54 275.07 0 177.31 0ZM84.17 304.93C91.9993 286.722 104.994 271.208 121.547 260.308C138.1 249.407 157.485 243.597 177.305 243.597C197.125 243.597 216.51 249.407 233.063 260.308C249.616 271.208 262.611 286.722 270.44 304.93C243.423 324.728 210.8 335.401 177.305 335.401C143.81 335.401 111.187 324.728 84.17 304.93ZM285.67 292.39C275.818 272.025 260.426 254.848 241.26 242.829C222.093 230.81 199.928 224.435 177.305 224.435C154.682 224.435 132.517 230.81 113.35 242.829C94.1839 254.848 78.7923 272.025 68.94 292.39C53.1975 277.645 40.6549 259.82 32.0913 240.023C23.5278 220.226 19.1262 198.88 19.16 177.31C19.16 90.1 90.1 19.16 177.31 19.16C264.52 19.16 335.45 90.1 335.45 177.31C335.487 198.88 331.087 220.228 322.524 240.025C313.96 259.823 301.415 277.647 285.67 292.39Z" fill={colors.purple} stroke={colors.purple} strokeWidth={1.5} />
      <Path d="M177.31 87.61C165.177 87.608 153.316 91.2041 143.228 97.9435C133.139 104.683 125.275 114.263 120.631 125.472C115.987 136.68 114.772 149.015 117.138 160.914C119.505 172.814 125.347 183.745 133.926 192.324C142.505 200.903 153.436 206.745 165.336 209.112C177.235 211.478 189.57 210.263 200.778 205.619C211.987 200.975 221.567 193.111 228.307 183.022C235.046 172.934 238.642 161.073 238.64 148.94C238.621 132.68 232.154 117.091 220.656 105.594C209.159 94.096 193.57 87.6285 177.31 87.61ZM177.31 191.12C168.967 191.122 160.811 188.65 153.873 184.016C146.936 179.383 141.528 172.796 138.334 165.089C135.14 157.381 134.303 148.9 135.929 140.717C137.556 132.534 141.572 125.018 147.471 119.118C153.369 113.218 160.885 109.2 169.067 107.571C177.25 105.943 185.731 106.778 193.439 109.97C201.147 113.162 207.735 118.568 212.371 125.505C217.006 132.442 219.48 140.597 219.48 148.94C219.467 160.121 215.02 170.84 207.115 178.748C199.209 186.655 188.491 191.104 177.31 191.12Z" fill={colors.purple} stroke={colors.purple} strokeWidth={1.5} />
    </Svg>
  );
}

// Ruta exacta exportada de Figma (icono "Perfil y biometría", 87×94).
function PersonIcon({ size = 22, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size * (94 / 87)} viewBox="0 0 87 94" fill="none">
      <Path d="M58.8831 46.4993C67.4434 37.939 67.4434 24.06 58.8831 15.4997C50.3228 6.93944 36.4439 6.93944 27.8836 15.4997C19.3233 24.06 19.3233 37.939 27.8836 46.4993C36.4439 55.0596 50.3228 55.0596 58.8831 46.4993Z" stroke={color} strokeWidth={5.77} strokeMiterlimit={10} strokeLinecap="round" />
      <Path d="M2.88574 90.9745C5.78259 82.5361 11.2429 75.2132 18.5039 70.029C25.7649 64.8447 34.4639 62.0579 43.3857 62.0579C52.3076 62.0579 61.0066 64.8447 68.2676 70.029C75.5286 75.2132 80.9889 82.5361 83.8857 90.9745" stroke={color} strokeWidth={5.77} strokeMiterlimit={10} strokeLinecap="round" />
    </Svg>
  );
}

// Ruta exacta exportada de Figma (icono "Suscripción", 83×56).
function CardIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size * (56 / 83)} viewBox="0 0 83 56" fill="none">
      <Path d="M76.4447 0H6.55531C4.81725 0.00165989 3.15086 0.683214 1.92186 1.89508C0.69287 3.10695 0.00168335 4.75011 0 6.46395L0 49.5298C-8.16489e-07 51.2447 0.690443 52.8895 1.91962 54.1027C3.1488 55.3159 4.81615 55.9983 6.55531 56H76.4447C78.1839 55.9983 79.8512 55.3159 81.0804 54.1027C82.3096 52.8895 83 51.2447 83 49.5298V6.46395C82.9983 4.75011 82.3071 3.10695 81.0781 1.89508C79.8491 0.683214 78.1828 0.00165989 76.4447 0ZM4.36809 17.2288H78.6319V21.536H4.36809V17.2288ZM6.55531 4.30721H76.4447C77.0248 4.30721 77.5811 4.53444 77.9913 4.9389C78.4015 5.34337 78.6319 5.89195 78.6319 6.46395V12.9216H4.36809V6.46395C4.36809 5.89195 4.59853 5.34337 5.00871 4.9389C5.41889 4.53444 5.97522 4.30721 6.55531 4.30721ZM76.4447 51.6865H6.55531C6.26784 51.6874 5.98305 51.6321 5.7173 51.524C5.45156 51.4159 5.21011 51.2571 5.00684 51.0567C4.80357 50.8562 4.64249 50.6182 4.53287 50.3561C4.42325 50.0941 4.36725 49.8132 4.36809 49.5298V25.8433H78.6319V49.5298C78.6328 49.8132 78.5768 50.0941 78.4671 50.3561C78.3575 50.6182 78.1964 50.8562 77.9932 51.0567C77.7899 51.2571 77.5484 51.4159 77.2827 51.524C77.017 51.6321 76.7322 51.6874 76.4447 51.6865Z" fill={color} />
      <Path d="M10.9233 38.7649H19.6594C20.2183 38.7352 20.7443 38.4953 21.1293 38.0947C21.5142 37.6941 21.7288 37.1632 21.7288 36.6113C21.7288 36.0595 21.5142 35.5286 21.1293 35.128C20.7443 34.7273 20.2183 34.4875 19.6594 34.4577H10.9233C10.6265 34.4419 10.3297 34.4859 10.0508 34.587C9.77185 34.6881 9.51675 34.8442 9.30104 35.0457C9.08533 35.2473 8.91353 35.49 8.79612 35.7592C8.67872 36.0284 8.61816 36.3183 8.61816 36.6113C8.61816 36.9043 8.67872 37.1943 8.79612 37.4635C8.91353 37.7326 9.08533 37.9754 9.30104 38.1769C9.51675 38.3785 9.77185 38.5345 10.0508 38.6356C10.3297 38.7367 10.6265 38.7807 10.9233 38.7649Z" fill={color} />
      <Path d="M28.3959 38.7649H37.1321C37.691 38.7352 38.217 38.4953 38.6019 38.0947C38.9869 37.6941 39.2014 37.1632 39.2014 36.6113C39.2014 36.0595 38.9869 35.5286 38.6019 35.128C38.217 34.7273 37.691 34.4875 37.1321 34.4577H28.3959C28.0992 34.4419 27.8023 34.4859 27.5234 34.587C27.2445 34.6881 26.9894 34.8442 26.7737 35.0457C26.558 35.2473 26.3862 35.49 26.2688 35.7592C26.1514 36.0284 26.0908 36.3183 26.0908 36.6113C26.0908 36.9043 26.1514 37.1943 26.2688 37.4635C26.3862 37.7326 26.558 37.9754 26.7737 38.1769C26.9894 38.3785 27.2445 38.5345 27.5234 38.6356C27.8023 38.7367 28.0992 38.7807 28.3959 38.7649Z" fill={color} />
      <Path d="M41.4999 43.072H10.9233C10.6265 43.0562 10.3297 43.1002 10.0508 43.2013C9.77185 43.3024 9.51675 43.4585 9.30104 43.66C9.08533 43.8615 8.91353 44.1043 8.79612 44.3735C8.67872 44.6426 8.61816 44.9326 8.61816 45.2256C8.61816 45.5186 8.67872 45.8085 8.79612 46.0777C8.91353 46.3469 9.08533 46.5897 9.30104 46.7912C9.51675 46.9927 9.77185 47.1488 10.0508 47.2499C10.3297 47.351 10.6265 47.395 10.9233 47.3792H41.4999C42.0587 47.3494 42.5848 47.1096 42.9697 46.709C43.3547 46.3084 43.5692 45.7775 43.5692 45.2256C43.5692 44.6737 43.3547 44.1428 42.9697 43.7422C42.5848 43.3416 42.0587 43.1017 41.4999 43.072Z" fill={color} />
    </Svg>
  );
}

// Ruta exacta exportada de Figma (icono "Dispositivos conectados", 60×91).
function DeviceIcon({ size = 16, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size * (91 / 60)} viewBox="0 0 60 91" fill="none">
      <Path d="M51.9966 91H7.98145C3.57993 91 -0.0219727 87.7216 -0.0219727 83.6942V7.29839C3.49227e-05 3.27093 3.58727 0 8.00346 0H52.0186C56.4201 0 60.022 3.27093 60.022 7.29839V83.6942C60 87.7216 56.4128 91 51.9966 91ZM8.00346 5.05844C6.3749 5.05844 5.00309 6.082 5.00309 7.28356V83.6794C5.00309 84.8958 6.3749 85.9045 8.00346 85.9045H52.0186C53.6472 85.9045 55.019 84.8735 55.019 83.6794V7.29839C55.019 6.082 53.6472 5.07327 52.0186 5.07327L8.00346 5.05844Z" fill={color} />
      <Path d="M57.4985 15.1678H2.47956C1.81611 15.1678 1.17984 14.9013 0.710708 14.427C0.24158 13.9527 -0.0219727 13.3094 -0.0219727 12.6386C-0.0219727 11.9678 0.24158 11.3245 0.710708 10.8502C1.17984 10.3758 1.81611 10.1094 2.47956 10.1094H57.4985C58.1619 10.1094 58.7982 10.3758 59.2674 10.8502C59.7365 11.3245 60 11.9678 60 12.6386C60 13.3094 59.7365 13.9527 59.2674 14.427C58.7982 14.9013 58.1619 15.1678 57.4985 15.1678Z" fill={color} />
      <Path d="M57.4987 70.7737H2.47972C2.14031 70.7923 1.80071 70.7408 1.48165 70.6223C1.16259 70.5038 0.870769 70.3208 0.623997 70.0844C0.377225 69.8481 0.180682 69.5634 0.0463641 69.2477C-0.0879534 68.932 -0.157227 68.5919 -0.157227 68.2482C-0.157227 67.9045 -0.0879534 67.5645 0.0463641 67.2488C0.180682 66.9331 0.377225 66.6484 0.623997 66.412C0.870769 66.1757 1.16259 65.9927 1.48165 65.8741C1.80071 65.7556 2.14031 65.7041 2.47972 65.7227H57.4987C57.8381 65.7041 58.1777 65.7556 58.4967 65.8741C58.8158 65.9927 59.1076 66.1757 59.3544 66.412C59.6012 66.6484 59.7977 66.9331 59.932 67.2488C60.0663 67.5645 60.1356 67.9045 60.1356 68.2482C60.1356 68.5919 60.0663 68.932 59.932 69.2477C59.7977 69.5634 59.6012 69.8481 59.3544 70.0844C59.1076 70.3208 58.8158 70.5038 58.4967 70.6223C58.1777 70.7408 57.8381 70.7923 57.4987 70.7737Z" fill={color} />
      <Path d="M37.5011 80.8831H22.4992C22.1598 80.9017 21.8202 80.8502 21.5012 80.7317C21.1821 80.6131 20.8903 80.4301 20.6435 80.1938C20.3968 79.9574 20.2002 79.6727 20.0659 79.357C19.9316 79.0413 19.8623 78.7013 19.8623 78.3576C19.8623 78.0139 19.9316 77.6739 20.0659 77.3582C20.2002 77.0425 20.3968 76.7577 20.6435 76.5214C20.8903 76.2851 21.1821 76.102 21.5012 75.9835C21.8202 75.865 22.1598 75.8135 22.4992 75.8321H37.5011C37.8405 75.8135 38.1801 75.865 38.4992 75.9835C38.8182 76.102 39.11 76.2851 39.3568 76.5214C39.6036 76.7577 39.8001 77.0425 39.9344 77.3582C40.0688 77.6739 40.138 78.0139 40.138 78.3576C40.138 78.7013 40.0688 79.0413 39.9344 79.357C39.8001 79.6727 39.6036 79.9574 39.3568 80.1938C39.11 80.4301 38.8182 80.6131 38.4992 80.7317C38.1801 80.8502 37.8405 80.9017 37.5011 80.8831Z" fill={color} />
    </Svg>
  );
}

// Ruta exacta exportada de Figma (icono "Tono de la IA", 70×67 — doble destello).
function SparkleIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size * (67 / 70)} viewBox="0 0 70 67" fill="none">
      <Path d="M52.2015 56.7387C53.2065 56.7375 54.2017 56.9377 55.1293 57.3276C56.0568 57.7175 56.8982 58.2894 57.6045 59.0099C58.3181 59.7313 58.8833 60.5877 59.2675 61.5298C59.6517 62.472 59.8474 63.4814 59.8433 64.5C59.8419 63.4805 60.0403 62.4707 60.4271 61.5286C60.8138 60.5865 61.3813 59.7306 62.097 59.0099C62.8033 58.2894 63.6447 57.7175 64.5722 57.3276C65.4998 56.9377 66.495 56.7375 67.5 56.7387C66.495 56.7399 65.4998 56.5397 64.5722 56.1498C63.6447 55.7599 62.8033 55.188 62.097 54.4675C61.3813 53.7469 60.8138 52.891 60.4271 51.9489C60.0403 51.0068 59.8419 49.997 59.8433 48.9774C59.8474 49.9961 59.6517 51.0054 59.2675 51.9476C58.8833 52.8898 58.3181 53.7461 57.6045 54.4675C56.8982 55.188 56.0568 55.7599 55.1293 56.1498C54.2017 56.5397 53.2065 56.7399 52.2015 56.7387ZM52.2015 10.2011C53.2107 10.2078 54.2085 10.4174 55.1363 10.8178C56.064 11.2181 56.9032 11.8011 57.6045 12.5325C58.3181 13.2539 58.8833 14.1102 59.2675 15.0524C59.6517 15.9946 59.8474 17.0039 59.8433 18.0226C59.8419 17.003 60.0403 15.9932 60.4271 15.0511C60.8138 14.109 61.3813 13.2531 62.097 12.5325C62.8033 11.812 63.6447 11.2401 64.5722 10.8502C65.4998 10.4603 66.495 10.2601 67.5 10.2613C66.495 10.2625 65.4998 10.0623 64.5722 9.67237C63.6447 9.28246 62.8033 8.7106 62.097 7.99005C61.3813 7.26944 60.8138 6.41354 60.4271 5.47143C60.0403 4.52933 59.8419 3.51954 59.8433 2.5C59.8474 3.51861 59.6517 4.52801 59.2675 5.47017C58.8833 6.41234 58.3181 7.2687 57.6045 7.99005C56.8933 8.69974 56.0497 9.2605 55.1224 9.63999C54.195 10.0195 53.2023 10.2102 52.2015 10.2011ZM25.4403 56.7387C25.439 50.5759 27.8529 44.6618 32.1567 40.2836C34.276 38.1309 36.796 36.4209 39.5724 35.2517C42.3487 34.0825 45.3268 33.477 48.3358 33.4699C45.3193 33.4688 42.3327 32.8662 39.5483 31.6968C36.7638 30.5274 34.2365 28.8143 32.1119 26.6562C27.8081 22.278 25.3942 16.364 25.3955 10.2011C25.3968 16.364 22.983 22.278 18.6791 26.6562C16.5598 28.8089 14.0398 30.5189 11.2634 31.6881C8.48707 32.8574 5.50902 33.4629 2.5 33.4699C5.51656 33.471 8.50309 34.0736 11.2875 35.243C14.072 36.4125 16.5993 38.1255 18.7239 40.2836C23.0277 44.6618 25.4416 50.5759 25.4403 56.7387Z" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Ruta exacta exportada de Figma (icono "Estadísticas Pro", 72×68 — marco+barras).
function ChartIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size * (68 / 72)} viewBox="0 0 72 68" fill="none">
      <Path d="M70.1041 68H1.89591C1.39308 68 0.91085 67.8009 0.555298 67.4464C0.199747 67.092 0 66.6113 0 66.11L0 1.88997C7.49269e-09 1.38872 0.199747 0.907996 0.555298 0.553558C0.91085 0.199121 1.39308 0 1.89591 0C2.39873 0 2.88096 0.199121 3.23652 0.553558C3.59207 0.907996 3.79181 1.38872 3.79181 1.88997V64.2201H70.1041C70.6069 64.2201 71.0891 64.4192 71.4447 64.7736C71.8003 65.1281 72 65.6088 72 66.11C72 66.6113 71.8003 67.092 71.4447 67.4464C71.0891 67.8009 70.6069 68 70.1041 68Z" fill={color} />
      <Path d="M24.6299 68.0001H9.45157C8.94875 68.0001 8.46651 67.8009 8.11096 67.4465C7.75541 67.0921 7.55566 66.6113 7.55566 66.1101V47.2215C7.55566 46.7203 7.75541 46.2395 8.11096 45.8851C8.46651 45.5307 8.94875 45.3316 9.45157 45.3316H24.6299C24.8791 45.3308 25.126 45.3792 25.3563 45.4739C25.5867 45.5686 25.796 45.7078 25.9722 45.8835C26.1484 46.0591 26.288 46.2678 26.383 46.4974C26.4781 46.727 26.5266 46.9731 26.5259 47.2215V66.1101C26.5259 66.6113 26.3261 67.0921 25.9706 67.4465C25.615 67.8009 25.1328 68.0001 24.6299 68.0001ZM11.3697 64.2201H22.7396V49.1115H11.3697V64.2201Z" fill={color} />
      <Path d="M47.3699 68H32.2082C31.7064 67.9985 31.2256 67.7987 30.8712 67.4445C30.5169 67.0902 30.3179 66.6103 30.3179 66.11V28.3328C30.3179 27.8325 30.5169 27.3527 30.8712 26.9984C31.2256 26.6441 31.7064 26.4443 32.2082 26.4429H47.3699C47.8727 26.4429 48.355 26.642 48.7105 26.9964C49.0661 27.3509 49.2658 27.8316 49.2658 28.3328V66.11C49.2658 66.6113 49.0661 67.092 48.7105 67.4464C48.355 67.8008 47.8727 68 47.3699 68ZM34.1041 64.22H45.474V30.2228H34.1041V64.22Z" fill={color} />
      <Path d="M70.1043 68.0001H54.9482C54.4453 68.0001 53.9631 67.8009 53.6075 67.4465C53.252 67.0921 53.0522 66.6114 53.0522 66.1101V9.42219C53.0522 8.92094 53.252 8.44022 53.6075 8.08579C53.9631 7.73135 54.4453 7.53223 54.9482 7.53223H70.1043C70.6071 7.53223 71.0894 7.73135 71.4449 8.08579C71.8005 8.44022 72.0002 8.92094 72.0002 9.42219V66.1101C72.0002 66.6114 71.8005 67.0921 71.4449 67.4465C71.0894 67.8009 70.6071 68.0001 70.1043 68.0001ZM56.8441 64.2201H68.2139V11.3343H56.8441V64.2201Z" fill={color} />
    </Svg>
  );
}

// Ruta exacta exportada de Figma (icono "Accesibilidad", 91×91).
function AccessibilityIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 91 91" fill="none">
      <Path d="M45.7809 5.90937C23.7931 5.76049 5.88607 23.6466 5.9092 45.5738C5.93234 67.3336 23.6849 85.0829 45.5061 85.0903C67.3273 85.0977 85.0891 67.3493 85.091 45.5239C85.1243 23.7761 67.4707 6.05825 45.7809 5.90937ZM45.3886 83.1372C24.5861 83.0669 7.83945 66.1167 7.86628 45.4332C7.92643 24.6425 24.8351 7.82356 45.5746 7.86702C66.4186 7.91141 83.207 24.8941 83.1431 45.6173C83.0709 66.4237 66.1086 83.2075 45.3886 83.1382V83.1372Z" fill={color} stroke={color} strokeWidth={1.5} />
      <Path d="M63.4401 24.1761C58.9325 26.8658 54.4271 29.5573 49.924 32.2507C49.0972 32.7657 48.1362 33.0418 47.1534 33.0466C46.0353 33.0466 44.9172 33.0521 43.7982 33.0466C42.863 33.0436 41.9474 32.7856 41.1563 32.3021C39.9909 31.604 38.8243 30.908 37.6564 30.2142C34.2634 28.1886 30.8789 26.1493 27.4736 24.1431C26.2742 23.4361 25.0237 23.4645 23.8697 24.2503C22.7157 25.0362 22.2711 26.1466 22.5227 27.4945C22.6911 28.3995 23.234 29.0671 23.9974 29.5961C26.9959 31.6746 29.9898 33.7591 32.9789 35.8497C35.249 37.4342 36.4059 39.5835 36.4144 42.2977C36.4248 45.3695 36.4144 48.4413 36.4144 51.5121C36.4144 53.6614 35.8809 55.6787 34.8943 57.6006C32.6784 61.9213 30.476 66.2496 28.2871 70.5855C27.4301 72.2782 27.782 74.2854 29.1063 75.5435C31.1873 77.5232 34.4242 77.1536 36.0238 74.7283C38.748 70.5984 41.4618 66.4617 44.1652 62.3183C44.5937 61.6655 45.0241 61.0135 45.4971 60.2946C45.6569 60.534 45.76 60.6862 45.8613 60.8402C48.9213 65.5056 51.9681 70.1793 55.048 74.8319C55.6594 75.7541 56.6125 76.4138 57.7109 76.675C58.8092 76.9363 59.969 76.7791 60.9513 76.236C61.9337 75.6928 62.6637 74.8051 62.9908 73.7557C63.318 72.7063 63.2174 71.5753 62.7099 70.5956C60.6582 66.5363 58.6302 62.4641 56.5047 58.4415C55.188 55.9501 54.4757 53.3754 54.558 50.5631C54.6346 47.9223 54.6043 45.2769 54.5665 42.6333C54.5239 39.6386 55.7839 37.3508 58.3048 35.6379C61.2721 33.6206 64.2006 31.5557 67.133 29.4944C68.6256 28.4435 68.9785 26.5409 67.9843 25.1022C66.975 23.6305 65.0255 23.2298 63.4401 24.1761ZM65.8513 27.9961C63.7501 29.4534 61.652 30.9141 59.5572 32.3782C58.5725 33.064 57.5707 33.7334 56.6078 34.4431C54.0198 36.343 52.6397 38.8793 52.5848 42.0235C52.5271 45.2769 52.5602 48.5339 52.5763 51.7872C52.5877 54.3968 53.4097 56.7901 54.6148 59.1026C56.7308 63.1638 58.7834 67.257 60.8578 71.3393C61.5928 72.7862 60.9391 74.3313 59.4172 74.7677C59.2326 74.8126 59.0452 74.8456 58.8562 74.8668C57.8205 74.8402 57.129 74.4083 56.6286 73.6427C55.2741 71.5639 53.9072 69.4925 52.546 67.4184C50.6252 64.4933 48.7063 61.5677 46.7892 58.6414C46.6549 58.436 46.5338 58.2214 46.4061 58.0105C45.9804 57.3036 45.0412 57.299 44.5928 57.9867C41.5028 62.7236 38.409 67.4585 35.3115 72.1911C34.9747 72.7064 34.6399 73.2245 34.2956 73.7362C33.5559 74.8365 32.172 75.1776 31.0265 74.5495C29.9179 73.9407 29.495 72.6065 30.0806 71.4447C32.329 67.003 34.5964 62.5705 36.8467 58.1297C37.872 56.1218 38.4067 53.9121 38.4093 51.6717C38.4198 48.5091 38.4368 45.3447 38.4046 42.1831C38.3715 38.927 36.9857 36.2999 34.2795 34.3753C31.2932 32.2544 28.2729 30.1802 25.2687 28.085C25.112 27.9829 24.964 27.8688 24.826 27.7439C24.6152 27.5341 24.4866 27.2595 24.4622 26.9676C24.4379 26.6757 24.5194 26.3847 24.6926 26.1448C24.8623 25.902 25.1161 25.7262 25.408 25.6494C25.6999 25.5725 26.0106 25.5996 26.2837 25.7257C26.5916 25.8792 26.8909 26.0485 27.1804 26.2328C31.4578 28.7874 35.7343 31.3435 40.0098 33.9012C41.2038 34.63 42.5888 35.0104 43.9997 34.997C45.2436 34.9887 46.4884 35.0061 47.7304 34.9557C48.9024 34.908 49.9713 34.5064 50.9673 33.9104C55.4446 31.2323 59.922 28.5566 64.3993 25.8834C65.3651 25.3057 66.4396 25.7477 66.5285 26.7664C66.5721 27.3056 66.2921 27.6907 65.8513 27.9961Z" fill={color} stroke={color} strokeWidth={1.5} />
      <Path d="M45.5118 29.5448C47.0314 29.5425 48.5162 29.0895 49.7783 28.2432C51.0405 27.3969 52.0233 26.1953 52.6024 24.7903C53.1814 23.3854 53.3308 21.8402 53.0316 20.3503C52.7324 18.8605 51.998 17.4928 50.9213 16.4204C49.8447 15.348 48.4741 14.619 46.9831 14.3256C45.492 14.0323 43.9475 14.1878 42.5448 14.7724C41.1422 15.357 39.9444 16.3445 39.1031 17.61C38.2618 18.8755 37.8147 20.3621 37.8184 21.8817C37.8233 23.9178 38.6365 25.8686 40.079 27.3055C41.5216 28.7424 43.4757 29.5479 45.5118 29.5448ZM45.526 16.0648C46.296 16.071 47.0571 16.2303 47.765 16.5333C48.4728 16.8364 49.1134 17.2772 49.6493 17.8301C50.1852 18.383 50.6058 19.037 50.8866 19.754C51.1674 20.4709 51.3028 21.2366 51.285 22.0064C51.2253 25.1465 48.5628 27.7154 45.4191 27.6673C43.8794 27.6397 42.4133 27.003 41.342 25.8967C40.2706 24.7905 39.6813 23.3048 39.703 21.7649C39.7511 18.6088 42.4011 16.0149 45.526 16.0648Z" fill={color} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

// Ruta exacta exportada de Figma (icono "Ayuda y soporte", 82×82 — flecha refresh/soporte).
function HelpIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 82 82" fill="none">
      <Path d="M40.6301 61.1401C36.5712 61.1421 32.6029 59.9403 29.2271 57.6867C25.8513 55.4332 23.2196 52.2291 21.665 48.4797C20.1103 44.7303 19.7025 40.6041 20.4932 36.623C21.2838 32.6418 23.2374 28.9846 26.1067 26.1138C28.9761 23.243 32.6324 21.2877 36.6132 20.4951C40.5939 19.7025 44.7203 20.1083 48.4705 21.6611C52.2206 23.214 55.426 25.8441 57.6812 29.2188C59.9364 32.5935 61.1401 36.5612 61.1401 40.6201C61.1348 46.059 58.9726 51.2737 55.1276 55.1206C51.2827 58.9674 46.069 61.1322 40.6301 61.1401ZM40.6301 25.0801C37.5538 25.0781 34.5459 25.9887 31.9872 27.6966C29.4285 29.4045 27.4339 31.833 26.2557 34.6748C25.0775 37.5166 24.7687 40.644 25.3684 43.6613C25.9681 46.6786 27.4493 49.4503 29.6246 51.6256C31.7999 53.8009 34.5716 55.2821 37.5889 55.8818C40.6062 56.4815 43.7337 56.1727 46.5755 54.9945C49.4173 53.8163 51.8457 51.8217 53.5536 49.263C55.2615 46.7043 56.1721 43.6965 56.1701 40.6201C56.1648 36.5003 54.5259 32.5507 51.6127 29.6375C48.6995 26.7243 44.7499 25.0854 40.6301 25.0801Z" fill={color} />
      <Path d="M40.63 81.24C32.5957 81.242 24.7413 78.8614 18.06 74.3992C11.3788 69.937 6.17087 63.5937 3.0949 56.1715C0.0189373 48.7494 -0.786901 40.5817 0.779301 32.7016C2.3455 24.8214 6.2134 17.5827 11.8938 11.9009C17.5742 6.21907 24.812 2.34939 32.6918 0.781252C40.5715 -0.78689 48.7394 0.016937 56.1623 3.09107C63.5852 6.16521 69.9298 11.3716 74.3936 18.0517C78.8574 24.7319 81.24 32.5857 81.24 40.62C81.2294 51.3881 76.9478 61.7123 69.3345 69.3275C61.7213 76.9426 51.3981 81.2268 40.63 81.24ZM40.63 5.01002C33.5794 5.00804 26.6866 7.09737 20.8237 11.0137C14.9607 14.93 10.3911 20.4973 7.69296 27.0112C4.9948 33.5251 4.28934 40.693 5.66582 47.6079C7.0423 54.5229 10.4389 60.8742 15.4258 65.8584C20.4128 70.8425 26.766 74.2355 33.6817 75.6081C40.5975 76.9807 47.7649 76.2712 54.2773 73.5694C60.7898 70.8676 66.3545 66.2949 70.2675 60.4297C74.1805 54.5646 76.266 47.6706 76.26 40.62C76.2415 31.1779 72.4811 22.1281 65.8026 15.4533C59.1241 8.77859 50.0722 5.02323 40.63 5.01002Z" fill={color} />
      <Path d="M56.7703 28.0101L69.8903 14.8801L66.3703 11.3601L53.2603 24.4801C54.572 25.5068 55.751 26.6925 56.7703 28.0101Z" fill={color} />
      <Path d="M24.4804 53.26L11.3604 66.37L14.8804 69.88L28.0104 56.77C26.6928 55.7508 25.507 54.5718 24.4804 53.26Z" fill={color} />
      <Path d="M28.0104 24.4801L14.8804 11.3601L11.3604 14.8801L24.4804 28.0101C25.5058 26.6913 26.6916 25.5055 28.0104 24.4801Z" fill={color} />
      <Path d="M53.2603 56.77L66.3703 69.88L69.8903 66.37L56.7703 53.26C55.7498 54.5705 54.5708 55.7495 53.2603 56.77Z" fill={color} />
    </Svg>
  );
}

// Sin equivalente en Figma (la fila "Tu opinión" no está en el reference) —
// bocadillo de chat genérico, mismo lenguaje visual que el resto de íconos.
function FeedbackIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 5.5C3 4.1 4.1 3 5.5 3H18.5C19.9 3 21 4.1 21 5.5V14.5C21 15.9 19.9 17 18.5 17H9L4.5 20.5V17H5.5C4.1 17 3 15.9 3 14.5V5.5Z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [opopoints, setOpopoints] = useState(null);
  const [toneLabel, setToneLabel] = useState('Equilibrado');
  const [probLabel, setProbLabel] = useState(null); // null = sin datos aún

  useFocusEffect(useCallback(() => {
    let cancelled = false;

    async function load() {
      // Perfil de usuario
      const { data } = await authApi.me();
      if (!cancelled && data) setUser(data);

      // Saldo de Opopoints (Bloque 11 · Tienda)
      storeApi.getBalance().then((res) => {
        if (!cancelled && res?.data) setOpopoints(res.data.balance);
      });

      // Tono: AsyncStorage primero (rápido), luego backend como fuente de verdad
      try {
        const raw = await AsyncStorage.getItem(TONE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          setToneLabel(PERSONALITY_LABELS[parsed.personality] ?? 'Equilibrado');
        }
      } catch { /* fallo silencioso */ }

      const prefsRes = await settingsApi.getPreferences();
      if (!cancelled && !prefsRes?.error && prefsRes?.data?.personality) {
        setToneLabel(PERSONALITY_LABELS[prefsRes.data.personality] ?? 'Equilibrado');
      }

      // Probabilidad de aprobado desde pro-stats
      const statsRes = await settingsApi.getProStats();
      if (!cancelled && !statsRes?.error && statsRes?.data) {
        setProbLabel(`${statsRes.data.passedProbabilityPct}% Prob. Aprobado`);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []));

  const oposicionLine = [user?.oposicion, user?.especialidad].filter(Boolean).join(' · ')
    || 'Configura tu oposición';

  // TODO: leer estado de suscripción real desde RevenueCat/backend
  const subscriptionSubtext = 'Premium · renueva 14 jul';

  const MENU_ROWS = [
    {
      id: 'perfil',
      icon: PersonIcon,
      label: 'Perfil y biometría',
      subtitle: oposicionLine,
      onPress: () => navigation.navigate('ConfigPerfil'),
    },
    {
      id: 'suscripcion',
      icon: CardIcon,
      label: 'Suscripción',
      subtitle: subscriptionSubtext,
      highlighted: true,
      onPress: () => navigation.navigate('ConfigSubscription'),
    },
    {
      id: 'dispositivos',
      icon: DeviceIcon,
      label: 'Dispositivos conectados',
      // TODO: cargar count real desde user_devices (Bloque 3)
      subtitle: 'Sin dispositivos',
      onPress: () => navigation.navigate('ConfigDevices'),
    },
    {
      id: 'tono-ia',
      icon: SparkleIcon,
      label: 'Tono de la IA',
      subtitle: toneLabel,
      onPress: () => navigation.navigate('ConfigTone'),
    },
    {
      id: 'estadisticas',
      icon: ChartIcon,
      label: 'Estadísticas Pro',
      subtitle: probLabel ?? 'Calculando…',
      onPress: () => navigation.navigate('ConfigStats'),
    },
    {
      id: 'accesibilidad',
      icon: AccessibilityIcon,
      label: 'Accesibilidad',
      // Preferencia local — AsyncStorage, no necesita backend
      subtitle: 'Tema automático',
      onPress: () => navigation.navigate('ConfigAccessibility'),
    },
    {
      id: 'ayuda',
      icon: HelpIcon,
      label: 'Ayuda y soporte',
      subtitle: 'FAQ y Chat',
      onPress: () => navigation.navigate('ConfigHelp'),
    },
    {
      id: 'feedback',
      icon: FeedbackIcon,
      label: 'Tu opinión',
      subtitle: 'Sugerencias y errores',
      onPress: () => navigation.navigate('ConfigFeedback'),
    },
  ];

  const handleLogout = async () => {
    await authApi.logout();
    resetToSplash(navigation);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <ChevronLeftIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={styles.iconButton} />
      </View>

      {/* ── Perfil ──────────────────────────────────────────────────── */}
      <View style={styles.profileBlock}>
        <AvatarIcon />
        <Text style={styles.userName} numberOfLines={1}>{user?.displayName || 'Opositor'}</Text>
        <Text style={styles.userPoints}>
          {opopoints !== null ? opopoints.toLocaleString('es-ES') : '—'} OpoPoints
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {MENU_ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <TouchableOpacity
              key={row.id}
              style={[styles.row, row.highlighted && styles.rowHighlighted]}
              activeOpacity={0.7}
              onPress={row.onPress}
              accessibilityLabel={row.label}
            >
              <Icon />
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                {row.subtitle ? (
                  <Text style={styles.rowSubtitle} numberOfLines={1}>{row.subtitle}</Text>
                ) : null}
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
          );
        })}

        {/* ── Acciones de sesión — reales, sin equivalente en Figma ──── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar sesión"
          >
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ConfigDeleteAccount')}
            activeOpacity={0.7}
            accessibilityLabel="Eliminar cuenta"
            style={styles.deleteLink}
          >
            <Text style={styles.deleteText}>Eliminar cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Header ────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
    textAlign: 'center',
  },

  // ── Perfil ────────────────────────────────────────────────────
  profileBlock: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: FIGMA.separator,
  },
  userName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textDark,
    marginTop: 10,
  },
  userPoints: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.textMuted,
    marginTop: 2,
  },

  // ── Lista ─────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  rowHighlighted: {
    backgroundColor: FIGMA.highlightBg,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  rowSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
    marginTop: 2,
  },

  // ── Acciones de sesión ────────────────────────────────────────
  footer: {
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  logoutBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: FIGMA.separator,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.textDark,
  },
  deleteLink: {
    paddingVertical: 4,
  },
  deleteText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.statRed,
  },
});
