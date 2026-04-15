import express from 'express';
import { validate } from '../middleware/validate.middleware.js';
import {
    CreateSaveFileSchema,
    SyncPayloadSchema,
    SaveFileIdSchema,
    UpdateSaveFileSchema,
} from '@poketracker/shared';

import {
    getAllSaveFiles,
    getSaveFileById,
    createSaveFile,
    updateSaveFile,
    deleteSaveFile,
    syncSaveFile,
} from '../controllers/saveFiles.controller.js';

const router = express.Router();

// TODO: add sanitization

// `/api/v1/save-file`
router.get('/', getAllSaveFiles);
router.post('/', validate(CreateSaveFileSchema), createSaveFile);
router.get('/:id', validate(SaveFileIdSchema), getSaveFileById);
router.patch('/:id', validate(UpdateSaveFileSchema), updateSaveFile);
router.delete('/:id', validate(SaveFileIdSchema), deleteSaveFile);
router.patch('/:id/sync', validate(SyncPayloadSchema), syncSaveFile);

export default router;
