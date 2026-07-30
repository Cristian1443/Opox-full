import { Router } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { NotesController } from '../controllers/NotesController';
import { validateBody } from '../middleware/validate';
import {
    uploadNoteBody,
    updateTagsBody,
    generateTestBody,
} from '../validators/notesValidators';
import type { RequestHandler } from 'express';

export function createNotesRouter(
    controller: NotesController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();
    const N = API_ROUTES.NOTES;

    // Listado y detalle
    r.get(N.LIST, authMiddleware, controller.listNotes);
    r.get(N.DETAIL, authMiddleware, controller.getNote);

    // Subida y análisis
    r.post(N.UPLOAD, authMiddleware, validateBody(uploadNoteBody), controller.uploadNote);
    r.get(N.STATUS, authMiddleware, controller.getStatus);

    // Edición y borrado
    r.put(N.TAGS, authMiddleware, validateBody(updateTagsBody), controller.updateTags);
    r.delete(N.DETAIL, authMiddleware, controller.deleteNote);

    // Generar test a partir del apunte
    r.post(N.GENERATE_TEST, authMiddleware, validateBody(generateTestBody), controller.generateTest);

    return r;
}
