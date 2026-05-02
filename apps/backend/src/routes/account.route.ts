import express from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { UpdateAccountSchema } from '@poketracker/shared';
import {
    deleteUser,
    patchUser,
    whoAmI,
} from '../controllers/account.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

// `/api/v1/account`
router.get('/', whoAmI);
router.patch('/', validate(UpdateAccountSchema), patchUser);
router.delete('/', deleteUser);

export default router;
