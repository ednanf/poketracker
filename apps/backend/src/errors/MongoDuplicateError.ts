/* eslint-disable */
export interface MongoDuplicateError extends Error {
    cause?: {
        code: number;
        keyPattern: {
            [key: string]: number;
        };
        keyValue: {
            [key: string]: string;
        };
    };
}

// Check if the error is a MongoDB duplicate key error
export function isMongoDuplicateError(error: unknown): error is MongoDuplicateError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'cause' in error &&
        typeof (error as any).cause === 'object' &&
        (error as any).cause !== null &&
        'code' in (error as any).cause &&
        (error as any).cause.code === 11000
    );
}
