import { env, isSupabaseConfigured, isMotorConfigured } from './config';
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
    DeleteAccountUseCase,
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
    // Bloque 6 · Entrenamiento
    ListMockExamsUseCase,
    GetMockExamUseCase,
    GenerateQuestionsUseCase,
    AnalyzePhotoUseCase,
    GenerateSurgicalTestUseCase,
    SaveAttemptUseCase,
    ListErrorPatternsUseCase,
    ListBookmarksUseCase,
    SaveBookmarkUseCase,
    DeleteBookmarkUseCase,
    // Bloque 7 · Sesión de entrenamiento
    GenerateHintUseCase,
    ReportQuestionUseCase,
    // Bloque 8 · Aula Virtual / Tutor IA
    ListConversationsUseCase,
    GetConversationUseCase,
    CreateConversationUseCase,
    SendMessageUseCase,
    DeleteConversationUseCase,
    ListDecksUseCase,
    GetDeckWithCardsUseCase,
    GenerateDeckUseCase,
    DeleteDeckUseCase,
    SubmitReviewUseCase,
    ListEpisodesUseCase,
    GetEpisodeUseCase,
    GetProgressUseCase,
    SaveProgressUseCase,
    ListSummariesUseCase,
    GetSummaryUseCase,
    // Bloque 9 · Factoría de Apuntes
    ListNotesUseCase,
    GetNoteUseCase,
    UploadNoteUseCase,
    GetNoteStatusUseCase,
    UpdateNoteTagsUseCase,
    DeleteNoteUseCase,
    GenerateTestFromNoteUseCase,
    // Bloque 10 · Monitor BOE
    GetBoeFeedUseCase,
    GetBoeChangeDetailUseCase,
    GetBoeComparisonUseCase,
    GetBoeMiniTestUseCase,
    MarkBoeReadUseCase,
    ToggleBoeBookmarkUseCase,
    CompleteBoeMiniTestUseCase,
    ListTopicsUseCase,
    SyncBoeChangesUseCase,
    ListFollowedRegulationsUseCase,
    FollowRegulationUseCase,
    UnfollowRegulationUseCase,
    SearchBoeRegulationsUseCase,
    SyncBoeCatalogUseCase,
    // Bloque 11 · Tienda
    GetStoreBalanceUseCase,
    ListStoreProductsUseCase,
    GetStoreProductUseCase,
    RedeemProductUseCase,
    ListStoreDiscountsUseCase,
    RedeemDiscountUseCase,
    GetWalletUseCase,
    GetWalletItemUseCase,
    ListCommunityTestsUseCase,
    GetCommunityTestUseCase,
    PublishCommunityTestUseCase,
    ObtainCommunityTestUseCase,
    // Bloque 12 · Configuración
    GetPreferencesUseCase,
    UpdatePreferencesUseCase,
    GetProStatsUseCase,
    ExportProStatsUseCase,
    SubmitFeedbackUseCase,
    // Bloque 3 · Salud — dispositivos
    GetDevicesUseCase,
    RegisterDeviceUseCase,
    DeleteDeviceUseCase,
    // Bloque 13 · Notificaciones
    RegisterPushTokenUseCase,
    SendBoeAlertUseCase,
    SendNoteReadyUseCase,
    SendStreakWarningUseCase,
    SendDailyGoalCompletedUseCase,
} from './application';
import {
    getSupabaseAuth,
    getSupabaseAdmin,
    SupabaseAuthRepository,
    SupabaseDashboardRepository,
    SupabasePlanningRepository,
    SupabaseMotivationRepository,
    SupabaseTrainingRepository,
    SupabaseTutorRepository,
    SupabaseNotesRepository,
    SupabaseBoeRepository,
    SupabaseStoreRepository,
    SupabaseConfigRepository,
    SupabasePushRepository,
    SupabaseHealthRepository,
    ExpoPushService,
    ClientApiClient,
    AiApiClient,
    AiApiClientStub,
    MotorAiClient,
    CompositeAiClient,
    MotorBoeClient,
} from './infrastructure';
import {
    HealthController,
    AuthController,
    DashboardController,
    PlanningController,
    MotivationController,
    TrainingController,
    TutorController,
    NotesController,
    BoeController,
    StoreController,
    ConfigController,
    PushTokenController,
    createAuthMiddleware,
} from './presentation';
import type { IAuthRepository, IDashboardRepository, IPlanningRepository, IMotivationRepository, ITrainingRepository, ITutorRepository, INotesRepository, IBoeRepository, IStoreRepository, IConfigRepository, IPushRepository, IHealthRepository } from './domain';

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

    const trainingRepo: ITrainingRepository = isSupabaseConfigured
        ? new SupabaseTrainingRepository(getSupabaseAdmin())
        : createStubTrainingRepository();

    const tutorRepo: ITutorRepository = isSupabaseConfigured
        ? new SupabaseTutorRepository(getSupabaseAdmin())
        : createStubTutorRepository();

    const notesRepo: INotesRepository = isSupabaseConfigured
        ? new SupabaseNotesRepository(getSupabaseAdmin())
        : createStubNotesRepository();

    const boeRepo: IBoeRepository = isSupabaseConfigured
        ? new SupabaseBoeRepository(getSupabaseAdmin())
        : createStubBoeRepository();

    const storeRepo: IStoreRepository = isSupabaseConfigured
        ? new SupabaseStoreRepository(getSupabaseAdmin())
        : createStubStoreRepository();

    const configRepo: IConfigRepository = isSupabaseConfigured
        ? new SupabaseConfigRepository(getSupabaseAdmin())
        : createStubConfigRepository();

    const pushRepo: IPushRepository = isSupabaseConfigured
        ? new SupabasePushRepository(getSupabaseAdmin())
        : createStubPushRepository();

    const healthRepo: IHealthRepository = isSupabaseConfigured
        ? new SupabaseHealthRepository(getSupabaseAdmin())
        : createStubHealthRepository();

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

    const openAiClient = env.AI_API_BASE_URL && env.AI_API_KEY && env.AI_API_DEFAULT_MODEL
        ? new AiApiClient({
            baseUrl: env.AI_API_BASE_URL,
            apiKey: env.AI_API_KEY,
            defaultModel: env.AI_API_DEFAULT_MODEL,
            timeoutMs: env.AI_API_TIMEOUT_MS,
        })
        : new AiApiClientStub();

    if (!(env.AI_API_BASE_URL && env.AI_API_KEY && env.AI_API_DEFAULT_MODEL)) {
        logger.warn(
            '[container] IA no configurada — usando AiApiClientStub con datos mock. ' +
            'Rellena AI_API_BASE_URL / AI_API_KEY / AI_API_DEFAULT_MODEL en .env para usar IA real.',
        );
    }

    // Si el Motor está configurado, lo usamos para generateQuestions/generateSurgicalTest
    // (RAG + evidencia verbatim del temario). El cliente OpenAI se mantiene como fallback
    // para Foto-Test, Pista IA, Bloque 9 y Bloque 10.
    const aiApi = isMotorConfigured
        ? new CompositeAiClient({
            questions: new MotorAiClient({
                baseUrl: env.MOTOR_API_BASE_URL!,
                apiKey: env.MOTOR_API_KEY!,
                openAiKey: env.AI_API_KEY ?? '',
                timeoutMs: env.MOTOR_API_TIMEOUT_MS,
                defaultCursoId: env.MOTOR_DEFAULT_CURSO_ID,
            }),
            fallback: openAiClient,
          })
        : openAiClient;

    if (isMotorConfigured) {
        logger.info(
            '[container] Motor de IA activo — generateQuestions y generateSurgicalTest ' +
            'usarán RAG con evidencia verbatim del temario oficial.',
        );
    }

    // ─── Expo Push Service + use cases de notificaciones ─────────────────────
    // Se construyen antes del objeto useCases para evitar referencias circulares.
    const pushService = new ExpoPushService(env.EXPO_ACCESS_TOKEN);
    const registerPushToken        = new RegisterPushTokenUseCase(pushRepo);
    const sendBoeAlert             = new SendBoeAlertUseCase(pushRepo, pushService);
    const sendNoteReady            = new SendNoteReadyUseCase(pushRepo, pushService);
    const sendStreakWarning        = new SendStreakWarningUseCase(pushRepo, pushService);
    const sendDailyGoalCompleted   = new SendDailyGoalCompletedUseCase(pushRepo, pushService);

    const motorBoe = env.MOTOR_BOE_BASE_URL
        ? new MotorBoeClient({
            baseUrl: env.MOTOR_BOE_BASE_URL,
            apiKey: env.MOTOR_BOE_API_KEY ?? '',
            openAiKey: env.MOTOR_BOE_OPENAI_KEY ?? env.AI_API_KEY ?? '',
            timeoutMs: 20_000,
        })
        : null;

    if (!env.MOTOR_BOE_BASE_URL) {
        logger.warn(
            '[container] Motor BOE no configurado — MotorBoeClient desactivado. ' +
            'Rellena MOTOR_BOE_BASE_URL en .env para activar la sincronización automática de cambios.',
        );
    }

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
        deleteAccount: new DeleteAccountUseCase(authRepo),

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
        toggleTask: new ToggleTaskUseCase(
            planningRepo,
            dashboardRepo,
            (userId) => sendDailyGoalCompleted.execute(userId),
        ),
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

        // Bloque 6 · Entrenamiento
        listMockExams: new ListMockExamsUseCase(trainingRepo),
        getMockExam: new GetMockExamUseCase(trainingRepo),
        generateQuestions: new GenerateQuestionsUseCase(aiApi),
        analyzePhoto: new AnalyzePhotoUseCase(aiApi),
        generateSurgicalTest: new GenerateSurgicalTestUseCase(aiApi, trainingRepo),
        saveAttempt: new SaveAttemptUseCase(trainingRepo, dashboardRepo, storeRepo),
        listErrorPatterns: new ListErrorPatternsUseCase(trainingRepo),
        listBookmarks: new ListBookmarksUseCase(trainingRepo),
        saveBookmark: new SaveBookmarkUseCase(trainingRepo),
        deleteBookmark: new DeleteBookmarkUseCase(trainingRepo),
        // Bloque 7 · Sesión de entrenamiento
        generateHint: new GenerateHintUseCase(aiApi),
        reportQuestion: new ReportQuestionUseCase(),

        // Bloque 8 · Aula Virtual / Tutor IA
        listConversations: new ListConversationsUseCase(tutorRepo),
        getConversation: new GetConversationUseCase(tutorRepo),
        createConversation: new CreateConversationUseCase(tutorRepo),
        sendMessage: new SendMessageUseCase(tutorRepo),
        deleteConversation: new DeleteConversationUseCase(tutorRepo),
        listDecks: new ListDecksUseCase(tutorRepo),
        getDeckWithCards: new GetDeckWithCardsUseCase(tutorRepo),
        generateDeck: new GenerateDeckUseCase(tutorRepo),
        deleteDeck: new DeleteDeckUseCase(tutorRepo),
        submitReview: new SubmitReviewUseCase(tutorRepo),
        listEpisodes: new ListEpisodesUseCase(tutorRepo),
        getEpisode: new GetEpisodeUseCase(tutorRepo),
        getProgress: new GetProgressUseCase(tutorRepo),
        saveProgress: new SaveProgressUseCase(tutorRepo),
        listSummaries: new ListSummariesUseCase(tutorRepo),
        getSummary: new GetSummaryUseCase(tutorRepo),

        // Bloque 9 · Factoría de Apuntes
        listNotes: new ListNotesUseCase(notesRepo),
        getNote: new GetNoteUseCase(notesRepo),
        uploadNote: new UploadNoteUseCase(
            notesRepo,
            aiApi,
            (userId, noteId, count, title) => sendNoteReady.execute(userId, noteId, count, title),
        ),
        getNoteStatus: new GetNoteStatusUseCase(notesRepo),
        updateNoteTags: new UpdateNoteTagsUseCase(notesRepo),
        deleteNote: new DeleteNoteUseCase(notesRepo),
        generateTestFromNote: new GenerateTestFromNoteUseCase(notesRepo),

        // Bloque 10 · Monitor BOE
        getBoeFeed: new GetBoeFeedUseCase(boeRepo),
        getBoeDetail: new GetBoeChangeDetailUseCase(boeRepo),
        getBoeComparison: new GetBoeComparisonUseCase(boeRepo),
        getBoeMiniTest: new GetBoeMiniTestUseCase(boeRepo, aiApi),
        markBoeRead: new MarkBoeReadUseCase(boeRepo),
        toggleBoeBookmark: new ToggleBoeBookmarkUseCase(boeRepo),
        completeBoeMiniTest: new CompleteBoeMiniTestUseCase(boeRepo, dashboardRepo),
        listTopics: new ListTopicsUseCase(boeRepo),
        syncBoeChanges: motorBoe
            ? new SyncBoeChangesUseCase(
                boeRepo,
                motorBoe,
                (synced) => sendBoeAlert.execute(synced),
              )
            : undefined,
        listBoeRegulations: new ListFollowedRegulationsUseCase(boeRepo),
        followBoeRegulation: new FollowRegulationUseCase(boeRepo, motorBoe, env.MOTOR_BOE_CURSO_ID ?? null),
        unfollowBoeRegulation: new UnfollowRegulationUseCase(boeRepo, motorBoe, env.MOTOR_BOE_CURSO_ID ?? null),
        searchBoeCatalog: new SearchBoeRegulationsUseCase(motorBoe, env.MOTOR_BOE_CURSO_ID ?? null),
        syncBoeCatalog: motorBoe ? new SyncBoeCatalogUseCase(motorBoe) : undefined,

        // Bloque 11 · Tienda
        getStoreBalance: new GetStoreBalanceUseCase(storeRepo),
        listStoreProducts: new ListStoreProductsUseCase(storeRepo),
        getStoreProduct: new GetStoreProductUseCase(storeRepo),
        redeemProduct: new RedeemProductUseCase(storeRepo),
        listStoreDiscounts: new ListStoreDiscountsUseCase(storeRepo),
        redeemDiscount: new RedeemDiscountUseCase(storeRepo),
        getWallet: new GetWalletUseCase(storeRepo),
        getWalletItem: new GetWalletItemUseCase(storeRepo),
        listCommunityTests: new ListCommunityTestsUseCase(storeRepo),
        getCommunityTest: new GetCommunityTestUseCase(storeRepo),
        publishCommunityTest: new PublishCommunityTestUseCase(storeRepo),
        obtainCommunityTest: new ObtainCommunityTestUseCase(storeRepo),

        // Bloque 12 · Configuración
        getPreferences:    new GetPreferencesUseCase(configRepo),
        updatePreferences: new UpdatePreferencesUseCase(configRepo),
        getProStats:       new GetProStatsUseCase(configRepo),
        exportProStats:    new ExportProStatsUseCase(configRepo),
        submitFeedback:    new SubmitFeedbackUseCase(configRepo),

        // Bloque 3 · Salud — dispositivos
        getHealthDevices:    new GetDevicesUseCase(healthRepo),
        registerHealthDevice: new RegisterDeviceUseCase(healthRepo),
        deleteHealthDevice:  new DeleteDeviceUseCase(healthRepo),

        // Bloque 13 · Notificaciones
        registerPushToken,
        sendBoeAlert,
        sendNoteReady,
        sendStreakWarning,
        sendDailyGoalCompleted,
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
        listTopics: useCases.listTopics,
        listAgenda: useCases.listAgenda,
        createAgendaDate: useCases.createAgendaDate,
    });
    const trainingController = new TrainingController({
        listMockExams: useCases.listMockExams,
        getMockExam: useCases.getMockExam,
        generateQuestions: useCases.generateQuestions,
        analyzePhoto: useCases.analyzePhoto,
        generateSurgicalTest: useCases.generateSurgicalTest,
        saveAttempt: useCases.saveAttempt,
        listErrorPatterns: useCases.listErrorPatterns,
        listBookmarks: useCases.listBookmarks,
        saveBookmark: useCases.saveBookmark,
        deleteBookmark: useCases.deleteBookmark,
        generateHint: useCases.generateHint,
        reportQuestion: useCases.reportQuestion,
        listTopics: useCases.listTopics,
    });

    const notesController = new NotesController({
        listNotes: useCases.listNotes,
        getNote: useCases.getNote,
        uploadNote: useCases.uploadNote,
        getNoteStatus: useCases.getNoteStatus,
        updateTags: useCases.updateNoteTags,
        deleteNote: useCases.deleteNote,
        generateTest: useCases.generateTestFromNote,
    });

    const boeController = new BoeController({
        getFeed: useCases.getBoeFeed,
        getDetail: useCases.getBoeDetail,
        getComparison: useCases.getBoeComparison,
        getMiniTest: useCases.getBoeMiniTest,
        markRead: useCases.markBoeRead,
        toggleBookmark: useCases.toggleBoeBookmark,
        completeMiniTest: useCases.completeBoeMiniTest,
        syncChanges: useCases.syncBoeChanges,
        listRegulations: useCases.listBoeRegulations,
        followRegulation: useCases.followBoeRegulation,
        unfollowRegulation: useCases.unfollowBoeRegulation,
        searchCatalog: useCases.searchBoeCatalog,
        syncCatalog: useCases.syncBoeCatalog,
    });

    const storeController = new StoreController({
        getBalance: useCases.getStoreBalance,
        listProducts: useCases.listStoreProducts,
        getProduct: useCases.getStoreProduct,
        redeemProduct: useCases.redeemProduct,
        listDiscounts: useCases.listStoreDiscounts,
        redeemDiscount: useCases.redeemDiscount,
        getWallet: useCases.getWallet,
        getWalletItem: useCases.getWalletItem,
        listCommunityTests: useCases.listCommunityTests,
        getCommunityTest: useCases.getCommunityTest,
        publishCommunityTest: useCases.publishCommunityTest,
        obtainCommunityTest: useCases.obtainCommunityTest,
    });

    const tutorController = new TutorController({
        listConversations: useCases.listConversations,
        getConversation: useCases.getConversation,
        createConversation: useCases.createConversation,
        sendMessage: useCases.sendMessage,
        deleteConversation: useCases.deleteConversation,
        listDecks: useCases.listDecks,
        getDeckWithCards: useCases.getDeckWithCards,
        generateDeck: useCases.generateDeck,
        deleteDeck: useCases.deleteDeck,
        submitReview: useCases.submitReview,
        listEpisodes: useCases.listEpisodes,
        getEpisode: useCases.getEpisode,
        getProgress: useCases.getProgress,
        saveProgress: useCases.saveProgress,
        listSummaries: useCases.listSummaries,
        getSummary: useCases.getSummary,
    });

    const healthController = new HealthController({
        getDevices:     useCases.getHealthDevices,
        registerDevice: useCases.registerHealthDevice,
        deleteDevice:   useCases.deleteHealthDevice,
    });

    const pushTokenController = new PushTokenController({
        registerToken: useCases.registerPushToken,
    });

    const configController = new ConfigController({
        getPreferences:    useCases.getPreferences,
        updatePreferences: useCases.updatePreferences,
        getProStats:       useCases.getProStats,
        exportProStats:    useCases.exportProStats,
        submitFeedback:    useCases.submitFeedback,
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
        trainingRepo,
        clientApi,
        aiApi,
        motorBoe,
        useCases,
        pushRepo,
        pushService,
        controllers: {
            health: healthController,
            auth: authController,
            dashboard: dashboardController,
            planning: planningController,
            motivation: motivationController,
            training: trainingController,
            tutor: tutorController,
            notes: notesController,
            boe: boeController,
            store: storeController,
            config: configController,
            push: pushTokenController,
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

function createStubTrainingRepository(): ITrainingRepository {
    const notConfigured = (): never => {
        throw new Error('[training] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as ITrainingRepository, { get: () => notConfigured });
}

function createStubTutorRepository(): ITutorRepository {
    const notConfigured = (): never => {
        throw new Error('[tutor] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as ITutorRepository, { get: () => notConfigured });
}

function createStubNotesRepository(): INotesRepository {
    const notConfigured = (): never => {
        throw new Error('[notes] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as INotesRepository, { get: () => notConfigured });
}

function createStubBoeRepository(): IBoeRepository {
    const notConfigured = (): never => {
        throw new Error('[boe] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as IBoeRepository, { get: () => notConfigured });
}

function createStubStoreRepository(): IStoreRepository {
    const notConfigured = (): never => {
        throw new Error('[store] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as IStoreRepository, { get: () => notConfigured });
}

function createStubConfigRepository(): IConfigRepository {
    const notConfigured = (): never => {
        throw new Error('[config] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as IConfigRepository, { get: () => notConfigured });
}

function createStubPushRepository(): IPushRepository {
    const notConfigured = (): never => {
        throw new Error('[push] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as IPushRepository, { get: () => notConfigured });
}

function createStubHealthRepository(): IHealthRepository {
    const notConfigured = (): never => {
        throw new Error('[health] Supabase no configurado. Rellena .env y reinicia.');
    };
    return new Proxy({} as IHealthRepository, { get: () => notConfigured });
}
