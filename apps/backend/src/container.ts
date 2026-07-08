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
    UpdateProfileUseCase,
    ListNotificationsUseCase,
    GetNextNudgeUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    CreateNotificationUseCase,
    GetGamificationUseCase,
    RegisterActivityUseCase,
    GetDashboardSummaryUseCase,
} from './application';
import {
    getSupabaseAuth,
    getSupabaseAdmin,
    SupabaseAuthRepository,
    SupabaseDashboardRepository,
    ClientApiClient,
    AiApiClient,
} from './infrastructure';
import { AuthController, DashboardController, createAuthMiddleware } from './presentation';
import type { IAuthRepository, IDashboardRepository } from './domain';

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

    const dashboardRepo: IDashboardRepository = isSupabaseConfigured
        ? new SupabaseDashboardRepository(getSupabaseAdmin())
        : createStubDashboardRepository();

    if (!isSupabaseConfigured) {
        logger.warn(
            '[container] Supabase no configurado. Todas las rutas /auth y /dashboard devolverán ' +
            '501 hasta rellenar SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY en .env',
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
        updateProfile: new UpdateProfileUseCase(authRepo),

        // Bloque 2 · Dashboard
        getDashboardSummary: new GetDashboardSummaryUseCase(authRepo, dashboardRepo),
        listNotifications: new ListNotificationsUseCase(dashboardRepo),
        getNextNudge: new GetNextNudgeUseCase(dashboardRepo),
        markNotificationRead: new MarkNotificationReadUseCase(dashboardRepo),
        markAllNotificationsRead: new MarkAllNotificationsReadUseCase(dashboardRepo),
        createNotification: new CreateNotificationUseCase(dashboardRepo),
        getGamification: new GetGamificationUseCase(dashboardRepo),
        registerActivity: new RegisterActivityUseCase(dashboardRepo),
    };

    // ─── Controllers (presentation) ───────────────
    const authController = new AuthController(useCases);
    const authMiddleware = createAuthMiddleware(useCases.getSession);
    const dashboardController = new DashboardController({
        getSummary: useCases.getDashboardSummary,
        listNotifications: useCases.listNotifications,
        getNextNudge: useCases.getNextNudge,
        markNotificationRead: useCases.markNotificationRead,
        markAllNotificationsRead: useCases.markAllNotificationsRead,
        createNotification: useCases.createNotification,
        getGamification: useCases.getGamification,
        registerActivity: useCases.registerActivity,
    });

    return {
        authRepo,
        dashboardRepo,
        clientApi,
        aiApi,
        useCases,
        controllers: {
            auth: authController,
            dashboard: dashboardController,
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

function createStubDashboardRepository(): IDashboardRepository {
    const notConfigured = (): never => {
        throw new Error(
            '[dashboard] Supabase no configurado. Rellena .env y reinicia.',
        );
    };
    return new Proxy({} as IDashboardRepository, {
        get: () => notConfigured,
    });
}
