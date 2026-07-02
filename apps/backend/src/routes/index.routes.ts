/*
 * Barrel file containing all routes
 * */

import { Router } from 'express';
import userRoutes from './user.routes.js';
import saveFileRoutes from './saveFile.routes.js';

const apiRouter = Router();

// NOTE: lifeCycle endpoints are not implemented in version 1.0
apiRouter.use('/', userRoutes);
apiRouter.use('/', saveFileRoutes);

export default apiRouter;
