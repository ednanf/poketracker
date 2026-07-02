import { Request, Response, NextFunction } from 'express';

/*
 * PASSWORD RESETS
 */

// Initiates password reset
export const createPasswordReset = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    // Expected body: { email }
    res.status(202).json({
        message:
            'createPasswordReset endpoint hit. Token generated and emailed.',
    });
};

// Completes password reset
export const updatePasswordViaReset = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    // Expected params: { token }
    // Expected body: { password }
    res.status(200).json({
        message: 'updatePasswordViaReset endpoint hit. Password updated.',
    });
};

/*
 * EMAIL VERIFICATIONS
 */

// Requests a new verification email
export const createEmailVerification = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    // Expected body: { email }
    res.status(202).json({
        message: 'createEmailVerification endpoint hit. New token emailed.',
    });
};

// Consumes the verification token to confirm the account
export const updateEmailVerificationStatus = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    // Expected params: { token }
    res.status(200).json({
        message:
            'updateEmailVerificationStatus endpoint hit. Account verified.',
    });
};
