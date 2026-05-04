import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthenticatedError } from '../errors/index.js';

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    // Check if the Authorization header exists and is formatted correctly
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(
            new UnauthenticatedError(
                'Authentication invalid. Missing or malformed token.',
            ),
        );
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    try {
        // Mathematically verify the Access Token
        const payload = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET as string,
        ) as { userId: string };

        // Attach the decoded userId to the request object
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
