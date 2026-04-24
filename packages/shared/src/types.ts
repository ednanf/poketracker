/*
 * Generic API response
 * */
export interface ApiResponse<T = never> {
    status: 'success' | 'error';
    data: T;
}

/*
 * Error types
 * */
export interface ApiError {
    message: string;
    errorId?: string; // Optional, used for 500 fallback logging
}

// Database Specific Error Payload
export interface MongoDatabaseError {
    code: number;
    message: string;
}

/*
 * Auth types
 * */
export interface AuthSuccessPayload {
    message: string;
    accessToken: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
}
