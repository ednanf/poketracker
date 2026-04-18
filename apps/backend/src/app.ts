import express from 'express';
import morgan from 'morgan';

import authRoutes from './routes/auth.route.js';
import accountRoutes from './routes/account.route.js';
import saveFileRoutes from './routes/saveFiles.route.js';
import errorHandlerMiddleware from './middleware/errorHandler.middleware.js';
import notFoundMiddleware from './middleware/notFound.middleware.js';

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('tiny'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/save-file', saveFileRoutes);

// Errors
app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

export default app;
