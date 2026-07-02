import { StatusCodes } from 'http-status-codes';
import { HttpError } from './index.js';

// Custom errors class for Unauthenticated.
// This class extends HttpError and sets the status code to 401.
// It is used to indicate that the request requires user authentication.
class UnauthenticatedError extends HttpError {
    constructor(message: string) {
        super(StatusCodes.UNAUTHORIZED, message);
    }
}

export default UnauthenticatedError;
