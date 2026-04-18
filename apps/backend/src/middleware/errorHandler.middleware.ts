import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/CustomError.js';
import type { ApiError, ApiResponse } from '@poketracker/shared';
import { MongoServerError } from 'mongodb';

const logError = (error: unknown, errorId: string) => {
    const timestamp = new Date().toISOString();
    // Narrowing unknown to Error for safe property access
    const isError = error instanceof Error;

    if (isError) {
        console.error(
            `[${timestamp}] [ErrorID: ${errorId}] Error: ${error.message}`,
        );
        if (error.stack) console.error(error.stack);
    } else {
        console.error(
            `[${timestamp}] [ErrorID: ${errorId}] Unknown error:`,
            error,
        );
    }
};

const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    // 1. Custom App Errors (Catching the base CustomError)
    // We check for the property directly to force TS to acknowledge it exists on 'unknown'
    if (err instanceof CustomError || (err instanceof Error && 'statusCode' in err)) {
        const appError = err as CustomError;
        const response: ApiResponse<ApiError> = {
            status: 'error',
            data: { message: appError.message },
        };
        res.status(appError.statusCode).json(response);
        return;
    }

    // 2. MongoDB: Duplicate Key Error (e.g., Email already exists)
    // We use the driver's MongoServerError for proper narrowing
    if (err instanceof MongoServerError && err.code === 11000) {
        const keyValue = err.keyValue as Record<string, unknown> | undefined;
        const keyName = Object.keys(keyValue || {}).join(', ');
        const capitalizedKeyName =
            keyName.charAt(0).toUpperCase() + keyName.slice(1);

        res.status(StatusCodes.CONFLICT).json({
            status: 'error',
            data: { message: `${capitalizedKeyName} already exists.` },
        });
        return;
    }

    // 3. Mongoose: Validation Error
    if (err instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(err.errors).map((val) => val.message);
        res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            data: { message: `Invalid input data: ${messages.join('. ')}` },
        });
        return;
    }

    // 4. Mongoose: Cast Error (Invalid ObjectId format)
    if (err instanceof mongoose.Error.CastError) {
        res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            data: { message: `Invalid ${err.path}: ${err.value}.` },
        });
        return;
    }

    // 5. JWT: Token Expired or Malformed
    if (err instanceof Error) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                data: { message: 'Not authorized. Invalid or expired token.' },
            });
            return;
        }
    }

    // 6. Fallback for Unknown 500 Errors
    const errorId = crypto.randomUUID();
    logError(err, errorId);

    // Security: Do not leak raw database errors to the client in production.
    const isProduction = process.env.NODE_ENV === 'production';
    
    let message = 'Internal Server Error';
    if (isProduction) {
        message = 'Something went wrong on our end. Please report the Error ID to support.';
    } else if (err instanceof Error) {
        message = err.message;
    }

    const response: ApiResponse<ApiError & { errorId: string }> = {
        status: 'error',
        data: { message, errorId },
    };

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
};

export default errorHandler;
