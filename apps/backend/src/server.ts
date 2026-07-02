import http from 'http';

import app from './app.js';
import envConfig from './config/env.config.js';
import dbConnect from './config/dbConnect.config.js';

const server = http.createServer(app);

const serverStart = async () => {
    try {
        // Determine which URI to use – default is local
        const connectionString =
            envConfig.MONGODB_URI !== 'EMPTY_URI'
                ? envConfig.MONGODB_URI
                : envConfig.MONGODB_LOCAL_URI;

        // Connect to the database using the correct URI
        await dbConnect(connectionString);

        // Start the server
        server.listen(envConfig.PORT, () => {
            console.log(`**[system]** environment: ${envConfig.NODE_ENV}`);

            console.log(`**[system]** node version: ${envConfig.NODE_VERSION}`);

            console.log(
                `**[system]** server is listening on port ${envConfig.PORT}...`,
            );
        });
    } catch (e) {
        console.error(
            '**[error]** an error occurred when starting the server, exiting with code 1',
            e,
        );

        process.exit(1);
    }
};

// Start the server

await serverStart();
