import { ed25519 } from '@noble/curves/ed25519.js';
import { randomBytes } from 'node:crypto';

/**
 * Utilidades cripto para el flujo biométrico.
 *
 * Formato: todo se transmite como base64. El mobile firma el challenge
 * (bytes crudos decodificados) con Ed25519 y devuelve la firma base64.
 * El backend verifica con la clave pública también en base64.
 */

/** 32 bytes random como challenge, codificado base64. */
export function generateChallengeBase64(): string {
    return randomBytes(32).toString('base64');
}

/**
 * Verifica una firma Ed25519.
 * @param signatureB64 firma en base64
 * @param messageB64 mensaje firmado (el challenge original) en base64
 * @param publicKeyB64 clave pública en base64
 */
export function verifyEd25519Signature(input: {
    signatureB64: string;
    messageB64: string;
    publicKeyB64: string;
}): boolean {
    try {
        const signature = Buffer.from(input.signatureB64, 'base64');
        const message = Buffer.from(input.messageB64, 'base64');
        const publicKey = Buffer.from(input.publicKeyB64, 'base64');
        return ed25519.verify(signature, message, publicKey);
    } catch {
        return false;
    }
}
