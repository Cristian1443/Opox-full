import { Router, type RequestHandler } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { AuthController } from '../controllers';
import { validateBody } from '../middleware';
import {
    registerSchema,
    loginSchema,
    oauthLoginSchema,
    otpSendSchema,
    otpVerifySchema,
    passwordResetRequestSchema,
    passwordResetConfirmSchema,
    biometricChallengeSchema,
    biometricLinkSchema,
    biometricLoginSchema,
    acceptTermsSchema,
    refreshSchema,
    updateProfileSchema,
} from '../validators';

export function createAuthRouter(
    controller: AuthController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();

    // Públicas
    r.post(API_ROUTES.AUTH.REGISTER, validateBody(registerSchema), controller.register);
    r.post(API_ROUTES.AUTH.LOGIN, validateBody(loginSchema), controller.login);
    r.post(API_ROUTES.AUTH.OAUTH, validateBody(oauthLoginSchema), controller.oauthLogin);

    r.post(API_ROUTES.AUTH.OTP_SEND, validateBody(otpSendSchema), controller.sendOtp);
    r.post(API_ROUTES.AUTH.OTP_VERIFY, validateBody(otpVerifySchema), controller.verifyOtp);

    r.post(
        API_ROUTES.AUTH.PASSWORD_RESET_REQUEST,
        validateBody(passwordResetRequestSchema),
        controller.requestPasswordReset,
    );
    r.post(
        API_ROUTES.AUTH.PASSWORD_RESET_CONFIRM,
        validateBody(passwordResetConfirmSchema),
        controller.confirmPasswordReset,
    );

    r.post(
        API_ROUTES.AUTH.BIOMETRIC_CHALLENGE,
        validateBody(biometricChallengeSchema),
        controller.biometricChallenge,
    );
    r.post(
        API_ROUTES.AUTH.BIOMETRIC_LOGIN,
        validateBody(biometricLoginSchema),
        controller.biometricLogin,
    );

    r.post(API_ROUTES.AUTH.REFRESH, validateBody(refreshSchema), controller.refresh);

    // Protegidas
    r.get(API_ROUTES.AUTH.ME, authMiddleware, controller.me);
    r.post(API_ROUTES.AUTH.LOGOUT, authMiddleware, controller.logout);
    r.post(
        API_ROUTES.AUTH.BIOMETRIC_LINK,
        authMiddleware,
        validateBody(biometricLinkSchema),
        controller.biometricLink,
    );
    r.post(
        API_ROUTES.AUTH.TERMS_ACCEPT,
        authMiddleware,
        validateBody(acceptTermsSchema),
        controller.acceptTerms,
    );
    r.patch(
        API_ROUTES.AUTH.PROFILE_UPDATE,
        authMiddleware,
        validateBody(updateProfileSchema),
        controller.updateProfile,
    );
    r.delete(API_ROUTES.AUTH.DELETE_ACCOUNT, authMiddleware, controller.deleteAccount);

    return r;
}
