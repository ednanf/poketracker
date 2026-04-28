import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import {
    generateAccessToken,
    generateRefreshToken,
    attachCookiesToResponse,
} from '../../src/utils/jwt.util.js';

describe('JWT Utilities', () => {
    const MOCK_USER_ID = '507f1f77bcf86cd799439011';
    const ACCESS_SECRET = 'test_access_secret';
    const REFRESH_SECRET = 'test_refresh_secret';

    beforeEach(() => {
        // Set environment variables for the test context
        vi.stubEnv('JWT_ACCESS_SECRET', ACCESS_SECRET);
        vi.stubEnv('JWT_REFRESH_SECRET', REFRESH_SECRET);
        vi.stubEnv('NODE_ENV', 'development');
    });

    describe('Token Generation', () => {
        it('should generate a valid access token with the correct payload', () => {
            const token = generateAccessToken(MOCK_USER_ID);

            const decoded = jwt.verify(token, ACCESS_SECRET) as {
                userId: string;
            };

            expect(decoded.userId).toBe(MOCK_USER_ID);
            expect(token).toBeDefined();
        });

        it('should generate a valid refresh token with a longer expiration', () => {
            const token = generateRefreshToken(MOCK_USER_ID);
            const decoded = jwt.verify(token, REFRESH_SECRET) as {
                userId: string;
                exp: number;
                iat: number;
            };

            expect(decoded.userId).toBe(MOCK_USER_ID);

            // Check that refresh token duration is roughly 7 days longer
            const duration = decoded.exp - decoded.iat;
            expect(duration).toBeCloseTo(7 * 24 * 60 * 60, 0);
        });
    });

    describe('attachCookiesToResponse', () => {
        it('should call res.cookie with the correct security parameters', () => {
            const MOCK_TOKEN = 'mock_refresh_token_string';

            // Create a clean mock response without using 'any'
            const mockRes = {
                cookie: vi.fn(),
            } as unknown as Response;

            attachCookiesToResponse(mockRes, MOCK_TOKEN);

            expect(mockRes.cookie).toHaveBeenCalledWith(
                'refreshToken',
                MOCK_TOKEN,
                expect.objectContaining({
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: false, // false because NODE_ENV is stubbed as development
                }),
            );
        });

        it('should set secure: true when in production', () => {
            vi.stubEnv('NODE_ENV', 'production');
            const mockRes = { cookie: vi.fn() } as unknown as Response;

            attachCookiesToResponse(mockRes, 'token');

            expect(mockRes.cookie).toHaveBeenCalledWith(
                'refreshToken',
                expect.any(String),
                expect.objectContaining({
                    secure: true,
                }),
            );
        });
    });
});
