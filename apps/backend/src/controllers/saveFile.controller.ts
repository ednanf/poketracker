import { Request, Response, NextFunction } from 'express';

export const getAllSaveFiles = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'getAllSaveFiles endpoint hit.' });
};

export const getSaveFileById = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'getSaveFileById endpoint hit.' });
};

export const createSaveFile = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'createSaveFile endpoint hit.' });
};

// Updates save file's name only
export const renameSaveFile = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'renameSaveFile endpoint hit.' });
};

export const deleteSaveFile = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'deleteSaveFile endpoint hit.' });
};

export const catchPokemon = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'catchPokemon endpoint hit.' });
};

export const deletePokemon = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'deletePokemon endpoint hit.' });
};
