import express from 'express';

import {
    whoAmI,
    patchUser,
    deleteUser,
} from '../controllers/account.controller.js';

const router = express.Router();

// TODO: add sanitization and zod validation to the routes

// `/api/v1/account`
router.get('/', whoAmI);
router.patch('/', patchUser);
router.delete('/', deleteUser);

export default router;
