import express from 'express';

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
} from '../controllers/auth.controller.js';

const router = express.Router();

// TODO: add sanitization and zod validation to the routes

// `/api/v1/auth`
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);

export default router;
