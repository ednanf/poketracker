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

/*
 * Account types
 * */

export interface UserProfilePayload {
    message: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
}

/*
 * Save file types
 * */

// Base shape of a Save File returned by the API
export interface SaveFilePayload {
    id: string;
    name: string;
    type: 'NATIONAL' | 'REGIONAL';
    gameVersion: string;
    caughtIds: string[];
    createdAt?: string;
    updatedAt?: string;
}

// Specific payload for a successful creation response
export interface CreateSaveFileSuccessPayload {
    message: string;
    saveFile: SaveFilePayload;
}

// Payload for fetching multiple save files
export interface GetAllSaveFilesSuccessPayload {
    message: string;
    saveFiles: SaveFilePayload[];
}
