// registerUser, loginUser, refreshToken, logoutUser

import { NextFunction, Request, Response } from 'express';

const registerUser = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: POST /api/v1/register');
    res.status(200).json({ message: 'Stub: registerUser' });
};

const loginUser = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: POST /api/v1/login');
    res.status(200).json({ message: 'Stub: loginUser' });
};

const refreshToken = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: POST /api/v1/refresh-token');
    res.status(200).json({ message: 'Stub: refreshToken' });
};

const logoutUser = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: POST /api/v1/logout');
    res.status(200).json({ message: 'Stub: logoutUser' });
};

export { registerUser, loginUser, logoutUser, refreshToken };
