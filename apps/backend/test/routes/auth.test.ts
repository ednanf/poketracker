import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

import { createTestApp } from '../helpers/createTestApp.js';

import authRouter from '../../src/routes/auth.route.js';
import * as authController from '../../src/controllers/auth.controller.js';

// Mock the controller module
vi.mock('../../src/controllers/auth.controller.js', () => ({
    registerUser: vi.fn((req, res) => res.status(201).json({ message: 'hit' })),
    loginUser: vi.fn((req, res) => res.status(200).json({ message: 'hit' })),
    refreshToken: vi.fn((req, res) => res.status(200).json({ message: 'hit' })),
    logoutUser: vi.fn((req, res) => res.status(200).json({ message: 'hit' })),
}));

describe('Auth Routes', () => {
    const app = createTestApp('/api/v1/auth', authRouter);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // HAPPY PATH TESTS
    // ==========================================

    it('returns 201 and calls register controller', async () => {
        const response = await request(app).post('/api/v1/auth/register').send({
            email: 'ash.ketchum@pallet.com',
            username: 'ash_ketchum',
            password: 'password123',
        });

        expect(response.status).toBe(201);
        expect(authController.registerUser).toHaveBeenCalled();
    });

    it('returns 200 and calls login controller', async () => {
        const response = await request(app).post('/api/v1/auth/login').send({
            email: 'ash@pallet.com',
            password: 'any-password',
        });

        expect(response.status).toBe(200);
        expect(authController.loginUser).toHaveBeenCalled();
    });

    it('returns 200 and calls refresh token controller', async () => {
        const response = await request(app).post('/api/v1/auth/refresh-token');
        expect(response.status).toBe(200);
        expect(authController.refreshToken).toHaveBeenCalled();
    });

    it('returns 200 and calls logout controller', async () => {
        const response = await request(app).post('/api/v1/auth/logout');
        expect(response.status).toBe(200);
        expect(authController.logoutUser).toHaveBeenCalled();
    });

    it('includes security headers from helmet in the response', async () => {
        const response = await request(app).post('/api/v1/auth/login');

        // Prevents browsers from trying to guess the MIME type
        expect(response.headers).toHaveProperty(
            'x-content-type-options',
            'nosniff',
        );

        // Prevents the website from being put in an iframe (Clickjacking protection)
        expect(response.headers).toHaveProperty(
            'x-frame-options',
            'SAMEORIGIN',
        );

        // Tells the browser which sources are trusted (CSP)
        expect(response.headers).toHaveProperty('content-security-policy');

        // Hides the "X-Powered-By: Express" header so attackers don't know your stack
        expect(response.headers).not.toHaveProperty('x-powered-by');
    });

    it('sanitizes XSS attempts in the request body', async () => {
        // Add all required fields so Zod lets the request through
        const maliciousData = {
            email: 'valid@email.com',
            password: 'password123',
            username: "<script>alert('xss')</script>Pikachu",
        };

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send(maliciousData);

        // Check status first to make sure we didn't get a 400
        expect(response.status).toBe(201);

        // Now the controller HAS been called, the data can be checked
        const receivedData = vi.mocked(authController.registerUser).mock
            .calls[0][0].body;

        expect(receivedData.username).not.toContain('<script>');
    });

    // ==========================================
    // UNHAPPY PATH TESTS
    // ==========================================

    // REGISTER
    it('returns 400 when registering with invalid email', async () => {
        const response = await request(app).post('/api/v1/auth/register').send({
            email: 'not-an-email',
            username: 'ash',
            password: 'password123',
        });

        expect(response.status).toBe(400);

        expect(authController.registerUser).not.toHaveBeenCalled();
    });

    it('returns 400 when registering with a short password', async () => {
        const response = await request(app).post('/api/v1/auth/register').send({
            email: 'ash@pallet.com',
            username: 'ash',
            password: '123',
        });

        expect(response.status).toBe(400);

        expect(authController.registerUser).not.toHaveBeenCalled();
    });

    it('returns 400 when registering with invalid fields', async () => {
        const response = await request(app).post('/api/v1/auth/register').send({
            email: 'ash@pallet.com',
            username: 'ash_ketchum',
            password: 'password123',
            admin: true, // This will trigger a strict() violation
        });

        expect(response.status).toBe(400);

        expect(authController.registerUser).not.toHaveBeenCalled();
    });

    // LOGIN
    it('returns 400 when logging in with invalid email', async () => {
        const response = await request(app).post('/api/v1/auth/login').send({
            email: 'not-an-email',
            username: 'ash',
            password: 'password123',
        });

        expect(response.status).toBe(400);

        expect(authController.loginUser).not.toHaveBeenCalled();
    });

    it('returns 400 when logging in with a short password', async () => {
        const response = await request(app).post('/api/v1/auth/login').send({
            email: 'ash@pallet.com',
            username: 'ash',
            password: '123',
        });

        expect(response.status).toBe(400);

        expect(authController.loginUser).not.toHaveBeenCalled();
    });

    it('returns 400 when logging in with invalid fields', async () => {
        const response = await request(app).post('/api/v1/auth/login').send({
            email: 'ash@pallet.com',
            username: 'ash',
            password: '123',
            admin: true, // This will trigger a strict() violation
        });

        expect(response.status).toBe(400);

        expect(authController.loginUser).not.toHaveBeenCalled();
    });
});
