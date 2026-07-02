import { Router } from 'express';

import {
    createSession,
    destroySession,
    createUser,
    getCurrentUser,
    updateCurrentUser,
    deleteCurrentUser,
} from '../controllers/user.controller.js';

const router = Router();

// TODO: add requireAuth and validate middleware

// `/api/v1/sessions`
router.post('/sessions', createSession); // Public
router.delete('/sessions', destroySession); // Public | Clears cookie safely

// `/api/v1/users`
router.post('/users', createUser); // Public
router.get('/users/me', getCurrentUser); // Authenticated
router.patch('/users/me', updateCurrentUser); // Authenticated
router.delete('/users/me', deleteCurrentUser); // Authenticated

export default router;
