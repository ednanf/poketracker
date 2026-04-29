import { Options } from 'express-rate-limit';

// This file configures the rate limiting options for the Express application.
// It sets a limit on the number of requests an IP can make in a given time window
// to prevent abuse and ensure fair usage of resources.
const rateLimitOptions: Partial<Options> = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300, // Limit each IP to X requests per windowMs
    message: {
        status: 429,
        error: 'Too many requests, please try again later.',
    },
};

export default rateLimitOptions;
