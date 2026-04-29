import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { xss } from 'express-xss-sanitizer';
import morgan from 'morgan';
import cors from 'cors';

import authRouter from './routes/auth.route.js';
import accountRouter from './routes/account.route.js';
import saveFileRouter from './routes/saveFiles.route.js';
import errorHandlerMiddleware from './middleware/errorHandler.middleware.js';
import notFoundMiddleware from './middleware/notFound.middleware.js';
import rateLimitOptions from './config/rateLimit.config.js';
import corsOptions from './config/cors.config.js';

const app = express();

// Middleware
app.use(rateLimit(rateLimitOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(xss());
app.use(morgan('tiny'));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/account', accountRouter);
app.use('/api/v1/save-file', saveFileRouter);

// Errors
app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

export default app;
