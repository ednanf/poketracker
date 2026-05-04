import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import SaveFile from '../models/SaveFile.model.js';
import UnauthenticatedError from '../errors/UnauthenticatedError.js';
import {
    ApiResponse,
    CreateSaveFileInput,
    CreateSaveFileSuccessPayload,
} from '@poketracker/shared';

const getAllSaveFiles = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: GET /api/v1/save-files');
    res.status(200).json({ message: 'Stub: getAllSaveFiles' });
};

const getSaveFileById = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: GET /api/v1/save-files/:id');
    res.status(200).json({ message: 'Stub: getSaveFileById' });
};

const createSaveFile = async (
    req: Request<unknown, unknown, CreateSaveFileInput>,
    res: Response<ApiResponse<CreateSaveFileSuccessPayload>>,
    next: NextFunction,
) => {
    try {
        // Retrieve the userId attached by the auth middleware
        const userId = req.userId;

        if (!userId) {
            return next(
                new UnauthenticatedError(
                    'User context missing. Please log in again.',
                ),
            );
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

        // Respond with the newly created Save File
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

const updateSaveFile = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: PATCH /api/v1/save-files');
    res.status(200).json({ message: 'Stub: updateSaveFile' });
};

const deleteSaveFile = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: DELETE /api/v1/save-files');
    res.status(200).json({ message: 'Stub: deleteSaveFile' });
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
