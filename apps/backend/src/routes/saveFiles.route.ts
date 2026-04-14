import express from 'express';

import {
    getAllSaveFiles,
    getSaveFileById,
    createSaveFile,
    updateSaveFile,
    deleteSaveFile,
    syncSaveFile,
} from '../controllers/saveFiles.controller.js';

const router = express.Router();

// TODO: add sanitization and zod validation to the routes

// `/api/v1/save-file`
router.get('/', getAllSaveFiles);
router.post('/', createSaveFile);
router.get('/:id', getSaveFileById);
router.patch('/:id', updateSaveFile);
router.delete('/:id', deleteSaveFile);

export default router;
