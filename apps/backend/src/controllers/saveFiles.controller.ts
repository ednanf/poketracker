import { Request, Response, NextFunction } from 'express';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import SaveFile, { ISaveFile } from '../models/SaveFile.model.js';
import UnauthenticatedError from '../errors/UnauthenticatedError.js';
import {
    ApiResponse,
    CreateSaveFileInput,
    CreateSaveFileSuccessPayload,
    DeleteSaveFileSuccessPayload,
    GetAllSaveFilesSuccessPayload,
    GetSaveFileSuccessPayload,
    SaveFileMetadataPayload,
    SaveFilePayload,
    UpdateSaveFileInput,
    UpdateSaveFileSuccessPayload,
} from '@poketracker/shared';
import { ForbiddenError, NotFoundError } from '../errors/index.js';

// Define the exact shape MongoDB returns from the specific aggregation pipeline.
interface SaveFileAggregationResult {
    _id: Types.ObjectId;
    name: string;
    type: 'NATIONAL' | 'REGIONAL';
    gameVersion: string;
    caughtCount: number; // Virtual field
    createdAt?: Date;
    updatedAt?: Date;
}

// Map the Aggregation POJO to the Network Payload (for getAllSaveFiles).
const mapToSaveFileMetadata = (
    doc: SaveFileAggregationResult,
): SaveFileMetadataPayload => ({
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    gameVersion: doc.gameVersion,
    caughtCount: doc.caughtCount,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
});

// Map the true Mongoose Document to the Network Payload (for getSaveFileById).
const mapToSaveFilePayload = (
    doc: HydratedDocument<ISaveFile>,
): SaveFilePayload => ({
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    gameVersion: doc.gameVersion,
    caughtIds: doc.caughtIds || [],
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
});

const getAllSaveFiles = async (
    req: Request,
    res: Response<ApiResponse<GetAllSaveFilesSuccessPayload>>,
    next: NextFunction,
) => {
    try {
        const userId = req.userId;

        if (!userId) {
            next(
                new UnauthenticatedError(
                    'User context missing. Please log in again.',
                ),
            );
            return;
        }

        // High performance aggregation pipeline.
        const saveFiles = await SaveFile.aggregate([
            // Find only the documents belonging to this user.
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) },
            },
            // Define exactly what the database should return.
            {
                $project: {
                    name: 1,
                    type: 1,
                    gameVersion: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    // calculate the length of the array.
                    // $ifNull protects against old/corrupted documents where caughtIds might be missing
                    caughtCount: { $size: { $ifNull: ['$caughtIds', []] } },
                },
            },
        ]);

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'Save files successfully retrieved.',
                saveFiles: saveFiles.map(mapToSaveFileMetadata), // Ensure payload is formated correctly by mapping each document.
            },
        });
    } catch (error) {
        next(error);
    }
};

const getSaveFileById = async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<GetSaveFileSuccessPayload>>,
    next: NextFunction,
) => {
    try {
        const userId = req.userId;

        if (!userId) {
            next(
                new UnauthenticatedError(
                    'User context missing. Please log in again.',
                ),
            );
            return;
        }

        const { id } = req.params;

        // Fetch the specific Save File (This one INCLUDES the caughtIds array).
        const saveFile = await SaveFile.findById(id);

        if (!saveFile) {
            next(new NotFoundError('Save file not found.'));
            return;
        }

        // Ensure the authenticated user actually owns this file.
        if (saveFile.userId.toString() !== userId) {
            next(new ForbiddenError('Access denied to this save file.'));
            return;
        }

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'Save file successfully retrieved.',
                saveFile: mapToSaveFilePayload(saveFile),
            },
        });
    } catch (error) {
        next(error);
    }
};

const createSaveFile = async (
    req: Request<unknown, unknown, CreateSaveFileInput>,
    res: Response<ApiResponse<CreateSaveFileSuccessPayload>>,
    next: NextFunction,
) => {
    try {
        // Retrieve the userId attached by the auth middleware.
        const userId = req.userId;

        if (!userId) {
            next(
                new UnauthenticatedError(
                    'User context missing. Please log in again.',
                ),
            );
            return;
        }

        const { name, type, gameVersion } = req.body;

        // Create the Save File in MongoDB.
        // Explicitly define `caughtIds: []` to guarantee the sparse protocol starts clean.
        const saveFile = await SaveFile.create({
            userId,
            name,
            type,
            gameVersion,
            caughtIds: [],
        });

        // Respond with the newly created Save File.
        res.status(StatusCodes.CREATED).json({
            status: 'success',
            data: {
                message: 'Save file successfully created.',
                saveFile: {
                    id: saveFile._id.toString(),
                    name: saveFile.name,
                    type: saveFile.type,
                    gameVersion: saveFile.gameVersion,
                    caughtIds: saveFile.caughtIds,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// Used only to patch the save file's name.
const updateSaveFile = async (
    req: Request<{ id: string }, unknown, UpdateSaveFileInput>,
    res: Response<ApiResponse<UpdateSaveFileSuccessPayload>>,
    next: NextFunction,
) => {
    try {
        const userId = req.userId;

        if (!userId) {
            next(
                new UnauthenticatedError(
                    'User context missing. Please log in again.',
                ),
            );
            return;
        }

        const { id } = req.params;
        const { name } = req.body;

        // Fetch the file and verify ownership.
        const saveFile = await SaveFile.findById(id);

        if (!saveFile) {
            next(new NotFoundError('Save file not found.'));
            return;
        }

        if (saveFile.userId.toString() !== userId) {
            next(new ForbiddenError('Access denied to this save file.'));
            return;
        }

        // Update the name
        if (name) {
            saveFile.name = name;
            await saveFile.save();
        }

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'Save file name updated successfully.',
                saveFile: {
                    id: saveFile._id.toString(),
                    name: saveFile.name,
                    type: saveFile.type,
                    gameVersion: saveFile.gameVersion,
                    caughtIds: saveFile.caughtIds,
                    createdAt: saveFile.createdAt?.toISOString(),
                    updatedAt: saveFile.updatedAt?.toISOString(),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

const deleteSaveFile = async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<DeleteSaveFileSuccessPayload>>,
    next: NextFunction,
) => {
    try {
        const userId = req.userId;

        if (!userId) {
            next(
                new UnauthenticatedError(
                    'User context missing. Please log in again.',
                ),
            );
            return;
        }

        const { id } = req.params;

        // Fetch the file and verify ownership.
        const saveFile = await SaveFile.findById(id);

        if (!saveFile) {
            next(new NotFoundError('Save file not found.'));
            return;
        }

        if (saveFile.userId.toString() !== userId) {
            next(new ForbiddenError('Access denied to this save file.'));
            return;
        }

        // Delete the document.
        await saveFile.deleteOne();

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'Save file successfully deleted.',
            },
        });
    } catch (error) {
        next(error);
    }
};

const syncSaveFile = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: POST /api/v1/save-files/sync');
    res.status(200).json({ message: 'Stub: syncSaveFile' });
};

export {
    getAllSaveFiles,
    getSaveFileById,
    createSaveFile,
    updateSaveFile,
    deleteSaveFile,
    syncSaveFile,
};
