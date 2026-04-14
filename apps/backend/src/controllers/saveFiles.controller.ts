// getAllSaveFiles, getSaveFileById, createSaveFile, updateSaveFile, deleteSaveFile, syncSaveFile

import { Request, Response, NextFunction } from 'express';

const getAllSaveFiles = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: GET /api/v1/save-files');
    res.status(200).json({ message: 'Stub: getAllSaveFiles' });
};

const getSaveFileById = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: GET /api/v1/save-files/:id');
    res.status(200).json({ message: 'Stub: getSaveFileById' });
};

const createSaveFile = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: POST /api/v1/save-files');
    res.status(201).json({ message: 'Stub: createSaveFile' });
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
