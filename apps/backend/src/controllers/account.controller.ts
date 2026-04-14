// WhoAmI, patchUser, deleteUser

import { Request, Response, NextFunction } from 'express';

const whoAmI = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: GET api/v1/user');
    res.status(200).json({ message: 'Stub: whoami' });
};

const patchUser = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: PATCH api/v1/user');
    res.status(200).json({ message: 'Stub: patchUser' });
};

const deleteUser = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: DELETE api/v1/user');
    res.status(200).json({ message: 'Stub: deleteUser' });
};

export { whoAmI, patchUser, deleteUser };
