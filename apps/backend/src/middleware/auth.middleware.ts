import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthenticatedError } from '../errors/index.js';

// Teach TypeScript that our Express Request object now contains a userId
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    // 1. Check if the Authorization header exists and is formatted correctly
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(
            new UnauthenticatedError(
                'Authentication invalid. Missing or malformed token.',
            ),
        );
    }

    // 2. Extract the token
    const token = authHeader.split(' ')[1];

    try {
        // 3. Mathematically verify the Access Token
        const payload = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET as string,
        ) as { userId: string };

        // 4. Attach the decoded userId to the request object
        req.userId = payload.userId;

        next();
    } catch (_error) {
        // If jwt.verify fails (expired, tampered, wrong secret), it throws an error.
        next(
            new UnauthenticatedError(
                'Authentication invalid. Token expired or rejected.',
            ),
        );
    }
};
