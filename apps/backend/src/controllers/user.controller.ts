/*
 * Users controller include both account and authentication functionalities
 * */
import { Request, Response, NextFunction } from 'express';

/**
 * SESSION
 * */

// Log in user
export const createSession = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'createSession endpoint hit.' });
};

// Log out user
export const destroySession = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'destroySession endpoint hit.' });
};

/*
 * USER
 * */

// Create a new account
export const createUser = async (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(201).send({ message: 'createUser endpoint hit.' });
};

// Get current logged-in user
export const getCurrentUser = (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).json({ message: 'getCurrentUser endpoint hit.' });
};

// Patch current user information
export const updateCurrentUser = (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).send({ message: 'updateCurrentUser endpoint hit.' });
};

// Delete current user's account
export const deleteCurrentUser = (
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    res.status(200).send({ message: 'deleteCurrentUser endpoint hit.' });
};
