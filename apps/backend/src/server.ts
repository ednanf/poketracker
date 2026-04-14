import http from 'http';
import app from './app.js';
import checkEnvVars from './utils/checkEnvVars.js';
import dbConnect from './utils/dbConnect.js';

// Import environment variables using node built-in functionality
const { NODE_ENV, PORT = 3000, MONGODB_LOCAL_URI, MONGODB_URI } = process.env;

// Check if all required variables are present via utility function
checkEnvVars(['NODE_ENV', 'PORT', 'MONGODB_LOCAL_URI', 'MONGODB_URI']);

// Define the DB URI according to the current environment (production or development)
const DB_URI = NODE_ENV === 'production' ? MONGODB_URI : MONGODB_LOCAL_URI;

// Create a server using the constructed app - separates the express application and the server itself
const server: http.Server = http.createServer(app);

// Define a function to start the server and handle possible errors
const serverStart = async () => {
    try {
        await dbConnect(DB_URI);
        server.listen(PORT, () => {
            console.log(`**[system]** server is listening on port ${PORT}...`);
        });
    } catch (e) {
        console.error(
            '**[error]** an error occurred when starting the server, exiting with code 1',
            e,
        );
        process.exit(1);
    }
};

// Start the server properly, handling any eventual error that for some reason was not caught
serverStart().catch((e) => {
    console.error(
        '**[error]** an error occurred when starting the server, exiting with code 1',
        e,
    );
    process.exit(1);
});
