import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { ed25519 } from '@noble/curves/ed25519.js';
import { authApi } from '../api';

/**
 * Toda la lógica biométrica en un solo módulo.
 *
 * Modelo:
 *  - deviceId: identificador estable del dispositivo (generado la primera vez y guardado en SecureStore).
 *  - privateKey: 32 bytes Ed25519 generados aquí, guardados en SecureStore con requireAuthentication.
 *  - publicKey: derivada de la privada, enviada al backend en el link.
 *
 * En login biométrico: firmamos el challenge con la privada tras el prompt del OS.
 */

const KEY_PRIVATE = 'opox.biometric.privateKey';
const KEY_DEVICE_ID = 'opox.biometric.deviceId';
const KEY_ENABLED = 'opox.biometric.enabled';

// ─── Detección de capacidades ─────────────────────

/**
 * Devuelve qué método biométrico está disponible: 'face' | 'finger' | 'both' | 'none'.
 * `none` significa: no hardware o no hay biometría configurada por el usuario.
 */
export async function detectBiometricType() {
    if (Platform.OS === 'web') return 'none';
    try {
        const has = await LocalAuthentication.hasHardwareAsync();
        if (!has) return 'none';
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) return 'none';
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const finger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
        // En Android, el reconocimiento facial es biometría débil (Class 2) y no puede
        // desbloquear claves de SecureStore (que requiere biometría fuerte/Class 3).
        // Face ID solo se ofrece en iOS donde el hardware garantiza biometría fuerte.
        const face = Platform.OS === 'ios' &&
            types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        if (face && finger) return 'both';
        if (face) return 'face';
        if (finger) return 'finger';
        return 'none';
    } catch {
        return 'none';
    }
}

/** Etiqueta legible según lo detectado y el sistema. */
export function biometricLabel(type) {
    if (type === 'face') return 'Face ID';
    if (type === 'finger') return Platform.OS === 'ios' ? 'Touch ID' : 'Huella';
    if (type === 'both') return 'biometría';
    return null;
}

// ─── Device ID persistente ────────────────────────

async function getOrCreateDeviceId() {
    let id = await SecureStore.getItemAsync(KEY_DEVICE_ID);
    if (!id) {
        id = Crypto.randomUUID();
        await SecureStore.setItemAsync(KEY_DEVICE_ID, id);
    }
    return id;
}

// ─── Estado local del vínculo ─────────────────────

export async function isBiometricLinked() {
    const val = await SecureStore.getItemAsync(KEY_ENABLED);
    return val === '1';
}

async function markLinked() {
    await SecureStore.setItemAsync(KEY_ENABLED, '1');
}

async function clearLocalKeys() {
    await SecureStore.deleteItemAsync(KEY_PRIVATE);
    await SecureStore.deleteItemAsync(KEY_ENABLED);
}

// ─── Codificación base64 (utilidades) ─────────────

function bytesToBase64(bytes) {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return globalThis.btoa(bin);
}

function base64ToBytes(b64) {
    const bin = globalThis.atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

// ─── Prompt biométrico ────────────────────────────

async function promptBiometric(reason) {
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
    });
    return result.success;
}

// ─── Setup: activar biometría por primera vez ────

/**
 * Flujo BioLinkScreen "Activar Face ID":
 *   1. Pide biometría al usuario (para probar que la tiene).
 *   2. Genera un keypair Ed25519.
 *   3. Guarda la clave privada en SecureStore.
 *   4. Envía la pública + deviceId al backend.
 *
 * Devuelve { ok: true } o { ok: false, error }.
 */
export async function setupBiometric() {
    const type = await detectBiometricType();
    if (type === 'none') {
        return { ok: false, error: 'Este dispositivo no tiene biometría disponible.' };
    }

    const authed = await promptBiometric('Confirma para activar el acceso rápido');
    if (!authed) return { ok: false, error: 'Autenticación cancelada.' };

    // Ed25519 keypair (v2 renombró randomPrivateKey → randomSecretKey)
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);

    const privateKeyB64 = bytesToBase64(privateKey);
    const publicKeyB64 = bytesToBase64(publicKey);

    const deviceId = await getOrCreateDeviceId();

    // Guardamos la privada protegida por biometría del OS
    await SecureStore.setItemAsync(KEY_PRIVATE, privateKeyB64, {
        requireAuthentication: true,
        authenticationPrompt: 'Confirma para usar tu Face ID / huella',
    });

    const { error } = await authApi.biometricLink({
        devicePublicKey: publicKeyB64,
        deviceId,
    });

    if (error) {
        await clearLocalKeys();
        return { ok: false, error: error.message };
    }

    await markLinked();
    return { ok: true };
}

// ─── Login biométrico ─────────────────────────────

/**
 * Flujo LoginScreen "Entrar con Face ID":
 *   1. Pide challenge al backend.
 *   2. Pide biometría (esto desbloquea la clave privada en SecureStore).
 *   3. Firma el challenge con la privada.
 *   4. Envía la firma al backend, recibe sesión.
 *
 * Devuelve { ok: true, session } o { ok: false, error }.
 */
export async function loginWithBiometric() {
    const linked = await isBiometricLinked();
    if (!linked) return { ok: false, error: 'Biometría no configurada en este dispositivo.' };

    const deviceId = await getOrCreateDeviceId();

    // 1. Challenge del backend
    const { data: challenge, error: chErr } = await authApi.biometricChallenge(deviceId);
    if (chErr || !challenge?.challenge) {
        return { ok: false, error: chErr?.message || 'No se pudo iniciar el proceso.' };
    }

    // 2. Prompt biométrico + recuperar privada
    // SecureStore con requireAuthentication YA fuerza el prompt del OS;
    // no llamamos authenticateAsync aparte para evitar doble prompt.
    let privateKeyB64;
    try {
        privateKeyB64 = await SecureStore.getItemAsync(KEY_PRIVATE, {
            requireAuthentication: true,
            authenticationPrompt: 'Confirma para entrar',
        });
    } catch {
        return { ok: false, error: 'No te hemos reconocido.' };
    }
    if (!privateKeyB64) return { ok: false, error: 'No te hemos reconocido.' };

    // 3. Firma Ed25519
    const privateKey = base64ToBytes(privateKeyB64);
    const message = base64ToBytes(challenge.challenge);
    const signature = ed25519.sign(message, privateKey);
    const signedChallenge = bytesToBase64(signature);

    // 4. Login al backend
    const { data: session, error: loginErr } = await authApi.biometricLogin({
        deviceId,
        challengeId: challenge.challengeId,
        signedChallenge,
    });

    if (loginErr || !session?.accessToken) {
        return { ok: false, error: loginErr?.message || 'No te hemos reconocido.' };
    }

    return { ok: true, session };
}

// ─── Reset (cuando el usuario hace logout o desactiva) ─

export async function disableBiometric() {
    await clearLocalKeys();
    // Nota: la clave pública en el backend se queda hasta que el usuario
    // pida "revocar dispositivos" (feature futura de Ajustes).
}
