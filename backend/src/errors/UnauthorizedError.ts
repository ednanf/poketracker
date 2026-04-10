import { StatusCodes } from "http-status-codes";
import HttpError from "./HttpError";

// Custom errors class for Unauthorized.
// This class extends HttpError and sets the status code to 401.
// It is used to indicate that the request requires user authentication.
class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}

export default UnauthorizedError;
