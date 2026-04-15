import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import checkEnvVarsUtils from '../../src/utils/checkEnvVars.utils.js';
import { EnvVarsMissingError } from '../../src/errors/index.js';

describe('checkEnvVarsUtils utility', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Mock process.env to ensure tests don't leak into each other
        vi.stubEnv('NODE_ENV', 'test');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should not throw an error if all required variables are present', () => {
        vi.stubEnv('PORT', '3000');
        vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017');

        // Expect this NOT to throw
        expect(() => checkEnvVarsUtils(['PORT', 'MONGODB_URI'])).not.toThrow();
    });

    it('should throw EnvVarsMissingError if a variable is missing', () => {
        vi.stubEnv('PORT', '3000');

        // MONGODB_URI is missing here
        expect(() => checkEnvVarsUtils(['PORT', 'MONGODB_URI'])).toThrow(
            EnvVarsMissingError,
        );
    });

    it('should include the names of missing variables in the error message', () => {
        // None of these are set
        const missing = ['VAR_A', 'VAR_B'];

        expect(() => checkEnvVarsUtils(missing)).toThrow(
            /missing environment variables: VAR_A, VAR_B/,
        );
    });
});
