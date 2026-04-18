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

    it('POST /register hits register controller', async () => {
        const response = await request(app).post('/api/v1/auth/register').send({
            email: 'ash.ketchum@pallet.com',
            username: 'ash_ketchum',
            password: 'password123',
        });

        expect(response.status).toBe(201);
        expect(authController.registerUser).toHaveBeenCalled();
    });

    it('POST /login hits login controller', async () => {
        const response = await request(app).post('/api/v1/auth/login').send({
            email: 'ash@pallet.com',
            password: 'any-password',
        });

        expect(response.status).toBe(200);
        expect(authController.loginUser).toHaveBeenCalled();
    });

    it('POST /refresh-token hits refresh controller', async () => {
        const response = await request(app).post('/api/v1/auth/refresh-token');
        expect(response.status).toBe(200);
        expect(authController.refreshToken).toHaveBeenCalled();
    });

    it('POST /logout hits logout controller', async () => {
        const response = await request(app).post('/api/v1/auth/logout');
        expect(response.status).toBe(200);
        expect(authController.logoutUser).toHaveBeenCalled();
    });

    // ==========================================
    // UNHAPPY PATH TESTS
    // ==========================================

    it('POST /register - FAIL (400) with invalid email', async () => {
        const response = await request(app).post('/api/v1/auth/register').send({
            email: 'not-an-email',
            username: 'ash',
            password: 'password123',
        });

        expect(response.status).toBe(400);

        // The controller should NEVER be called
        expect(authController.registerUser).not.toHaveBeenCalled();
    });

    it('POST /register - FAIL (400) due to .strict() (extra fields)', async () => {
        const response = await request(app).post('/api/v1/auth/register').send({
            email: 'ash@pallet.com',
            username: 'ash_ketchum',
            password: 'password123',
            admin: true, // This will trigger a strict() violation
        });

        expect(response.status).toBe(400);
    });
});
