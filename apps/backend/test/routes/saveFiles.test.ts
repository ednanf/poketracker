import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import {
    ApiResponse,
    GetAllSaveFilesSuccessPayload,
} from '@poketracker/shared';
import SaveFile from '../../src/models/SaveFile.model.js';
import { getAllSaveFiles } from '../../src/controllers/saveFiles.controller.js';

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
});
