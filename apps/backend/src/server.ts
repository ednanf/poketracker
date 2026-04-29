import { envConfig } from './config/env.config.js';
import app from './app.js';
import dbConnectUtil from './utils/dbConnect.util.js';
import http from 'http';

// Create server instance
const server = http.createServer(app);

// Main entry point
const serverStart = async (): Promise<void> => {
    try {
        // Determine which URI to use; defaulting to local for dev
        const connectionString =
            envConfig.MONGODB_URI !== 'EMPTY'
                ? envConfig.MONGODB_URI
                : envConfig.MONGODB_LOCAL_URI;

        // Connect to MongoDB
        await dbConnectUtil(connectionString);

        // Start the server
        server.listen(envConfig.PORT, () => {
            console.log(
                `**[system]** server is listening on port ${envConfig.PORT}...`,
            );
            console.log(`**[system]** mode: ${envConfig.NODE_ENV}`);

            if (envConfig.NODE_VERSION) {
                console.log(
                    `**[system]** node version: ${envConfig.NODE_VERSION}`,
                );
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
