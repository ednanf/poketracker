import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/index.js';

// This middleware function handles requests that do not match any defined routes.
const notFound = (req: Request, _res: Response, next: NextFunction) => {
    const error = new NotFoundError(`404 - Not Found`);
    next(error);
};

export default notFound;
