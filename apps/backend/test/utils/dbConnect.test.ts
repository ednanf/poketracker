import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as mongoose from 'mongoose';
import dbConnectUtil from '../../src/utils/dbConnect.util.js';
import { DatabaseError } from '../../src/errors/index.js';

// Create a single mock function that survives the hoisting
const { mockConnect } = vi.hoisted(() => ({
    mockConnect: vi.fn(),
}));

// Point BOTH the named export and the default export to the same function
vi.mock('mongoose', () => ({
    connect: mockConnect,
    default: {
        connect: mockConnect,
    },
}));

describe('dbConnectUtil', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {
            /* empty */
        });
    });

    it('should throw DatabaseError if URI is missing', async () => {
        await expect(dbConnectUtil(undefined)).rejects.toThrow(DatabaseError);
    });

    it('should call mongoose.connect and log success on a valid URI', async () => {
        const VALID_URI = 'mongodb://localhost:27017/test';

        // Use the shared mockConnect here
        mockConnect.mockResolvedValue(mongoose);

        await dbConnectUtil(VALID_URI);

        expect(mockConnect).toHaveBeenCalledWith(VALID_URI);
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('successfully connected'),
        );
    });

    it('should wrap Mongoose errors in a DatabaseError if connection fails', async () => {
        const ERROR_MESSAGE = 'Connection timeout';

        // Use the shared mockConnect to force a failure
        mockConnect.mockRejectedValue(new Error(ERROR_MESSAGE));

        // Use a wrapper function to capture the promise correctly
        const callUtil = () => dbConnectUtil('mongodb://invalid-uri');

        await expect(callUtil()).rejects.toThrow(DatabaseError);
        await expect(callUtil()).rejects.toThrow(new RegExp(ERROR_MESSAGE));
    });
});
