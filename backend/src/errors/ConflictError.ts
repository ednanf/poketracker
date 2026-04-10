import { StatusCodes } from "http-status-codes";
import HttpError from "./HttpError";

// Custom errors class for Conflict.
// This class extends HttpError and sets the status code to 409.
// It is used to indicate that the request could not be completed due to a conflict with the current state of the resource.
class ConflictError extends HttpError {
  constructor(message: string) {
    super(StatusCodes.CONFLICT, message);
  }
}

export default ConflictError;
