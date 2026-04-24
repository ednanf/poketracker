import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import {
    ApiResponse,
    AuthSuccessPayload,
    RegisterInput,
    LoginInput,
} from '@poketracker/shared';
import User from '../../src/models/User.model.js';
import RefreshToken from '../../src/models/RefreshToken.model.js';
import * as jwtUtils from '../../src/utils/jwt.util.js';
import {
    loginUser,
    registerUser,
} from '../../src/controllers/auth.controller.js';

vi.mock('../../src/utils/jwt.util.js', () => ({
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    attachCookiesToResponse: vi.fn(),
}));

describe('Auth controllers', () => {
    let mockReq: Partial<Request<unknown, unknown, RegisterInput>>;
    let mockRes: Partial<Response<ApiResponse<AuthSuccessPayload>>>;
    let mockNext: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();

        mockReq = {
            body: {
                email: 'ash@pallet.com',
                username: 'ash_ketchum',
                password: 'password123',
            },
        };

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        mockNext = vi.fn() as NextFunction;
    });

    describe('`registerUser` controller', () => {
        it('successfully registers a user with valid credentials', async () => {
            const mockUserId = '507f1f77bcf86cd799439011';

            const mockUserDoc = {
                _id: mockUserId,
                username: 'ash_ketchum',
                email: 'ash@pallet.com',
            };

            // By casting to unknown as MockInstance, we bypass Mongoose's
            // overloaded types
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

    describe('`loginUser` controller', () => {
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

            // Mocks the chain without using `any` and removes the unused variable
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
});
