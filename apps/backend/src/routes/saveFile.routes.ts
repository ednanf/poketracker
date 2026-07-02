import { Router } from 'express';

import {
    getAllSaveFiles,
    createSaveFile,
    getSaveFileById,
    renameSaveFile,
    deleteSaveFile,
    catchPokemon,
    deletePokemon,
} from '../controllers/saveFile.controller.js';

const router = Router();

// `/api/v1/save-files`
router.get('/save-files', getAllSaveFiles);
router.post('/save-files', createSaveFile);

router.get('/save-files/:id', getSaveFileById);
router.patch('/save-files/:id', renameSaveFile);
router.delete('/save-files/:id', deleteSaveFile);

router.post('/save-files/:id/pokemon', catchPokemon);
router.delete('/save-files/:id/pokemon', deletePokemon);

export default router;
