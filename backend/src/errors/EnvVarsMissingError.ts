import { StatusCodes } from "http-status-codes";
import { HttpError } from "./index";

class EnvVarsMissingError extends HttpError {
  constructor(message: string) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, message);
  }
}

export default EnvVarsMissingError;
