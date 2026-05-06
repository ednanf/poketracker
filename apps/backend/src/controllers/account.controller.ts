import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User.model.js';
import { UnauthenticatedError } from '../errors/index.js';
import type {
    ApiResponse,
    UpdateAccountInput,
    UserProfilePayload,
} from '@poketracker/shared';
import RefreshToken from '../models/RefreshToken.model.js';
import SaveFile from '../models/SaveFile.model.js';

const whoAmI = async (
    req: Request,
    res: Response<ApiResponse<UserProfilePayload>>,
    next: NextFunction,
) => {
    try {
        // `req.userId` is guaranteed to be here by requireAuth.
        const user = await User.findById(req.userId);

        // Edge Case: The token is valid, but the user was deleted from the database.
        if (!user) {
            next(new UnauthenticatedError('Authentication invalid.'));
            return;
        }

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'User profile retrieved successfully.',
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

const patchUser = async (
    req: Request<unknown, unknown, UpdateAccountInput>,
    res: Response,
    next: NextFunction,
) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            next(new UnauthenticatedError('User no longer exists.'));
            return;
        }

        const { email, username, password } = req.body;

        // Apply updates dynamically.
        if (email) user.email = email;
        if (username) user.username = username;
        if (password) {
            user.passwordHash = password; // Assign the raw password here.
        }

        // Using `.save()` forces Mongoose to run the pre-save hook and schema validations.
        await user.save();

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'Account updated successfully.',
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            next(new UnauthenticatedError('User no longer exists.'));
            return;
        }

        // Cascade Delete: Remove all associated data.
        await Promise.all([
            RefreshToken.deleteMany({ userId: user._id }),
            SaveFile.deleteMany({ userId: user._id }), // Clears their Pokedex saves
            user.deleteOne(), // Deletes the user document itself
        ]);

        // Clear the browser cookie.
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'Account and all associated data permanently deleted.',
            },
        });
    } catch (error) {
        next(error);
    }
};

export { whoAmI, patchUser, deleteUser };
