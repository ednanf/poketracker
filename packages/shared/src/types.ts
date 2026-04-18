// Generic API Response Wrapper
export interface ApiResponse<T = never> {
    status: 'success' | 'error';
    data: T;
}

// Standard Error Payload
export interface ApiError {
    message: string;
    errorId?: string; // Optional, used for 500 fallback logging
}

// Database Specific Error Payload
export interface MongoDatabaseError {
    code: number;
    message: string;
}

// You can add specific Success response shapes here as we build the controllers.
// For example, what the login route returns:
export interface AuthSuccessPayload {
    message: string;
    user: {
        id: string;
        username: string;
    };
}