import { Router } from 'express';
import { privacyPolicyHtml, termsHtml } from '../legal/legalPages';

// Rutas públicas (sin auth) con las páginas legales que exigen App Store
// Connect y Google Play. Son HTML estático, así que sí pueden cachearse
// (el middleware global pone `no-store`; aquí se sobreescribe).
export function createLegalRouter(): Router {
    const r = Router();

    const serve = (build: () => string) => (_req: unknown, res: import('express').Response) => {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.type('html').send(build());
    };

    r.get('/legal/privacidad', serve(privacyPolicyHtml));
    r.get('/legal/terminos', serve(termsHtml));

    return r;
}
