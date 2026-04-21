// apps/backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Types } from 'mongoose';

// Ensure these are in your .env file
// JWT_ACCESS_SECRET=your_super_secret_access_key
// JWT_REFRESH_SECRET=your_super_secret_refresh_key

export const generateAccessToken = (
    userId: Types.ObjectId | string,
): string => {
    return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET as string, {
        expiresIn: '15m',
    });
};

export const generateRefreshToken = (
    userId: Types.ObjectId | string,
): string => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, {
        expiresIn: '7d',
    });
};

export const attachCookiesToResponse = (
    res: Response,
    refreshToken: string,
) => {
    const sevenDays = 1000 * 60 * 60 * 24 * 7;

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, // Crucial: Prevents JavaScript/XSS from reading the cookie
        secure: process.env.NODE_ENV === 'production', // Must be true in production (HTTPS)
        expires: new Date(Date.now() + sevenDays),
        sameSite: 'lax', // Required for cross-site cookie sending in modern browsers
    });
};
