import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import {
    ApiResponse,
    AuthSuccessPayload,
    LoginInput,
} from '@poketracker/shared';
import { RegisterInput } from '@poketracker/shared';
import {
    attachCookiesToResponse,
    generateAccessToken,
    generateRefreshToken,
} from '../utils/jwt.util.js';
import { UnauthenticatedError } from '../errors/index.js';

const registerUser = async (
    req: Request<unknown, unknown, RegisterInput>,
    res: Response<ApiResponse<AuthSuccessPayload>>,
    next: NextFunction,
) => {
    try {
        const { email, username, password } = req.body;

        // 1. Create the User
        // If email exists, Mongoose throws an 11000 error, which our ErrorHandler catches automatically.
        const user = await User.create({
            email,
            username,
            passwordHash: password,
        });

        // 2. Generate Dual Tokens
        const accessToken = generateAccessToken(user._id);
        const refreshTokenString = generateRefreshToken(user._id);

        // 3. Save Refresh Token to MongoDB (Allows revoking if needed)
        const sevenDays = 1000 * 60 * 60 * 24 * 7;
        await RefreshToken.create({
            token: refreshTokenString,
            userId: user._id,
            expiresAt: new Date(Date.now() + sevenDays),
        });

        // 4. Attach the Refresh Token to the httpOnly Cookie
        attachCookiesToResponse(res, refreshTokenString);

        // 5. Send the Access Token and User Data to the frontend
        res.status(StatusCodes.CREATED).json({
            status: 'success',
            data: {
                message: 'User successfully registered.',
                accessToken, // Frontend will catch this and put it in Zustand memory
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

const loginUser = async (
    req: Request<unknown, unknown, LoginInput>,
    res: Response<ApiResponse<AuthSuccessPayload>>,
    next: NextFunction,
) => {
    try {
        const { email, password } = req.body;

        // 1. Verify User Exists
        //  Append `.select('+passwordHash')` to this query so it can be read
        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user) {
            next(new UnauthenticatedError('Invalid email or password.'));
            return;
        }

        // 2. Verify Password matches the hash in MongoDB
        const isPasswordCorrect = await user.comparePassword(
            password,
            user.passwordHash,
        );

        if (!isPasswordCorrect) {
            next(new UnauthenticatedError('Invalid email or password.'));
            return;
        }

        // 3. Generate Dual Tokens
        const accessToken = generateAccessToken(user._id);
        const refreshTokenString = generateRefreshToken(user._id);

        // 4. Save Refresh Token to MongoDB
        // By creating a new token document here instead of updating an old one,
        // we allow the user to be logged in on multiple devices simultaneously
        // (e.g., phone and laptop).
        const sevenDays = 1000 * 60 * 60 * 24 * 7;
        await RefreshToken.create({
            token: refreshTokenString,
            userId: user._id,
            expiresAt: new Date(Date.now() + sevenDays),
        });

        // 5. Attach the Refresh Token to the httpOnly Cookie
        attachCookiesToResponse(res, refreshTokenString);

        // 6. Send the Access Token and User Data
        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'User successfully logged in.',
                accessToken,
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

const refreshToken = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: POST /api/v1/refresh-token');
    res.status(200).json({ message: 'Stub: refreshToken' });
};

const logoutUser = (req: Request, res: Response, _next: NextFunction) => {
    console.log('HIT: POST /api/v1/logout');
    res.status(200).json({ message: 'Stub: logoutUser' });
};

export { registerUser, loginUser, logoutUser, refreshToken };
