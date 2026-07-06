import { env, isSupabaseConfigured } from './config';
import { logger } from '@opox/utils';
import {
    RegisterUseCase,
    LoginUseCase,
    OAuthLoginUseCase,
    SendOtpUseCase,
    VerifyOtpUseCase,
    RequestPasswordResetUseCase,
    ConfirmPasswordResetUseCase,
    CreateBiometricChallengeUseCase,
    LinkBiometricUseCase,
    BiometricLoginUseCase,
    GetSessionUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    AcceptTermsUseCase,
} from './application';
import {
    getSupabaseAuth,
    getSupabaseAdmin,
    SupabaseAuthRepository,
    ClientApiClient,
    AiApiClient,
} from './infrastructure';
import { AuthController, createAuthMiddleware } from './presentation';
import type { IAuthRepository } from './domain';

/**
 * Inyección de dependencias manual (sin framework).
 * Se ejecuta una vez al arranque y devuelve todo cableado.
 *
 * Cada consumidor recibe interfaces (IAuthRepository, etc.), no
 * implementaciones concretas. Cambiar Supabase por Clerk requiere
 * solo cambiar esta función.
 */
export function buildContainer() {
    // ─── Repositorios (infra) ─────────────────────
    const authRepo: IAuthRepository = isSupabaseConfigured
        ? new SupabaseAuthRepository(getSupabaseAuth(), getSupabaseAdmin())
        : createStubAuthRepository();

    if (!isSupabaseConfigured) {
        logger.warn(
            '[container] Supabase no configurado. Todas las rutas /auth devolverán 501 hasta ' +
            'rellenar SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY en .env',
        );
    }

    // ─── Clientes externos (infra) ────────────────
    const clientApi = env.CLIENT_API_BASE_URL && env.CLIENT_API_KEY
        ? new ClientApiClient({
            baseUrl: env.CLIENT_API_BASE_URL,
            apiKey: env.CLIENT_API_KEY,
            timeoutMs: env.CLIENT_API_TIMEOUT_MS,
        })
        : null;

    const aiApi = env.AI_API_BASE_URL && env.AI_API_KEY && env.AI_API_DEFAULT_MODEL
        ? new AiApiClient({
            baseUrl: env.AI_API_BASE_URL,
            apiKey: env.AI_API_KEY,
            defaultModel: env.AI_API_DEFAULT_MODEL,
            timeoutMs: env.AI_API_TIMEOUT_MS,
        })
        : null;

    // ─── Use cases (application) ──────────────────
    const useCases = {
        register: new RegisterUseCase(authRepo),
        login: new LoginUseCase(authRepo),
        oauthLogin: new OAuthLoginUseCase(authRepo),
        sendOtp: new SendOtpUseCase(authRepo),
        verifyOtp: new VerifyOtpUseCase(authRepo),
        requestPasswordReset: new RequestPasswordResetUseCase(authRepo),
        confirmPasswordReset: new ConfirmPasswordResetUseCase(authRepo),
        createBiometricChallenge: new CreateBiometricChallengeUseCase(authRepo),
        linkBiometric: new LinkBiometricUseCase(authRepo),
        biometricLogin: new BiometricLoginUseCase(authRepo),
        getSession: new GetSessionUseCase(authRepo),
        refreshSession: new RefreshSessionUseCase(authRepo),
        logout: new LogoutUseCase(authRepo),
        acceptTerms: new AcceptTermsUseCase(authRepo),
    };

    // ─── Controllers (presentation) ───────────────
    const authController = new AuthController(useCases);
    const authMiddleware = createAuthMiddleware(useCases.getSession);

    return {
        authRepo,
        clientApi,
        aiApi,
        useCases,
        controllers: {
            auth: authController,
        },
        middleware: {
            auth: authMiddleware,
        },
    };
}

export type Container = ReturnType<typeof buildContainer>;

// ─── Stub para arrancar sin Supabase configurado ───

function createStubAuthRepository(): IAuthRepository {
    const notConfigured = (): never => {
        throw new Error(
            '[auth] Supabase no configurado. Rellena .env y reinicia.',
        );
    };
    return new Proxy({} as IAuthRepository, {
        get: () => notConfigured,
    });
}
