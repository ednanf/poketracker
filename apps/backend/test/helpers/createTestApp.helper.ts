import express, { Router } from 'express';
import helmet from 'helmet';
import { xss } from 'express-xss-sanitizer';
import rateLimit from 'express-rate-limit';

export const createTestAppHelper = (path: string, router: Router) => {
    const app = express();

    // 1. Global Parsers
    app.use(express.json());

    // 2. Security Middleware (Matches your production setup)
    app.use(helmet());
    app.use(xss());

    // 3. Rate Limiting (Heads up: we usually tweak this for tests)
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100, // Keep this high so tests don't fail during 'watch' mode
        standardHeaders: 'draft-7',
        legacyHeaders: false,
    });
    app.use(limiter);

    // 4. The Router under test
    app.use(path, router);

    return app;
};
