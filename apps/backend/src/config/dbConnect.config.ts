import * as mongoose from 'mongoose';

import { DatabaseError } from '../errors/index.js';

const dbConnect = async (uri: string | undefined): Promise<void> => {
    // If no URI is defined, stop
    if (!uri) {
        throw new DatabaseError(
            '**[error]** MONGODB_URI is missing. Please, set it in your environment variable.',
        );
    }

    // Try to connect
    try {
        await mongoose.connect(uri);
        console.log('**[system]** successfully connected to the database...');
    } catch (e) {
        throw new DatabaseError(
            `**[error]** failed to connect to the database: ${e}`,
        );
    }
};

export default dbConnect;
