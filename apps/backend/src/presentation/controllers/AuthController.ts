import type { Request, Response, NextFunction } from 'express';
import type { ApiSuccessResponse, Session as SessionDTO, AuthUser } from '@opox/types';
import { TERMS_VERSION, PRIVACY_VERSION } from '@opox/constants';
import type {
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
} from '../../application';
import type { Session, User } from '../../domain';

/**
 * Controller de auth. NO contiene lógica de negocio — solo:
 *   1. Extrae datos del request
 *   2. Llama al use case correspondiente
 *   3. Serializa la respuesta a ApiResponse<T>
 */
export class AuthController {
    constructor(
        private readonly deps: {
            register: RegisterUseCase;
            login: LoginUseCase;
            oauthLogin: OAuthLoginUseCase;
            sendOtp: SendOtpUseCase;
            verifyOtp: VerifyOtpUseCase;
            requestPasswordReset: RequestPasswordResetUseCase;
            confirmPasswordReset: ConfirmPasswordResetUseCase;
            createBiometricChallenge: CreateBiometricChallengeUseCase;
            linkBiometric: LinkBiometricUseCase;
            biometricLogin: BiometricLoginUseCase;
            getSession: GetSessionUseCase;
            refreshSession: RefreshSessionUseCase;
            logout: LogoutUseCase;
            acceptTerms: AcceptTermsUseCase;
        },
    ) { }

    // ─── Helpers de serialización ─────────────────

    private serializeUser(user: User): AuthUser {
        return {
            id: user.id,
            email: user.email,
            ...(user.displayName && { displayName: user.displayName }),
            ...(user.termsAcceptedAt && { termsAcceptedAt: user.termsAcceptedAt.toISOString() }),
            hasBiometric: user.hasBiometric,
            ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
            createdAt: user.createdAt.toISOString(),
        };
    }

    private serializeSession(session: Session): SessionDTO {
        return {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            expiresIn: session.expiresIn,
            issuedAt: session.issuedAt.toISOString(),
            user: this.serializeUser(session.user),
        };
    }

    private ok<T>(res: Response, status: number, data: T): void {
        const body: ApiSuccessResponse<T> = { ok: true, data };
        res.status(status).json(body);
    }

    // ─── Handlers ─────────────────────────────────

    register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const session = await this.deps.register.execute(req.body);
            this.ok(res, 201, this.serializeSession(session));
        } catch (err) { next(err); }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const session = await this.deps.login.execute(req.body);
            this.ok(res, 200, this.serializeSession(session));
        } catch (err) { next(err); }
    };

    oauthLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const session = await this.deps.oauthLogin.execute(req.body);
            this.ok(res, 200, this.serializeSession(session));
        } catch (err) { next(err); }
    };

    sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.deps.sendOtp.execute(req.body);
            this.ok(res, 202, { sent: true });
        } catch (err) { next(err); }
    };

    verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const session = await this.deps.verifyOtp.execute(req.body);
            this.ok(res, 200, this.serializeSession(session));
        } catch (err) { next(err); }
    };

    requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.deps.requestPasswordReset.execute(req.body.email);
            this.ok(res, 202, { sent: true });
        } catch (err) { next(err); }
    };

    confirmPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const session = await this.deps.confirmPasswordReset.execute(req.body);
            this.ok(res, 200, this.serializeSession(session));
        } catch (err) { next(err); }
    };

    biometricChallenge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const challenge = await this.deps.createBiometricChallenge.execute(req.body.deviceId);
            this.ok(res, 200, challenge);
        } catch (err) { next(err); }
    };

    biometricLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.authUser!.id;
            await this.deps.linkBiometric.execute({
                userId,
                devicePublicKey: req.body.devicePublicKey,
                deviceId: req.body.deviceId,
            });
            this.ok(res, 200, { linked: true });
        } catch (err) { next(err); }
    };

    biometricLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const session = await this.deps.biometricLogin.execute(req.body);
            this.ok(res, 200, this.serializeSession(session));
        } catch (err) { next(err); }
    };

    me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const session = await this.deps.getSession.execute(req.authUser!.accessToken);
            this.ok(res, 200, this.serializeUser(session.user));
        } catch (err) { next(err); }
    };

    refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const session = await this.deps.refreshSession.execute(req.body.refreshToken);
            this.ok(res, 200, this.serializeSession(session));
        } catch (err) { next(err); }
    };

    logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.deps.logout.execute(req.authUser!.accessToken);
            this.ok(res, 200, { loggedOut: true });
        } catch (err) { next(err); }
    };

    acceptTerms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = await this.deps.acceptTerms.execute({
                userId: req.authUser!.id,
                termsVersion: req.body.termsVersion || TERMS_VERSION,
                privacyVersion: req.body.privacyVersion || PRIVACY_VERSION,
            });
            this.ok(res, 200, this.serializeUser(user));
        } catch (err) { next(err); }
    };
}
