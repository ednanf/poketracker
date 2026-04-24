import { describe, it, expect } from 'vitest';
import hashPassword from '../../src/utils/hashPassword.util.js';

describe('`hashPassword` utility', () => {
    const PLAIN_TEXT_PASSWORD = 'password123';

    it('should generate a string hash that is not the plain text', async () => {
        const hashedPassword = await hashPassword(PLAIN_TEXT_PASSWORD);

        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(PLAIN_TEXT_PASSWORD);
        expect(hashedPassword.length).toBeGreaterThan(20);
    });

    it('should produce different hashes for the same password', async () => {
        const hashedPassword1 = await hashPassword(PLAIN_TEXT_PASSWORD);
        const hashedPassword2 = await hashPassword(PLAIN_TEXT_PASSWORD);

        expect(hashedPassword1).not.toBe(hashedPassword2);
    });
});
