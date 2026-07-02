import { Router } from 'express';

import {
    createPasswordReset,
    updatePasswordViaReset,
    createEmailVerification,
    updateEmailVerificationStatus,
} from '../controllers/lifeCycle.controller.js';

const router = Router();

// TODO: add limiter middleware for resend emails

// Password Reset Lifecycle
router.post('/password-resets', createPasswordReset);
router.put('/password-resets/:token', updatePasswordViaReset);

// Email Verification Lifecycle
router.post('/email-verifications', createEmailVerification);
router.put('/email-verifications/:token', updateEmailVerificationStatus);

export default router;
