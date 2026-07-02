// This ensures the file is treated as a module
export {};

declare global {
    namespace Express {
        interface Request {
            userId?: string; // Appended by the authenticateUser middleware
        }
    }
}
