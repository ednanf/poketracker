import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import {
    ApiResponse,
    AuthSuccessPayload,
    LoginInput,
    RegisterInput,
} from '@poketracker/shared';

import User from '../../src/models/User.model.js';
import RefreshToken from '../../src/models/RefreshToken.model.js';
import * as jwtUtils from '../../src/utils/jwt.util.js';
import {
    loginUser,
    refreshToken,
    registerUser,
} from '../../src/controllers/auth.controller.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// Local interface just to keep TypeScript strict for the refresh controller payload
interface RefreshSuccessPayload {
    message: string;
    accessToken: string;
}

// ============================================================================
// TOP-LEVEL MOCKS
// ============================================================================

// Mock jsonwebtoken to avoid ESM/read-only "Module namespace" errors
vi.mock('jsonwebtoken', () => ({
    default: {
        verify: vi.fn(),
    },
}));

// Mock custom JWT utilities
vi.mock('../../src/utils/jwt.util.js', () => ({
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    attachCookiesToResponse: vi.fn(),
}));

describe('Auth controllers', () => {
    // ========================================================================
    // SHARED / UNIVERSAL SETUP
    // ========================================================================

    // Use Partial to avoid mocking all of the properties of an Express Request
    let mockReq: Partial<Request<unknown, unknown, RegisterInput>>;
    let mockRes: Partial<Response<ApiResponse<AuthSuccessPayload>>>;
    let mockNext: NextFunction;

    beforeEach(() => {
        // Wipe the slate clean before every single test
        vi.clearAllMocks();

        // Default Request (Tailored for Register, which is the first block)
        mockReq = {
            body: {
                email: 'ash@pallet.com',
                username: 'ash_ketchum',
                password: 'password123',
            },
        };

        // Reusable Response Mock (Chainable via mockReturnThis)
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        // Reusable Next Function
        mockNext = vi.fn() as NextFunction;
    });

    // ========================================================================
    // CONTROLLER: REGISTER
    // ========================================================================
    describe('`registerUser` controller', () => {
        it('successfully registers a user with valid credentials', async () => {
            const mockUserId = '507f1f77bcf86cd799439011';
            const mockUserDoc = {
                _id: mockUserId,
                username: 'ash_ketchum',
                email: 'ash@pallet.com',
            };

            // Casting to `unknown as MockInstance` bypasses Mongoose's
            // overloaded TS types without using `any`
            (
                vi.spyOn(User, 'create') as unknown as MockInstance
            ).mockResolvedValue(mockUserDoc);
            (
                vi.spyOn(RefreshToken, 'create') as unknown as MockInstance
            ).mockResolvedValue({});

            vi.mocked(jwtUtils.generateAccessToken).mockReturnValue(
                'mock-access',
            );
            vi.mocked(jwtUtils.generateRefreshToken).mockReturnValue(
                'mock-refresh',
            );

            await registerUser(
                mockReq as Request<unknown, unknown, RegisterInput>,
                mockRes as Response<ApiResponse<AuthSuccessPayload>>,
                mockNext,
            );

            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CREATED);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        accessToken: 'mock-access',
                        user: expect.objectContaining({ id: mockUserId }),
                    }),
                }),
            );
        });

        it('forwards database errors to the global error handler', async () => {
            const dbError = new Error('Database connection failed');
            (
                vi.spyOn(User, 'create') as unknown as MockInstance
            ).mockRejectedValue(dbError);

            await registerUser(
                mockReq as Request<unknown, unknown, RegisterInput>,
                mockRes as Response<ApiResponse<AuthSuccessPayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(dbError);
        });
    });

    // ========================================================================
    // CONTROLLER: LOGIN
    // ========================================================================
    describe('`loginUser` controller', () => {
        // Create a specific request object just for Login
        let loginReq: Partial<Request<unknown, unknown, LoginInput>>;

        beforeEach(() => {
            loginReq = {
                body: {
                    email: 'ash@pallet.com',
                    password: 'password123',
                },
            };
        });

        it('successfully logs in with valid credentials', async () => {
            const mockUserId = '507f1f77bcf86cd799439011';
            const mockUserDoc = {
                _id: mockUserId,
                username: 'ash_ketchum',
                email: 'ash@pallet.com',
                passwordHash: 'hashed_chars',
                comparePassword: vi.fn().mockResolvedValue(true),
            };

            // Mock the Mongoose Chain (findOne().select())
            (
                vi.spyOn(User, 'findOne') as unknown as MockInstance
            ).mockReturnValue({
                select: vi.fn().mockResolvedValue(mockUserDoc),
            });

            (
                vi.spyOn(RefreshToken, 'create') as unknown as MockInstance
            ).mockResolvedValue({});

            vi.mocked(jwtUtils.generateAccessToken).mockReturnValue(
                'mock-access',
            );
            vi.mocked(jwtUtils.generateRefreshToken).mockReturnValue(
                'mock-refresh',
            );

            await loginUser(
                loginReq as Request<unknown, unknown, LoginInput>,
                mockRes as Response<ApiResponse<AuthSuccessPayload>>,
                mockNext,
            );

            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        message: 'User successfully logged in.',
                    }),
                }),
            );
        });

        it('returns UnauthenticatedError if user is not found', async () => {
            (
                vi.spyOn(User, 'findOne') as unknown as MockInstance
            ).mockReturnValue({
                select: vi.fn().mockResolvedValue(null),
            });

            await loginUser(
                loginReq as Request<unknown, unknown, LoginInput>,
                mockRes as Response<ApiResponse<AuthSuccessPayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid email or password.',
                }),
            );
        });

        it('returns UnauthenticatedError if password is incorrect', async () => {
            const mockUserDoc = {
                comparePassword: vi.fn().mockResolvedValue(false),
            };

            (
                vi.spyOn(User, 'findOne') as unknown as MockInstance
            ).mockReturnValue({
                select: vi.fn().mockResolvedValue(mockUserDoc),
            });

            await loginUser(
                loginReq as Request<unknown, unknown, LoginInput>,
                mockRes as Response<ApiResponse<AuthSuccessPayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid email or password.',
                }),
            );
        });
    });

    // ========================================================================
    // CONTROLLER: REFRESH TOKEN
    // ========================================================================
    describe('`refreshToken` controller', () => {
        // Create a specific request object just for Refresh
        let refreshReq: Partial<Request>;
        const MOCK_REFRESH_TOKEN = 'valid_refresh_cookie_string';
        const MOCK_USER_ID = '507f1f77bcf86cd799439011';

        beforeEach(() => {
            // Stub the environment variable ONLY for the duration of these specific tests
            vi.stubEnv('JWT_REFRESH_SECRET', 'test_secret');

            refreshReq = {
                cookies: {
                    refreshToken: MOCK_REFRESH_TOKEN,
                },
            };
        });

        it('successfully issues a new access token when refresh token is valid', async () => {
            // Mock JWT verification to succeed
            (jwt.verify as unknown as MockInstance).mockReturnValue({
                userId: MOCK_USER_ID,
            });

            // Mock DB finding the active token
            (
                vi.spyOn(RefreshToken, 'findOne') as unknown as MockInstance
            ).mockResolvedValue({
                userId: MOCK_USER_ID,
                token: MOCK_REFRESH_TOKEN,
            });

            vi.mocked(jwtUtils.generateAccessToken).mockReturnValue(
                'brand-new-access-token',
            );

            await refreshToken(
                refreshReq as Request,
                mockRes as Response<ApiResponse<RefreshSuccessPayload>>,
                mockNext,
            );

            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        accessToken: 'brand-new-access-token',
                    }),
                }),
            );
            expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith(
                MOCK_USER_ID,
            );
        });

        it('calls next with `UnauthenticatedError` if no cookie is present', async () => {
            refreshReq.cookies = {}; // Simulate missing cookie

            await refreshToken(
                refreshReq as Request,
                mockRes as Response<ApiResponse<RefreshSuccessPayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Authentication invalid.' }),
            );
            // Ensure early exit pattern worked and didn't hit the DB
            expect(RefreshToken.findOne).not.toHaveBeenCalled();
        });

        it('calls next with error if `jwt.verify` fails (e.g., expired or tampered)', async () => {
            const jwtError = new Error('jwt expired');

            (jwt.verify as unknown as MockInstance).mockImplementation(() => {
                throw jwtError;
            });

            await refreshToken(
                refreshReq as Request,
                mockRes as Response<ApiResponse<RefreshSuccessPayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(jwtError);
        });

        it('calls next with `UnauthenticatedError` if token is revoked/not found in DB', async () => {
            (jwt.verify as unknown as MockInstance).mockReturnValue({
                userId: MOCK_USER_ID,
            });

            // Mock DB returning null (token was deleted/logged out)
            (
                vi.spyOn(RefreshToken, 'findOne') as unknown as MockInstance
            ).mockResolvedValue(null);

            await refreshToken(
                refreshReq as Request,
                mockRes as Response<ApiResponse<RefreshSuccessPayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Authentication invalid.' }),
            );
        });
    });

    // ========================================================================
    // CONTROLLER: LOGOUT (Coming soon)
    // ========================================================================
    // describe('`logout` controller', () => {
    //      /* empty */
    // })
});
