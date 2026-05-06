import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import SaveFile from '../../src/models/SaveFile.model.js';
import {
    UnauthenticatedError,
    NotFoundError,
    ForbiddenError,
} from '../../src/errors/index.js';
import {
    ApiResponse,
    GetAllSaveFilesSuccessPayload,
} from '@poketracker/shared';
import {
    createSaveFile,
    deleteSaveFile,
    getAllSaveFiles,
    getSaveFileById,
    syncSaveFile,
    updateSaveFile,
} from '../../src/controllers/saveFiles.controller.js';

describe('SaveFile Controllers', () => {
    const MOCK_USER_ID = '507f1f77bcf86cd799439011';

    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        mockNext = vi.fn() as NextFunction;
    });

    // ========================================================================
    // CONTROLLER: getAllSaveFiles
    // ========================================================================
    describe('`getAllSaveFiles` controller', () => {
        let req: Partial<Request>;

        beforeEach(() => {
            req = { userId: MOCK_USER_ID };
        });

        it('successfully aggregates and maps save files for the user', async () => {
            // Create fake data shaped exactly like `SaveFileAggregationResult`.
            const mockAggregatedFiles = [
                {
                    _id: new mongoose.Types.ObjectId(), // Has to be an ObjectId to test the mapping
                    name: 'Ash Primary',
                    type: 'NATIONAL',
                    gameVersion: 'RED',
                    caughtCount: 151,
                    createdAt: new Date('2024-01-01T00:00:00Z'),
                    updatedAt: new Date('2024-01-02T00:00:00Z'),
                },
            ];

            // Mock the aggregate function.
            (
                vi.spyOn(SaveFile, 'aggregate') as unknown as MockInstance
            ).mockResolvedValue(mockAggregatedFiles);

            // Call the controller.
            await getAllSaveFiles(
                req as Request,
                mockRes as Response<ApiResponse<GetAllSaveFilesSuccessPayload>>,
                mockNext,
            );

            // Verify the response.
            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        message: 'Save files successfully retrieved.',
                        // Verify the mapping function worked (ObjectId -> string, Date -> ISOString).
                        saveFiles: expect.arrayContaining([
                            expect.objectContaining({
                                id: mockAggregatedFiles[0]._id.toString(),
                                name: 'Ash Primary',
                                caughtCount: 151,
                                createdAt: '2024-01-01T00:00:00.000Z',
                            }),
                        ]),
                    }),
                }),
            );

            // Verify the aggregation pipeline was called with the correct userId.
            const aggregateSpy = vi.mocked(SaveFile.aggregate);

            // Use the official Mongoose type for aggregation stages.
            const pipeline = aggregateSpy.mock
                .calls[0][0] as mongoose.PipelineStage[];

            // Narrow the first stage to a Match stage for strict property access.
            const matchStage = pipeline[0] as mongoose.PipelineStage.Match;

            expect(matchStage.$match.userId.toString()).toBe(MOCK_USER_ID);
        });

        it('calls next with UnauthenticatedError if userId is missing', async () => {
            req.userId = undefined; // Simulate missing auth

            await getAllSaveFiles(
                req as Request,
                mockRes as Response<ApiResponse<GetAllSaveFilesSuccessPayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('User context missing'),
                }),
            );
            // Ensure we don't waste a DB call
            expect(SaveFile.aggregate).not.toHaveBeenCalled();
        });

        it('forwards database errors to the global error handler', async () => {
            const dbError = new Error('Aggregation pipeline failed');

            (
                vi.spyOn(SaveFile, 'aggregate') as unknown as MockInstance
            ).mockRejectedValue(dbError);

            await getAllSaveFiles(
                req as Request,
                mockRes as Response<ApiResponse<GetAllSaveFilesSuccessPayload>>,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(dbError);
        });
    });

    // ========================================================================
    // CONTROLLER: getSaveFileById
    // ========================================================================
    describe('`getSaveFileById` controller', () => {
        let req: Partial<Request<{ id: string }>>;
        const MOCK_FILE_ID = 'file_abc123';

        // Fake Mongoose Document with a `toString()` method on userId.
        const mockSaveFileDoc = {
            _id: MOCK_FILE_ID,
            userId: { toString: () => MOCK_USER_ID }, // Mimics Mongoose ObjectId
            name: 'Ash Primary',
            type: 'NATIONAL',
            gameVersion: 'RED',
            caughtIds: [1, 4, 7], // Including the array since this route needs it
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        };

        beforeEach(() => {
            req = {
                userId: MOCK_USER_ID,
                params: { id: MOCK_FILE_ID },
            };
        });

        it('successfully retrieves and maps the save file if the user owns it', async () => {
            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockResolvedValue(mockSaveFileDoc);

            await getSaveFileById(
                req as Request<{ id: string }>,
                mockRes as Response,
                mockNext,
            );

            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        message: 'Save file successfully retrieved.',
                        // Verify mapToSaveFilePayload worked correctly
                        saveFile: expect.objectContaining({
                            id: MOCK_FILE_ID,
                            caughtIds: [1, 4, 7],
                            createdAt: '2024-01-01T00:00:00.000Z',
                        }),
                    }),
                }),
            );
        });

        it('calls next with `UnauthenticatedError` if `userId` is missing', async () => {
            req.userId = undefined;

            await getSaveFileById(
                req as Request<{ id: string }>,
                mockRes as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(UnauthenticatedError),
            );
            expect(SaveFile.findById).not.toHaveBeenCalled();
        });

        it('calls next with NotFoundError if the file does not exist in DB', async () => {
            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockResolvedValue(null);

            await getSaveFileById(
                req as Request<{ id: string }>,
                mockRes as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
        });

        it('calls next with `ForbiddenError` if another user tries to access the file', async () => {
            // Create a file owned by a DIFFERENT user
            const unauthorizedDoc = {
                ...mockSaveFileDoc,
                userId: { toString: () => 'some_other_hacker_id' },
            };

            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockResolvedValue(unauthorizedDoc);

            await getSaveFileById(
                req as Request<{ id: string }>,
                mockRes as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
            // Ensure no data was sent to the client
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    // ========================================================================
    // CONTROLLER: createSaveFile
    // ========================================================================
    describe('`createSaveFile` controller', () => {
        let req: Partial<Request>;

        const mockInput = {
            name: 'Nuzlocke Run',
            type: 'REGIONAL',
            gameVersion: 'EMERALD',
        };

        beforeEach(() => {
            req = {
                userId: MOCK_USER_ID,
                body: mockInput,
            };
        });

        it('successfully creates a new save file and initializes caughtIds to empty array', async () => {
            const mockCreatedDoc = {
                _id: 'new_file_123',
                ...mockInput,
                caughtIds: [], // Sparse protocol guarantee
            };

            const createSpy = (
                vi.spyOn(SaveFile, 'create') as unknown as MockInstance
            ).mockResolvedValue(mockCreatedDoc);

            await createSaveFile(req as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CREATED);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        message: 'Save file successfully created.',
                        saveFile: expect.objectContaining({
                            id: 'new_file_123',
                            caughtIds: [],
                        }),
                    }),
                }),
            );

            // Verify the DB was called with the correct explicit parameters.
            expect(createSpy).toHaveBeenCalledWith({
                userId: MOCK_USER_ID,
                name: 'Nuzlocke Run',
                type: 'REGIONAL',
                gameVersion: 'EMERALD',
                caughtIds: [],
            });
        });

        it('calls next with `UnauthenticatedError` if userId is missing', async () => {
            req.userId = undefined;

            await createSaveFile(req as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(UnauthenticatedError),
            );
            expect(SaveFile.create).not.toHaveBeenCalled();
        });
    });

    // ========================================================================
    // CONTROLLER: updateSaveFile
    // ========================================================================
    describe('`updateSaveFile` controller', () => {
        let req: Partial<Request>;
        const MOCK_FILE_ID = 'file_abc123';

        // Fake Document with a save() method and toString() on userId
        let mockSaveFileDoc: Record<string, unknown>;

        beforeEach(() => {
            req = {
                userId: MOCK_USER_ID,
                params: { id: MOCK_FILE_ID },
                body: { name: 'Renamed Ash Primary' },
            };

            // Reset document state before each test
            mockSaveFileDoc = {
                _id: MOCK_FILE_ID,
                userId: { toString: () => MOCK_USER_ID },
                name: 'Old Ash Primary',
                type: 'NATIONAL',
                gameVersion: 'RED',
                caughtIds: [1],
                save: vi.fn().mockResolvedValue(true),
            };
        });

        it('successfully updates the name and calls `save()` if the user owns it', async () => {
            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockResolvedValue(mockSaveFileDoc);

            await updateSaveFile(
                req as Request<never>,
                mockRes as Response,
                mockNext,
            );

            // 1. Verify mutation occurred
            expect(mockSaveFileDoc.name).toBe('Renamed Ash Primary');

            // 2. Verify Mongoose hooks were triggered
            expect(mockSaveFileDoc.save).toHaveBeenCalled();

            // 3. Verify the response contains the updated name
            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        saveFile: expect.objectContaining({
                            name: 'Renamed Ash Primary',
                        }),
                    }),
                }),
            );
        });

        it('calls next with `UnauthenticatedError` if `userId` is missing', async () => {
            req.userId = undefined;
            await updateSaveFile(
                req as Request<never>,
                mockRes as Response,
                mockNext,
            );
            expect(mockNext).toHaveBeenCalledWith(
                expect.any(UnauthenticatedError),
            );
        });

        it('calls next with `NotFoundError` if the file does not exist in DB', async () => {
            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockResolvedValue(null);
            await updateSaveFile(
                req as Request<never>,
                mockRes as Response,
                mockNext,
            );
            expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
        });

        it('calls next with `ForbiddenError` if another user tries to edit the file', async () => {
            const unauthorizedDoc = {
                ...mockSaveFileDoc,
                userId: { toString: () => 'some_other_hacker_id' },
            };

            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockResolvedValue(unauthorizedDoc);

            await updateSaveFile(
                req as Request<never>,
                mockRes as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
            expect(mockSaveFileDoc.save).not.toHaveBeenCalled(); // Ensure no DB writes occurred
        });
    });

    // ========================================================================
    // CONTROLLER: deleteSaveFile
    // ========================================================================
    describe('`deleteSaveFile` controller', () => {
        let req: Partial<Request>;
        const MOCK_FILE_ID = 'file_abc123';
        let mockSaveFileDoc: Record<string, unknown>;

        beforeEach(() => {
            req = {
                userId: MOCK_USER_ID,
                params: { id: MOCK_FILE_ID },
            };

            // Document with a deleteOne() method.
            mockSaveFileDoc = {
                _id: MOCK_FILE_ID,
                userId: { toString: () => MOCK_USER_ID },
                deleteOne: vi.fn().mockResolvedValue(true),
            };
        });

        it('successfully deletes the file if the user owns it', async () => {
            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockResolvedValue(mockSaveFileDoc);

            await deleteSaveFile(
                req as Request<{ id: string }>,
                mockRes as Response,
                mockNext,
            );

            expect(mockSaveFileDoc.deleteOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        message: 'Save file successfully deleted.',
                    }),
                }),
            );
        });

        it('calls next with `NotFoundError` if the file does not exist', async () => {
            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockResolvedValue(null);
            await deleteSaveFile(
                req as Request<{ id: string }>,
                mockRes as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
        });

        it('calls next with `ForbiddenError` if another user tries to delete it', async () => {
            const unauthorizedDoc = {
                ...mockSaveFileDoc,
                userId: { toString: () => 'some_other_hacker_id' },
            };

            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockResolvedValue(unauthorizedDoc);

            await deleteSaveFile(
                req as Request<{ id: string }>,
                mockRes as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
            expect(mockSaveFileDoc.deleteOne).not.toHaveBeenCalled();
        });
    });

    // ========================================================================
    // CONTROLLER: syncSaveFile
    // ========================================================================
    describe('`syncSaveFile` controller', () => {
        let req: Partial<Request>;
        const MOCK_FILE_ID = 'file_abc123';
        let mockSaveFileDoc: Record<string, unknown>;

        beforeEach(() => {
            req = {
                userId: MOCK_USER_ID,
                params: { id: MOCK_FILE_ID },
                body: {
                    actions: [
                        { action: 'ADD', pokemonId: 'bulbasaur' },
                        { action: 'REMOVE', pokemonId: 'pidgey' },
                    ],
                },
            };

            // A single document that satisfies both the ownership check and the refetch.
            mockSaveFileDoc = {
                _id: MOCK_FILE_ID,
                userId: { toString: () => MOCK_USER_ID },
                caughtIds: ['bulbasaur', 'pikachu'], // Simulated post-sync state
            };

            // Mock the chained findById().select() call.
            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockReturnValue({
                select: vi.fn().mockResolvedValue(mockSaveFileDoc),
            });
        });

        it('successfully executes a `bulkWrite` and returns updated `caughtIds`', async () => {
            const bulkWriteSpy = (
                vi.spyOn(SaveFile, 'bulkWrite') as unknown as MockInstance
            ).mockResolvedValue({ modifiedCount: 2 });

            await syncSaveFile(
                req as Request<never>,
                mockRes as Response,
                mockNext,
            );

            // Verify the Bulk Write Payload translated exactly to MongoDB commands.
            expect(bulkWriteSpy).toHaveBeenCalledWith([
                {
                    updateOne: {
                        filter: { _id: MOCK_FILE_ID },
                        update: { $addToSet: { caughtIds: 'bulbasaur' } },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: MOCK_FILE_ID },
                        update: { $pull: { caughtIds: 'pidgey' } },
                    },
                },
            ]);

            // Verify we returned the refetched data.
            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        caughtIds: ['bulbasaur', 'pikachu'], // from mockSaveFileDoc
                    }),
                }),
            );
        });

        it('exits early and returns `200` if actions array is empty', async () => {
            req.body.actions = [];

            const bulkWriteSpy = vi.spyOn(
                SaveFile,
                'bulkWrite',
            ) as unknown as MockInstance;

            await syncSaveFile(
                req as Request<never>,
                mockRes as Response,
                mockNext,
            );

            expect(bulkWriteSpy).not.toHaveBeenCalled(); // Saves DB resources
            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ caughtIds: [] }),
                }),
            );
        });

        it('calls next with `ForbiddenError` if another user tries to sync', async () => {
            const unauthorizedDoc = {
                ...mockSaveFileDoc,
                userId: { toString: () => 'some_other_hacker_id' },
            };

            (
                vi.spyOn(SaveFile, 'findById') as unknown as MockInstance
            ).mockReturnValue({
                select: vi.fn().mockResolvedValue(unauthorizedDoc),
            });

            const bulkWriteSpy = vi.spyOn(
                SaveFile,
                'bulkWrite',
            ) as unknown as MockInstance;

            await syncSaveFile(
                req as Request<never>,
                mockRes as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
            expect(bulkWriteSpy).not.toHaveBeenCalled(); // Secures the database
        });
    });
});
