import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import type {
    ApiResponse,
    UpdateAccountInput,
    UserProfilePayload,
} from '@poketracker/shared';

import User from '../../src/models/User.model.js';
import RefreshToken from '../../src/models/RefreshToken.model.js';
import SaveFile from '../../src/models/SaveFile.model.js';
import {
    whoAmI,
    patchUser,
    deleteUser,
} from '../../src/controllers/account.controller.js';

describe('Account Controllers', () => {
    const MOCK_USER_ID = '507f1f77bcf86cd799439011';

    // Shared response and next functions
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    // The base fake user document, complete with mocked Mongoose instance methods
    let mockUserDoc: Record<string, unknown>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('NODE_ENV', 'development');

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            clearCookie: vi.fn().mockReturnThis(),
        };

        mockNext = vi.fn() as NextFunction;

        // Reset the mock document before each test so modifications don't leak
        mockUserDoc = {
            _id: MOCK_USER_ID,
            username: 'ash_ketchum',
            email: 'ash@pallet.com',
            save: vi.fn().mockResolvedValue(true),
            deleteOne: vi.fn().mockResolvedValue(true),
        };
    });

    // ========================================================================
    // CONTROLLER: whoAmI
    // ========================================================================
    describe('`whoAmI` controller', () => {
        let req: Partial<Request>;

        beforeEach(() => {
            req = { userId: MOCK_USER_ID };
        });

        it('returns 200 with user profile data', async () => {
            (
                vi.spyOn(User, 'findById') as unknown as MockInstance
            ).mockResolvedValue(mockUserDoc);

            await whoAmI(
                req as Request,
                mockRes as Response<ApiResponse<UserProfilePayload>>,
                mockNext,
            );

            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        user: expect.objectContaining({
                            id: MOCK_USER_ID,
                            username: 'ash_ketchum',
                        }),
                    }),
                }),
            );
        });

        it('calls next with UnauthenticatedError if user is deleted from DB', async () => {
            (
                vi.spyOn(User, 'findById') as unknown as MockInstance
            ).mockResolvedValue(null);

            await whoAmI(
                req as Request,
                mockRes as Response<ApiResponse<UserProfilePayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Authentication invalid.' }),
            );
        });
    });

    // ========================================================================
    // CONTROLLER: patchUser
    // ========================================================================
    describe('`patchUser` controller', () => {
        let req: Partial<Request<unknown, unknown, UpdateAccountInput>>;

        beforeEach(() => {
            req = {
                userId: MOCK_USER_ID,
                body: { username: 'new_ash_name' },
            };
        });

        it('updates user fields, calls save(), and returns 200', async () => {
            (
                vi.spyOn(User, 'findById') as unknown as MockInstance
            ).mockResolvedValue(mockUserDoc);

            await patchUser(
                req as Request<unknown, unknown, UpdateAccountInput>,
                mockRes as Response,
                mockNext,
            );

            // Verify the document properties were mutated
            expect(mockUserDoc.username).toBe('new_ash_name');
            // Verify Mongoose .save() was triggered to run hooks
            expect(mockUserDoc.save).toHaveBeenCalled();

            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        message: 'Account updated successfully.',
                    }),
                }),
            );
        });

        it('calls next with UnauthenticatedError if user no longer exists', async () => {
            (
                vi.spyOn(User, 'findById') as unknown as MockInstance
            ).mockResolvedValue(null);

            await patchUser(
                req as Request<unknown, unknown, UpdateAccountInput>,
                mockRes as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'User no longer exists.' }),
            );
        });
    });

    // ========================================================================
    // CONTROLLER: deleteUser
    // ========================================================================
    describe('`deleteUser` controller', () => {
        let req: Partial<Request>;

        beforeEach(() => {
            req = { userId: MOCK_USER_ID };
        });

        it('cascades deletion, clears cookie, and returns 200', async () => {
            (
                vi.spyOn(User, 'findById') as unknown as MockInstance
            ).mockResolvedValue(mockUserDoc);

            const deleteTokensSpy = (
                vi.spyOn(RefreshToken, 'deleteMany') as unknown as MockInstance
            ).mockResolvedValue({});
            const deleteSavesSpy = (
                vi.spyOn(SaveFile, 'deleteMany') as unknown as MockInstance
            ).mockResolvedValue({});

            await deleteUser(req as Request, mockRes as Response, mockNext);

            // Verify Cascade Deletions
            expect(deleteTokensSpy).toHaveBeenCalledWith({
                userId: MOCK_USER_ID,
            });
            expect(deleteSavesSpy).toHaveBeenCalledWith({
                userId: MOCK_USER_ID,
            });

            // Verify Instance Deletion
            expect(mockUserDoc.deleteOne).toHaveBeenCalled();

            // Verify Cookie Clearing
            expect(mockRes.clearCookie).toHaveBeenCalledWith(
                'refreshToken',
                expect.objectContaining({
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: false, // Because NODE_ENV is stubbed to 'development'
                }),
            );

            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
        });

        it('calls next with UnauthenticatedError if user no longer exists', async () => {
            (
                vi.spyOn(User, 'findById') as unknown as MockInstance
            ).mockResolvedValue(null);

            await deleteUser(req as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'User no longer exists.' }),
            );
        });
    });
});
