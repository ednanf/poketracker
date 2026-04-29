import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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

        // Create the User.
        // If email exists, Mongoose throws an 11000 error, which our ErrorHandler catches automatically.
        const user = await User.create({
            email,
            username,
            passwordHash: password,
        });

        // Generate accessToken.
        const accessToken = generateAccessToken(user._id);

        // Generate refreshToken.
        const refreshTokenString = generateRefreshToken(user._id);

        // Set refreshToken duration (value used for db field).
        const sevenDays = 1000 * 60 * 60 * 24 * 7;

        // Save Refresh Token to MongoDB (Allows revoking if needed).
        await RefreshToken.create({
            token: refreshTokenString,
            userId: user._id,
            expiresAt: new Date(Date.now() + sevenDays),
        });

        // Attach the Refresh Token to the httpOnly Cookie.
        attachCookiesToResponse(res, refreshTokenString);

        // Send the Access Token and User Data to the frontend.
        res.status(StatusCodes.CREATED).json({
            status: 'success',
            data: {
                message: 'User successfully registered.',
                accessToken, // Frontend should catch this and put it in Zustand memory.
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

        // Verify User Exists
        const user = await User.findOne({ email }).select('+passwordHash'); // Append `.select('+passwordHash')` to this query so it can be read
        if (!user) {
            next(new UnauthenticatedError('Invalid email or password.'));
            return;
        }

        // Verify Password matches the hash in MongoDB
        const isPasswordCorrect = await user.comparePassword(
            password,
            user.passwordHash,
        );
        if (!isPasswordCorrect) {
            next(new UnauthenticatedError('Invalid email or password.'));
            return;
        }

        // Generate Dual Tokens
        const accessToken = generateAccessToken(user._id);
        const refreshTokenString = generateRefreshToken(user._id);

        // Set refreshToken duration (value used for db field).
        const sevenDays = 1000 * 60 * 60 * 24 * 7;

        // Save Refresh Token to MongoDB
        // By creating a new token document here instead of updating an old one,
        // we allow the user to be logged in on multiple devices simultaneously
        await RefreshToken.create({
            token: refreshTokenString,
            userId: user._id,
            expiresAt: new Date(Date.now() + sevenDays),
        });

        // Send the refresh token via the `Set-Cookie` header.
        attachCookiesToResponse(res, refreshTokenString);

        // Send the Access Token and User Data
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

const refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // The frontend can't `see` this token, but the browser sends it
        // automatically in the request headers.
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return next(new UnauthenticatedError('Authentication invalid.'));
        }

        // Verify the token using the secret
        const payload = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET as string,
        ) as { userId: string }; // extract the userId (_id) from the token

        // Check MongoDB to ensure the token wasn't revoked or logged out
        const existingToken = await RefreshToken.findOne({
            token: refreshToken,
            userId: payload.userId,
        });
        if (!existingToken) {
            return next(new UnauthenticatedError('Authentication invalid.'));
        }

        // Mint a new `Access Token`
        const accessToken = generateAccessToken(payload.userId);

        // Send the new `Access Token` to the frontend
        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'Token successfully refreshed.',
                accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.cookies;

        if (refreshToken) {
            // Delete the token from MongoDB to completely invalidate it
            await RefreshToken.deleteOne({ token: refreshToken });
        }

        // Clear the cookie from the user's browser
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                message: 'User successfully logged out.',
            },
        });
    } catch (error) {
        next(error);
    }
};

export { registerUser, loginUser, logoutUser, refreshToken };
