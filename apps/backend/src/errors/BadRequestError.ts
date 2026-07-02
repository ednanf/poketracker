import { StatusCodes } from 'http-status-codes';
import { HttpError } from './index.js';

// Custom errors class for Bad Request.
// This class extends HttpError and sets the status code to 400.
// It is used to indicate that the request sent by the client is invalid or malformed.
class BadRequestError extends HttpError {
    constructor(message: string) {
        super(StatusCodes.BAD_REQUEST, message);
    }
}

export default BadRequestError;
