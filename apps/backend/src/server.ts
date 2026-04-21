import { env } from './config/env.js';
import app from './app.js';
import dbConnectUtil from './utils/dbConnect.util.js';
import http from 'http';

/**
 * Create the HTTP server instance.
 * Note: No need for dotenv here since you use the --env-file flag.
 */
const server = http.createServer(app);

/**
 * Main entry point to bootstrap the backend.
 */
const serverStart = async (): Promise<void> => {
    try {
        // Determine which URI to use; defaulting to local for dev
        const connectionString =
            env.MONGODB_URI !== 'EMPTY'
                ? env.MONGODB_URI
                : env.MONGODB_LOCAL_URI;

        // Connect to MongoDB
        await dbConnectUtil(connectionString);

        // Start the server
        server.listen(env.PORT, () => {
            console.log(
                `**[system]** server is listening on port ${env.PORT}...`,
            );
            console.log(`**[system]** mode: ${env.NODE_ENV}`);

            if (env.NODE_VERSION) {
                console.log(`**[system]** node version: ${env.NODE_VERSION}`);
            }
        });
    } catch (e) {
        console.error(
            '**[error]** an error occurred when starting the server, exiting with code 1',
            e,
        );
        process.exit(1);
    }
};

// Start the sequence
await serverStart();
