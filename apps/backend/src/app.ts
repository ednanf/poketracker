import express from 'express';
import morgan from 'morgan';

import apiRouter from './routes/index.routes.js';

// Create express app
const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/v1', apiRouter);

// Errors
export default app;
