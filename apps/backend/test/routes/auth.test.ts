import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

import { createTestApp } from '../helpers/createTestApp.js';
import authRouter from '../../src/routes/auth.route.js';
import * as authController from '../../src/controllers/auth.controller.js';

// Mock the controller module
vi.mock('../../src/controllers/auth.controller.js', () => ({
    registerUser: vi.fn((_req, res) =>
        res.status(201).json({ message: 'hit' }),
    ),
    loginUser: vi.fn((_req, res) => res.status(200).json({ message: 'hit' })),
    refreshToken: vi.fn((_req, res) =>
        res.status(200).json({ message: 'hit' }),
    ),
    logoutUser: vi.fn((_req, res) => res.status(200).json({ message: 'hit' })),
}));

describe('Auth Routes', () => {
    const app = createTestApp('/api/v1/auth', authRouter);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /register', () => {
        it('returns 201 and calls register controller with valid data', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'ash.ketchum@pallet.com',
                    username: 'ash_ketchum',
                    password: 'password123',
                });

            expect(response.status).toBe(201);
            expect(authController.registerUser).toHaveBeenCalled();
        });

        it('returns 400 when registering with an invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'not-an-email',
                    username: 'ash',
                    password: 'password123',
                });

            expect(response.status).toBe(400);
            expect(authController.registerUser).not.toHaveBeenCalled();
        });

        it('returns 400 when registering with a short password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'ash@pallet.com',
                    username: 'ash',
                    password: '123',
                });

            expect(response.status).toBe(400);
            expect(authController.registerUser).not.toHaveBeenCalled();
        });

        it('returns 400 when registering with unexpected fields', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'ash@pallet.com',
                    username: 'ash_ketchum',
                    password: 'password123',
                    admin: true, // Will trigger strict() validation
                });

            expect(response.status).toBe(400);
        });

        it('sanitizes XSS attempts in the username while registering', async () => {
            const maliciousData = {
                email: 'valid@email.com',
                password: 'password123',
                username: "<script>alert('xss')</script>Pikachu",
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(maliciousData);

            expect(response.status).toBe(201);

            // Use vi.mocked for type safety instead of 'any'
            const mockedRegister = vi.mocked(authController.registerUser);
            const receivedData = mockedRegister.mock.calls[0][0].body;

            expect(receivedData.username).not.toContain('<script>');
        });
    });

    describe('POST /login', () => {
        it('returns 200 and calls login controller with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'ash@pallet.com',
                    password: 'any-password',
                });

            expect(response.status).toBe(200);
            expect(authController.loginUser).toHaveBeenCalled();
        });

        it('returns 400 when logging in with an invalid email address', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'not-an-email',
                    password: '123456',
                });

            expect(response.status).toBe(400);
            expect(authController.loginUser).not.toHaveBeenCalled();
        });

        it('returns 400 when logging in with a short password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'ash@pallet.com',
                    password: '',
                });

            expect(response.status).toBe(400);

            expect(authController.loginUser).not.toHaveBeenCalled();
        });

        it('returns 400 when logging in with unexpected fields', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'ash@pallet.com',
                    username: 'ash_ketchum',
                    password: 'password123',
                    admin: true, // Will trigger strict() validation
                });

            expect(response.status).toBe(400);
        });
    });

    describe('Token Management', () => {
        it('POST /refresh-token - returns 200 and calls refresh controller', async () => {
            const response = await request(app).post(
                '/api/v1/auth/refresh-token',
            );
            expect(response.status).toBe(200);
            expect(authController.refreshToken).toHaveBeenCalled();
        });

        it('POST /logout - returns 200 and calls logout controller', async () => {
            const response = await request(app).post('/api/v1/auth/logout');
            expect(response.status).toBe(200);
            expect(authController.logoutUser).toHaveBeenCalled();
        });
    });

    describe('Security Middleware', () => {
        it('includes essential security headers (Helmet)', async () => {
            const response = await request(app).post('/api/v1/auth/login');

            const headers = [
                ['x-content-type-options', 'nosniff'],
                ['x-frame-options', 'SAMEORIGIN'],
                ['content-security-policy', expect.any(String)],
            ];

            headers.forEach(([header, value]) => {
                expect(response.headers).toHaveProperty(header, value);
            });

            expect(response.headers).not.toHaveProperty('x-powered-by');
        });
    });
});
