import { StatusCodes } from 'http-status-codes';
import { HttpError } from './index.js';

// Custom errors class for Forbidden.
// This class extends HttpError and sets the status code to 403.
// It is used to indicate that the request requires user authentication.
class ForbiddenError extends HttpError {
    constructor(message: string) {
        super(StatusCodes.FORBIDDEN, message);
    }
}

export default ForbiddenError;
