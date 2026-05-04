import { Types } from 'mongoose';

declare global {
    namespace Express {
        interface Request {
            userId?: string; // Appended by the authenticateUser middleware
        }
    }
}
