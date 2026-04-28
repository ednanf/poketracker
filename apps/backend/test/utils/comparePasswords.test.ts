import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import comparePasswords from '../../src/utils/comparePasswords.util.js';

describe('comparePasswords utility', () => {
    const PASSWORD = 'trainer_red_123';
    const WRONG_PASSWORD = 'blue_is_better';

    it('returns true when the password matches the hash', async () => {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(PASSWORD, salt);

        const result = await comparePasswords(PASSWORD, hash);

        expect(result).toBe(true);
    });

    it('returns false when the password does not match the hash', async () => {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(PASSWORD, salt);

        const result = await comparePasswords(WRONG_PASSWORD, hash);

        expect(result).toBe(false);
    });

    it('returns false when compared against an empty string or invalid hash', async () => {
        const result = await comparePasswords(PASSWORD, 'not-a-real-hash');

        expect(result).toBe(false);
    });
});
