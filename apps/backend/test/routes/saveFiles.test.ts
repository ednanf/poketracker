import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';

import { createTestAppHelper } from '../helpers/createTestApp.helper.js';
import saveFilesRouter from '../../src/routes/saveFiles.route.js';
import * as saveFilesController from '../../src/controllers/saveFiles.controller.js';

// Reusable valid 24-character MongoDB ObjectId for URL params
const VALID_ID = '507f1f77bcf86cd799439011';

// Mock the controller module
vi.mock('../../src/controllers/saveFiles.controller.js', () => ({
    getAllSaveFiles: vi.fn((_req, res) =>
        res.status(StatusCodes.OK).json({ message: 'hit' }),
    ),
    getSaveFileById: vi.fn((_req, res) =>
        res.status(StatusCodes.OK).json({ message: 'hit' }),
    ),
    createSaveFile: vi.fn((_req, res) =>
        res.status(StatusCodes.CREATED).json({ message: 'hit' }),
    ),
    updateSaveFile: vi.fn((_req, res) =>
        res.status(StatusCodes.OK).json({ message: 'hit' }),
    ),
    deleteSaveFile: vi.fn((_req, res) =>
        res.status(StatusCodes.OK).json({ message: 'hit' }),
    ),
    syncSaveFile: vi.fn((_req, res) =>
        res.status(StatusCodes.OK).json({ message: 'hit' }),
    ),
}));

describe('Save Files Routes', () => {
    const app = createTestAppHelper('/api/v1/save-file', saveFilesRouter);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /', () => {
        it('returns `200` and calls `getAllSaveFiles` controller', async () => {
            const response = await request(app).get('/api/v1/save-file');

            expect(response.status).toBe(StatusCodes.OK);
            expect(saveFilesController.getAllSaveFiles).toHaveBeenCalled();
        });
    });

    describe('POST /', () => {
        it('returns `201` and calls `createSaveFile` controller with valid data', async () => {
            const response = await request(app).post('/api/v1/save-file').send({
                name: 'My Pokemon Red Save',
                type: 'NATIONAL',
                gameVersion: 'Red',
            });

            expect(response.status).toBe(StatusCodes.CREATED);
            expect(saveFilesController.createSaveFile).toHaveBeenCalled();
        });

        it('returns `400` when creating with invalid enum type', async () => {
            const response = await request(app).post('/api/v1/save-file').send({
                name: 'Bad Save',
                type: 'INVALID_TYPE', // Will trigger Zod enum error
                gameVersion: 'Red',
            });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(saveFilesController.createSaveFile).not.toHaveBeenCalled();
        });

        it('sanitizes XSS attempts in the save file name', async () => {
            // noinspection HtmlDeprecatedAttribute
            const response = await request(app).post('/api/v1/save-file').send({
                name: 'Save_<img src=x onerror=alert(1) alt="whatever">', // Padded to survive .min(1)
                type: 'REGIONAL',
                gameVersion: 'Blue',
            });

            expect(response.status).toBe(StatusCodes.CREATED);

            const mockedCreate = vi.mocked(saveFilesController.createSaveFile);
            const receivedData = mockedCreate.mock.calls[0][0].body;
            expect(receivedData.name).not.toContain('<img');
        });
    });

    describe('GET /:id', () => {
        it('returns `200` with a valid 24-character ID', async () => {
            const response = await request(app).get(
                `/api/v1/save-file/${VALID_ID}`,
            );

            expect(response.status).toBe(StatusCodes.OK);
            expect(saveFilesController.getSaveFileById).toHaveBeenCalled();
        });

        it('returns `400` when ID format is invalid (length !== 24)', async () => {
            const response = await request(app).get('/api/v1/save-file/123');

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(saveFilesController.getSaveFileById).not.toHaveBeenCalled();
        });
    });

    describe('PATCH /:id', () => {
        it('returns `200` and updates with valid data', async () => {
            const response = await request(app)
                .patch(`/api/v1/save-file/${VALID_ID}`)
                .send({ name: 'Renamed Save File' });

            expect(response.status).toBe(StatusCodes.OK);
            expect(saveFilesController.updateSaveFile).toHaveBeenCalled();
        });

        it('returns `400` with unexpected fields (strict violation)', async () => {
            const response = await request(app)
                .patch(`/api/v1/save-file/${VALID_ID}`)
                .send({
                    name: 'Renamed Save File',
                    hackedField: true, // Not allowed by schema
                });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });

    describe('DELETE /:id', () => {
        it('returns `200` and calls deleteSaveFile controller', async () => {
            const response = await request(app).delete(
                `/api/v1/save-file/${VALID_ID}`,
            );

            expect(response.status).toBe(StatusCodes.OK);
            expect(saveFilesController.deleteSaveFile).toHaveBeenCalled();
        });
    });

    describe('PATCH /:id/sync', () => {
        it('returns `200` and calls syncSaveFile with valid payload', async () => {
            const response = await request(app)
                .patch(`/api/v1/save-file/${VALID_ID}/sync`)
                .send({
                    actions: [
                        { action: 'ADD', pokemonId: '001-base' },
                        { action: 'REMOVE', pokemonId: '025-base' },
                    ],
                });

            expect(response.status).toBe(StatusCodes.OK);
            expect(saveFilesController.syncSaveFile).toHaveBeenCalled();
        });

        it('returns `400` when pokemonId regex fails', async () => {
            const response = await request(app)
                .patch(`/api/v1/save-file/${VALID_ID}/sync`)
                .send({
                    actions: [{ action: 'ADD', pokemonId: 'pikachu' }], // Missing the "025-base" format
                });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
            expect(saveFilesController.syncSaveFile).not.toHaveBeenCalled();
        });

        it('returns `400` when action enum is invalid', async () => {
            const response = await request(app)
                .patch(`/api/v1/save-file/${VALID_ID}/sync`)
                .send({
                    actions: [{ action: 'CATCH', pokemonId: '001-base' }], // Must be ADD or REMOVE
                });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('returns `400` when array length is 0 (min 1 required)', async () => {
            const response = await request(app)
                .patch(`/api/v1/save-file/${VALID_ID}/sync`)
                .send({ actions: [] });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });

    describe('Security Middleware', () => {
        it('applies security headers to save file routes', async () => {
            const response = await request(app).get('/api/v1/save-file');

            expect(response.headers).toHaveProperty(
                'x-content-type-options',
                'nosniff',
            );
            expect(response.headers).not.toHaveProperty('x-powered-by');
        });
    });
});
