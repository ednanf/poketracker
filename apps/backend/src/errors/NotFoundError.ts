import { StatusCodes } from 'http-status-codes';
import { HttpError } from './index.js';

// Custom errors class for Not Found (HTTP 404)
// This class extends HttpError and sets the status code to 404.
// It is used to indicate that the requested resource could not be found on the server.
class NotFoundError extends HttpError {
    constructor(message: string) {
        super(StatusCodes.NOT_FOUND, message);
    }
}

export default NotFoundError;
