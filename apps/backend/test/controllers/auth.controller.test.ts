import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import {
    ApiResponse,
    AuthSuccessPayload,
    RegisterInput,
} from '@poketracker/shared';
import User from '../../src/models/User.model.js';
import RefreshToken from '../../src/models/RefreshToken.model.js';
import * as jwtUtils from '../../src/utils/jwt.util.js';
import { mockMongooseDoc } from '../helpers/mongoose.helper.js';
import { registerUser } from '../../src/controllers/auth.controller.js';

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

            // 3. LOOK AT THIS BEAUTY. No "Awaited", no "ReturnType", just clean calls.
            vi.spyOn(User, 'create').mockResolvedValue(
                mockMongooseDoc<typeof User.create>(mockUserDoc),
            );

            vi.spyOn(RefreshToken, 'create').mockResolvedValue(
                mockMongooseDoc<typeof RefreshToken.create>({}),
            );

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
            vi.spyOn(User, 'create').mockRejectedValue(dbError);

            await registerUser(
                mockReq as Request<unknown, unknown, RegisterInput>,
                mockRes as Response<ApiResponse<AuthSuccessPayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(dbError);
        });
    });
});
