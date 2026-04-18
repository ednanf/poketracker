import express from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { UpdateAccountSchema } from '@poketracker/shared';

import {
    whoAmI,
    patchUser,
    deleteUser,
} from '../controllers/account.controller.js';

const router = express.Router();

// `/api/v1/account`
router.get('/', whoAmI);
router.patch('/', validate(UpdateAccountSchema), patchUser);
router.delete('/', deleteUser);

export default router;
