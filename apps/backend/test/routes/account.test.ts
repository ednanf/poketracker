import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken'; // 1. Import JWT to mint real test tokens
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
    const app = createTestApp('/api/v1/account', accountRouter);

    // Setup token variables
    const TEST_SECRET = 'test_access_secret';
    let validAuthHeader: string;

    beforeEach(() => {
        vi.clearAllMocks();

        // Stub the secret and mint a valid token before each test
        vi.stubEnv('JWT_ACCESS_SECRET', TEST_SECRET);
        const validToken = jwt.sign(
            { userId: '507f1f77bcf86cd799439011' },
            TEST_SECRET,
        );
        validAuthHeader = `Bearer ${validToken}`;
    });

    // ========================================================================
    // AUTHENTICATION MIDDLEWARE TESTS
    // ========================================================================
    describe('Authentication Middleware (`requireAuth`)', () => {
        it('returns `401 Unauthenticated` if Authorization header is missing', async () => {
            const response = await request(app).get('/api/v1/account'); // No .set()

            expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
            expect(accountController.whoAmI).not.toHaveBeenCalled();
        });

        it('returns `401 Unauthenticated` if token does not start with "Bearer "', async () => {
            const response = await request(app)
                .get('/api/v1/account')
                .set('Authorization', 'Basic some_weird_token');

            expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        it('returns `401 Unauthenticated` if token is invalid or expired', async () => {
            // Sign a token with the wrong secret to simulate an invalid token
            const badToken = jwt.sign({ userId: '123' }, 'wrong_secret');

            const response = await request(app)
                .get('/api/v1/account')
                .set('Authorization', `Bearer ${badToken}`);

            expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
        });
    });

    // ========================================================================
    // ROUTE: GET /
    // ========================================================================
    describe('GET /', () => {
        it('returns `200` and calls `whoAmI` controller', async () => {
            // Attach the valid auth header to bypass the middleware
            const response = await request(app)
                .get('/api/v1/account')
                .set('Authorization', validAuthHeader);

            expect(response.status).toBe(StatusCodes.OK);
            expect(accountController.whoAmI).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // ROUTE: PATCH /
    // ========================================================================
    describe('PATCH /', () => {
        it('returns `200` and calls `patchUser` controller with valid data', async () => {
            const response = await request(app)
                .patch('/api/v1/account')
                .set('Authorization', validAuthHeader)
                .send({ username: 'new_username' });

            expect(response.status).toBe(StatusCodes.OK);
            expect(accountController.patchUser).toHaveBeenCalled();
        });

        it('returns `400` when patching with unexpected fields', async () => {
            const response = await request(app)
                .patch('/api/v1/account')
                .set('Authorization', validAuthHeader)
                .send({ unknown_field: 'hacking' });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(accountController.patchUser).not.toHaveBeenCalled();
        });

        it('sanitizes XSS attempts in the patch body', async () => {
            // noinspection HtmlDeprecatedAttribute
            const response = await request(app)
                .patch('/api/v1/account')
                .set('Authorization', validAuthHeader)
                .send({
                    username: 'Ash_<img src=x onerror=alert(1) alt="whatever">',
                });

            expect(response.status).toBe(StatusCodes.OK);

            const mockedPatch = vi.mocked(accountController.patchUser);
            const receivedData = mockedPatch.mock.calls[0][0].body;

            expect(receivedData.username).not.toContain('<img');
        });
    });

    // ========================================================================
    // ROUTE: DELETE /
    // ========================================================================
    describe('DELETE /', () => {
        it('returns `200` and calls `deleteUser` controller', async () => {
            const response = await request(app)
                .delete('/api/v1/account')
                .set('Authorization', validAuthHeader);

            expect(response.status).toBe(StatusCodes.OK);
            expect(accountController.deleteUser).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // SECURITY MIDDLEWARE
    // ========================================================================
    describe('Security Middleware', () => {
        it('applies security headers to account routes', async () => {
            const response = await request(app)
                .get('/api/v1/account')
                .set('Authorization', validAuthHeader); // Ensure request goes through

            expect(response.headers).toHaveProperty(
                'x-content-type-options',
                'nosniff',
            );
            expect(response.headers).not.toHaveProperty('x-powered-by');
        });
    });
});
