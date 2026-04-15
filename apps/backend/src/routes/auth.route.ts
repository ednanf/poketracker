import express from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { RegisterSchema, LoginSchema } from '@poketracker/shared';

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
} from '../controllers/auth.controller.js';

const router = express.Router();

// TODO: add sanitization

// `/api/v1/auth`
router.post('/register', validate(RegisterSchema), registerUser);
router.post('/login', validate(LoginSchema), loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);

export default router;
