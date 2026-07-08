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
    GetPlanUseCase,
    UpdatePlanUseCase,
    ListTasksUseCase,
    CreateTaskUseCase,
    ToggleTaskUseCase,
    GetWeekUseCase,
    GetMacroUseCase,
    ListAgendaUseCase,
    CreateAgendaDateUseCase,
    GetPlanningSummaryUseCase,
    GetProfileUseCase,
    MarkExamPassedUseCase,
    GetRankingUseCase,
    GetMyClanUseCase,
    ListClansUseCase,
    CreateClanUseCase,
    JoinClanUseCase,
    GetClanDetailUseCase,
    ListClanMessagesUseCase,
    SendClanMessageUseCase,
    ListClanChallengesUseCase,
    CreateClanChallengeUseCase,
    CompleteChallengeUseCase,
    ListGraduatesUseCase,
    GetStreakDetailUseCase,
    GetMotivationSummaryUseCase,
} from './application';
import {
    getSupabaseAuth,
    getSupabaseAdmin,
    SupabaseAuthRepository,
    SupabaseDashboardRepository,
    SupabasePlanningRepository,
    SupabaseMotivationRepository,
    ClientApiClient,
    AiApiClient,
} from './infrastructure';
import {
    AuthController,
    DashboardController,
    PlanningController,
    MotivationController,
    createAuthMiddleware,
} from './presentation';
import type { IAuthRepository, IDashboardRepository, IPlanningRepository, IMotivationRepository } from './domain';

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

    const planningRepo: IPlanningRepository = isSupabaseConfigured
        ? new SupabasePlanningRepository(getSupabaseAdmin())
        : createStubPlanningRepository();

    const motivationRepo: IMotivationRepository = isSupabaseConfigured
        ? new SupabaseMotivationRepository(getSupabaseAdmin())
        : createStubMotivationRepository();

    if (!isSupabaseConfigured) {
        logger.warn(
            '[container] Supabase no configurado. Todas las rutas /auth, /dashboard, /planning y ' +
            '/motivation devolverán 501 hasta rellenar SUPABASE_URL / SUPABASE_ANON_KEY / ' +
            'SUPABASE_SERVICE_ROLE_KEY en .env',
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
    const getWeek = new GetWeekUseCase(planningRepo);
    const getMacro = new GetMacroUseCase(planningRepo);

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

        // Bloque 4 · Planificación
        getPlan: new GetPlanUseCase(planningRepo),
        updatePlan: new UpdatePlanUseCase(planningRepo),
        listTasks: new ListTasksUseCase(planningRepo),
        createTask: new CreateTaskUseCase(planningRepo),
        toggleTask: new ToggleTaskUseCase(planningRepo, dashboardRepo),
        getWeek,
        getMacro,
        listAgenda: new ListAgendaUseCase(planningRepo),
        createAgendaDate: new CreateAgendaDateUseCase(planningRepo),
        getPlanningSummary: new GetPlanningSummaryUseCase(planningRepo, getWeek, getMacro),

        // Bloque 5 · Motivación
        getProfile: new GetProfileUseCase(motivationRepo),
        markExamPassed: new MarkExamPassedUseCase(motivationRepo),
        getRanking: new GetRankingUseCase(motivationRepo),
        getMyClan: new GetMyClanUseCase(motivationRepo),
        listClans: new ListClansUseCase(motivationRepo),
        createClan: new CreateClanUseCase(motivationRepo),
        joinClan: new JoinClanUseCase(motivationRepo),
        getClanDetail: new GetClanDetailUseCase(motivationRepo),
        listClanMessages: new ListClanMessagesUseCase(motivationRepo),
        sendClanMessage: new SendClanMessageUseCase(motivationRepo),
        listClanChallenges: new ListClanChallengesUseCase(motivationRepo),
        createClanChallenge: new CreateClanChallengeUseCase(motivationRepo),
        completeChallenge: new CompleteChallengeUseCase(motivationRepo, dashboardRepo),
        listGraduates: new ListGraduatesUseCase(motivationRepo),
        getStreakDetail: new GetStreakDetailUseCase(dashboardRepo, motivationRepo),
        getMotivationSummary: new GetMotivationSummaryUseCase(dashboardRepo, motivationRepo),
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
    const planningController = new PlanningController({
        getSummary: useCases.getPlanningSummary,
        getPlan: useCases.getPlan,
        updatePlan: useCases.updatePlan,
        listTasks: useCases.listTasks,
        createTask: useCases.createTask,
        toggleTask: useCases.toggleTask,
        getWeek: useCases.getWeek,
        getMacro: useCases.getMacro,
        listAgenda: useCases.listAgenda,
        createAgendaDate: useCases.createAgendaDate,
    });
    const motivationController = new MotivationController({
        getSummary: useCases.getMotivationSummary,
        getStreakDetail: useCases.getStreakDetail,
        getRanking: useCases.getRanking,
        markExamPassed: useCases.markExamPassed,
        getMyClan: useCases.getMyClan,
        listClans: useCases.listClans,
        createClan: useCases.createClan,
        joinClan: useCases.joinClan,
        getClanDetail: useCases.getClanDetail,
        listClanMessages: useCases.listClanMessages,
        sendClanMessage: useCases.sendClanMessage,
        listClanChallenges: useCases.listClanChallenges,
        createClanChallenge: useCases.createClanChallenge,
        completeChallenge: useCases.completeChallenge,
        listGraduates: useCases.listGraduates,
    });

    return {
        authRepo,
        dashboardRepo,
        planningRepo,
        motivationRepo,
        clientApi,
        aiApi,
        useCases,
        controllers: {
            auth: authController,
            dashboard: dashboardController,
            planning: planningController,
            motivation: motivationController,
        },
        middleware: {
            auth: authMiddleware,
        },
    };
}

export type Container = ReturnType<typeof buildContainer>;

// ─── Stubs para arrancar sin Supabase configurado ───

function createStubAuthRepository(): IAuthRepository {
    const notConfigured = (): never => {
        throw new Error('[auth] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as IAuthRepository, { get: () => notConfigured });
}

function createStubDashboardRepository(): IDashboardRepository {
    const notConfigured = (): never => {
        throw new Error('[dashboard] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as IDashboardRepository, { get: () => notConfigured });
}

function createStubPlanningRepository(): IPlanningRepository {
    const notConfigured = (): never => {
        throw new Error('[planning] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as IPlanningRepository, { get: () => notConfigured });
}

function createStubMotivationRepository(): IMotivationRepository {
    const notConfigured = (): never => {
        throw new Error('[motivation] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as IMotivationRepository, { get: () => notConfigured });
}
