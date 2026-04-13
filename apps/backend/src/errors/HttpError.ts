// This class defines a custom HTTP errors class that extends the CustomError class.
// It includes an HTTP status code and a message, allowing for more specific errors handling in web applications.

import CustomError from "./CustomError";

// Custom HTTP errors class for handling HTTP errors in web applications.
// It includes an HTTP status code and a message, allowing for more specific errors handling in web applications.
class HttpError extends CustomError {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message); // Call the parent constructor with the message
    this.statusCode = statusCode; // Set the status code for the HTTP error
  }
}

export default HttpError;
