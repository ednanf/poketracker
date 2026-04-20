import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';

import { createTestApp } from '../helpers/createTestApp.js';
import accountRouter from '../../src/routes/account.route.js';
import * as accountController from '../../src/controllers/account.controller.js';

// Mock the controller module
vi.mock('../../src/controllers/account.controller.js', () => ({
    whoAmI: vi.fn((req, res) =>
        res.status(StatusCodes.OK).json({ message: 'hit' }),
    ),
    patchUser: vi.fn((req, res) =>
        res.status(StatusCodes.OK).json({ message: 'hit' }),
    ),
    deleteUser: vi.fn((req, res) =>
        res.status(StatusCodes.OK).json({ message: 'hit' }),
    ),
}));

describe('Account Routes', () => {
    // Note: Changed mount path to match your comment
    const app = createTestApp('/api/v1/account', accountRouter);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /', () => {
        it('returns `200` and calls `whoami` controller', async () => {
            const response = await request(app).get('/api/v1/account');

            expect(response.status).toBe(StatusCodes.OK);
            expect(accountController.whoAmI).toHaveBeenCalled();
        });
    });

    describe('PATCH /', () => {
        it('returns `200` and calls `patchUser` controller with valid data', async () => {
            const response = await request(app)
                .patch('/api/v1/account')
                .send({ username: 'new_username' });

            expect(response.status).toBe(StatusCodes.OK);
            expect(accountController.patchUser).toHaveBeenCalled();
        });

        it('returns `400` when patching with unexpected fields', async () => {
            const response = await request(app)
                .patch('/api/v1/account')
                .send({ unknown_field: 'hacking' });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(accountController.patchUser).not.toHaveBeenCalled();
        });

        it('sanitizes XSS attempts in the patch body', async () => {
            // noinspection HtmlDeprecatedAttribute
            const response = await request(app).patch('/api/v1/account').send({
                // Pad the string with "Ash_" so it survives the .min(3) check
                username: 'Ash_<img src=x onerror=alert(1) alt="whatever">',
            });

            expect(response.status).toBe(StatusCodes.OK);

            const mockedPatch = vi.mocked(accountController.patchUser);
            const receivedData = mockedPatch.mock.calls[0][0].body;

            // Check that the malicious tag is gone, but the data was still processed
            expect(receivedData.username).not.toContain('<img');
        });
    });

    describe('DELETE /', () => {
        it('returns `200` and calls `deleteUser` controller', async () => {
            const response = await request(app).delete('/api/v1/account');

            expect(response.status).toBe(StatusCodes.OK);
            expect(accountController.deleteUser).toHaveBeenCalled();
        });
    });

    describe('Security Middleware', () => {
        it('applies security headers to account routes', async () => {
            const response = await request(app).get('/api/v1/account');
            expect(response.headers).toHaveProperty(
                'x-content-type-options',
                'nosniff',
            );
            expect(response.headers).not.toHaveProperty('x-powered-by');
        });
    });
});
