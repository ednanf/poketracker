import { StatusCodes } from 'http-status-codes';
import { HttpError } from './index.js';

// Custom errors class for Internal Server Error.
// This class extends HttpError and sets the status code to 500.
// It is used to indicate that the server encountered an unexpected condition that prevented it from fulfilling the request.
class InternalServerError extends HttpError {
    constructor(message: string) {
        super(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
}

export default InternalServerError;
