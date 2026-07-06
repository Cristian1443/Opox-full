import type { SupabaseClient } from '@supabase/supabase-js';
import {
    Session,
    User,
    type IAuthRepository,
    InvalidCredentialsError,
    EmailAlreadyRegisteredError,
    OtpInvalidError,
    OtpExpiredError,
    SessionExpiredError,
    UnauthorizedError,
    BiometricNotRecognizedError,
} from '../../domain';
import { generateChallengeBase64, verifyEd25519Signature } from './biometricCrypto';

const CHALLENGE_TTL_SECONDS = 60;

/**
 * Implementación de IAuthRepository usando Supabase Auth.
 *
 * Traduce errores de Supabase a DomainError concretos, de forma que
 * los use cases y controllers nunca vean detalles del provider.
 */
export class SupabaseAuthRepository implements IAuthRepository {
    /**
     * Recibe DOS clientes Supabase (ambos con service_role):
     *  - supabaseAuth: para todos los `.auth.xxx` de sesión. Su estado queda
     *    contaminado tras cada login (supabase-js reescribe el Authorization
     *    con el JWT del usuario), y por eso NO se usa para `.from(...)`.
     *  - supabaseAdmin: exclusivo para `.from(...)` sobre tablas con RLS y
     *    para endpoints `.auth.admin.xxx`. No se le llama signIn* jamás,
     *    así mantiene el Authorization con la service_role y bypasea RLS.
     */
    constructor(
        private readonly supabaseAuth: SupabaseClient,
        private readonly supabaseAdmin: SupabaseClient,
    ) { }

    // ─── Helpers ──────────────────────────────────

    private toDomainSession(payload: {
        session: {
            access_token: string;
            refresh_token: string;
            expires_in: number;
        };
        user: {
            id: string;
            email: string | null;
            user_metadata: Record<string, unknown>;
            created_at: string;
        };
    }): Session {
        const metadata = payload.user.user_metadata || {};
        const user = User.create({
            id: payload.user.id,
            email: payload.user.email || '',
            displayName: (metadata['display_name'] as string) || null,
            avatarUrl: (metadata['avatar_url'] as string) || null,
            hasBiometric: Boolean(metadata['has_biometric']),
            termsAcceptedAt: metadata['terms_accepted_at']
                ? new Date(metadata['terms_accepted_at'] as string)
                : null,
            createdAt: new Date(payload.user.created_at),
        });

        return Session.create({
            accessToken: payload.session.access_token,
            refreshToken: payload.session.refresh_token,
            expiresIn: payload.session.expires_in,
            user,
        });
    }

    // ─── Email + password ─────────────────────────

    async registerWithEmail(input: {
        email: string;
        password: string;
        displayName: string;
    }): Promise<Session> {
        const { data, error } = await this.supabaseAuth.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
                data: { display_name: input.displayName },
            },
        });

        if (error) {
            if (error.message.toLowerCase().includes('already registered')) {
                throw new EmailAlreadyRegisteredError(input.email);
            }
            throw error;
        }
        if (!data.user) {
            throw new Error('signup: Supabase no devolvió user');
        }

        // Anti-patrón de Supabase v2: signUp con email existente devuelve
        // un "fake user" sin error para prevenir email enumeration desde
        // clientes públicos. La forma correcta de detectarlo es comprobar
        // que `identities` sea array vacío. Como el backend usa service_role
        // y este check pasa el aviso al UI del mobile de forma controlada,
        // es seguro tirar el error de dominio.
        const identities = (data.user as { identities?: unknown[] }).identities;
        if (Array.isArray(identities) && identities.length === 0) {
            throw new EmailAlreadyRegisteredError(input.email);
        }

        // Con "Confirm email" activado, signUp devuelve user sin session
        // hasta que el OTP se verifique. Devolvemos una sesión vacía; el mobile
        // detecta `accessToken === ''` y pasa a la screen 1.6 (Otp).
        if (!data.session) {
            const user = User.create({
                id: data.user.id,
                email: data.user.email || input.email,
                displayName: input.displayName,
                createdAt: new Date(data.user.created_at),
            });
            return Session.create({
                accessToken: '',
                refreshToken: '',
                expiresIn: 0,
                user,
            });
        }

        return this.toDomainSession({
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
            },
            user: {
                id: data.user.id,
                email: data.user.email ?? null,
                user_metadata: data.user.user_metadata ?? {},
                created_at: data.user.created_at,
            },
        });
    }

    async loginWithEmail(input: { email: string; password: string }): Promise<Session> {
        const { data, error } = await this.supabaseAuth.auth.signInWithPassword({
            email: input.email,
            password: input.password,
        });

        if (error || !data.session || !data.user) {
            throw new InvalidCredentialsError();
        }

        return this.toDomainSession({
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
            },
            user: {
                id: data.user.id,
                email: data.user.email ?? null,
                user_metadata: data.user.user_metadata ?? {},
                created_at: data.user.created_at,
            },
        });
    }

    // ─── OAuth ────────────────────────────────────

    async loginWithOAuth(input: {
        provider: 'google' | 'apple' | 'meta';
        idToken: string;
    }): Promise<Session> {
        // Supabase acepta id_token de Google/Apple con signInWithIdToken.
        // Meta/Facebook requiere flujo OAuth server-side; se deja como TODO.
        if (input.provider === 'meta') {
            // TODO: implementar flujo OAuth con Meta cuando el cliente lo priorice.
            throw new Error('Meta login not implemented yet');
        }

        const { data, error } = await this.supabaseAuth.auth.signInWithIdToken({
            provider: input.provider,
            token: input.idToken,
        });

        if (error || !data.session || !data.user) {
            throw new InvalidCredentialsError();
        }

        return this.toDomainSession({
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
            },
            user: {
                id: data.user.id,
                email: data.user.email ?? null,
                user_metadata: data.user.user_metadata ?? {},
                created_at: data.user.created_at,
            },
        });
    }

    // ─── OTP por email ────────────────────────────

    async sendOtp(input: {
        email: string;
        purpose: 'email_verification' | 'passwordless_login';
    }): Promise<void> {
        const { error } = await this.supabaseAuth.auth.signInWithOtp({
            email: input.email,
            options: {
                shouldCreateUser: input.purpose === 'passwordless_login',
            },
        });
        if (error) throw error;
    }

    async verifyOtp(input: {
        email: string;
        code: string;
        purpose: 'email_verification' | 'passwordless_login';
    }): Promise<Session> {
        const token = input.code.trim();
        const { data, error } = await this.supabaseAuth.auth.verifyOtp({
            email: input.email,
            token,
            type: input.purpose === 'email_verification' ? 'email' : 'magiclink',
        });

        if (error) {
            // eslint-disable-next-line no-console
            console.error('[supabase verifyOtp] error real:', {
                message: error.message,
                status: error.status,
                code: (error as unknown as { code?: string }).code,
                name: error.name,
            });
            const msg = error.message.toLowerCase();
            if (msg.includes('expired')) throw new OtpExpiredError();
            throw new OtpInvalidError();
        }
        if (!data.session || !data.user) throw new OtpInvalidError();

        return this.toDomainSession({
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
            },
            user: {
                id: data.user.id,
                email: data.user.email ?? null,
                user_metadata: data.user.user_metadata ?? {},
                created_at: data.user.created_at,
            },
        });
    }

    // ─── Password reset ───────────────────────────

    async requestPasswordReset(email: string): Promise<void> {
        // Anti-enumeración: siempre resolvemos OK aunque el email no exista.
        await this.supabaseAuth.auth.resetPasswordForEmail(email).catch(() => undefined);
    }

    async confirmPasswordReset(input: {
        resetToken: string;
        newPassword: string;
    }): Promise<Session> {
        // TODO: cuando conectemos el deep link real, verificar el token del email
        // y llamar a updateUser. Por ahora dejamos el flujo listo pero sin session.
        throw new Error(
            'confirmPasswordReset: pendiente de wiring del deep link del email de recovery',
        );
    }

    // ─── Biometría ────────────────────────────────

    async createBiometricChallenge(deviceId: string): Promise<{
        challengeId: string;
        challenge: string;
        expiresIn: number;
    }> {
        const challenge = generateChallengeBase64();
        const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000).toISOString();

        const { data, error } = await this.supabaseAdmin
            .from('biometric_challenges')
            .insert({
                device_id: deviceId,
                challenge,
                expires_at: expiresAt,
            })
            .select('id')
            .single();

        if (error || !data) throw new BiometricNotRecognizedError();

        return {
            challengeId: data.id as string,
            challenge,
            expiresIn: CHALLENGE_TTL_SECONDS,
        };
    }

    async linkBiometric(input: {
        userId: string;
        devicePublicKey: string;
        deviceId: string;
    }): Promise<void> {
        // upsert: si el device_id ya existe (usuario reactivando o cambiando user),
        // lo sobrescribimos con las nuevas credenciales.
        const { error } = await this.supabaseAdmin
            .from('biometric_devices')
            .upsert(
                {
                    user_id: input.userId,
                    device_id: input.deviceId,
                    public_key: input.devicePublicKey,
                    last_used_at: null,
                },
                { onConflict: 'device_id' },
            );

        if (error) {
            // eslint-disable-next-line no-console
            console.error('[supabase linkBiometric] postgrest error:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            });
            throw new Error(`linkBiometric: ${error.message} (code ${error.code})`);
        }
    }

    async loginWithBiometric(input: {
        deviceId: string;
        challengeId: string;
        signedChallenge: string;
    }): Promise<Session> {
        // 1. Recuperar challenge, comprobar que no expiró ni se usó.
        const { data: challenge, error: chErr } = await this.supabaseAdmin
            .from('biometric_challenges')
            .select('id, device_id, challenge, expires_at, used_at')
            .eq('id', input.challengeId)
            .eq('device_id', input.deviceId)
            .maybeSingle();

        if (chErr || !challenge) throw new BiometricNotRecognizedError();
        if (challenge.used_at) throw new BiometricNotRecognizedError();
        if (new Date(challenge.expires_at as string) < new Date()) {
            throw new BiometricNotRecognizedError();
        }

        // 2. Recuperar clave pública del device.
        const { data: device, error: devErr } = await this.supabaseAdmin
            .from('biometric_devices')
            .select('user_id, public_key')
            .eq('device_id', input.deviceId)
            .maybeSingle();

        if (devErr || !device) throw new BiometricNotRecognizedError();

        // 3. Verificar firma Ed25519.
        const valid = verifyEd25519Signature({
            signatureB64: input.signedChallenge,
            messageB64: challenge.challenge as string,
            publicKeyB64: device.public_key as string,
        });
        if (!valid) throw new BiometricNotRecognizedError();

        // 4. Marcar challenge como usado (previene replay).
        await this.supabaseAdmin
            .from('biometric_challenges')
            .update({ used_at: new Date().toISOString() })
            .eq('id', input.challengeId);

        // 5. Actualizar last_used_at del device (útil para stats/ajustes).
        await this.supabaseAdmin
            .from('biometric_devices')
            .update({ last_used_at: new Date().toISOString() })
            .eq('device_id', input.deviceId);

        // 6. Emitir sesión de Supabase para ese user_id. Patrón oficial:
        //    generateLink → devuelve hashed_token → verifyOtp lo intercambia
        //    por una sesión con accessToken + refreshToken reales.
        const { data: userData, error: userErr } = await this.supabaseAdmin.auth.admin.getUserById(
            device.user_id as string,
        );
        if (userErr || !userData.user?.email) throw new BiometricNotRecognizedError();

        const email = userData.user.email;
        const { data: linkData, error: linkErr } = await this.supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
        });
        if (linkErr || !linkData.properties?.hashed_token) {
            throw new BiometricNotRecognizedError();
        }

        const { data: sessionData, error: verifyErr } = await this.supabaseAuth.auth.verifyOtp({
            type: 'magiclink',
            token_hash: linkData.properties.hashed_token,
        });
        if (verifyErr || !sessionData.session || !sessionData.user) {
            throw new BiometricNotRecognizedError();
        }

        return this.toDomainSession({
            session: {
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                expires_in: sessionData.session.expires_in,
            },
            user: {
                id: sessionData.user.id,
                email: sessionData.user.email ?? null,
                user_metadata: sessionData.user.user_metadata ?? {},
                created_at: sessionData.user.created_at,
            },
        });
    }

    // ─── Sesión ───────────────────────────────────

    async getSession(accessToken: string): Promise<Session> {
        const { data, error } = await this.supabaseAuth.auth.getUser(accessToken);
        if (error || !data.user) throw new SessionExpiredError();

        // getUser no devuelve tokens; reconstruimos la Session con el que ya tenemos.
        const user = User.create({
            id: data.user.id,
            email: data.user.email || '',
            displayName: (data.user.user_metadata?.['display_name'] as string) || null,
            avatarUrl: (data.user.user_metadata?.['avatar_url'] as string) || null,
            hasBiometric: Boolean(data.user.user_metadata?.['has_biometric']),
            termsAcceptedAt: data.user.user_metadata?.['terms_accepted_at']
                ? new Date(data.user.user_metadata['terms_accepted_at'] as string)
                : null,
            createdAt: new Date(data.user.created_at),
        });

        return Session.create({
            accessToken,
            refreshToken: '',
            expiresIn: 3600,
            user,
        });
    }

    async refreshSession(refreshToken: string): Promise<Session> {
        const { data, error } = await this.supabaseAuth.auth.refreshSession({
            refresh_token: refreshToken,
        });
        if (error || !data.session || !data.user) throw new SessionExpiredError();

        return this.toDomainSession({
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
            },
            user: {
                id: data.user.id,
                email: data.user.email ?? null,
                user_metadata: data.user.user_metadata ?? {},
                created_at: data.user.created_at,
            },
        });
    }

    async logout(accessToken: string): Promise<void> {
        const { error } = await this.supabaseAdmin.auth.admin.signOut(accessToken);
        if (error) throw new UnauthorizedError();
    }

    // ─── Términos ─────────────────────────────────

    async acceptTerms(input: {
        userId: string;
        termsVersion: string;
        privacyVersion: string;
    }): Promise<User> {
        const now = new Date().toISOString();
        const { data, error } = await this.supabaseAdmin.auth.admin.updateUserById(input.userId, {
            user_metadata: {
                terms_accepted_at: now,
                terms_version: input.termsVersion,
                privacy_version: input.privacyVersion,
            },
        });
        if (error || !data.user) throw new UnauthorizedError();

        return User.create({
            id: data.user.id,
            email: data.user.email || '',
            displayName: (data.user.user_metadata?.['display_name'] as string) || null,
            avatarUrl: (data.user.user_metadata?.['avatar_url'] as string) || null,
            hasBiometric: Boolean(data.user.user_metadata?.['has_biometric']),
            termsAcceptedAt: new Date(now),
            createdAt: new Date(data.user.created_at),
        });
    }
}
