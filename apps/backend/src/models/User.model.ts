import mongoose, { Model, model, Schema, Types } from 'mongoose';

import hashPassword from '../utils/hashPassword.js';
import comparePasswords from '../utils/comparePasswords.js';

/*
 * verified, verificationToken, verificationExpires, passwordReset,
 * passwordRestExpires are added for future proofing. They are not
 * implemented as of version 1.0.
 *
 * Comments were added for clarity as well.
 * */

// Core data interface (Pure properties)
export interface IUser {
    _id: Types.ObjectId;
    email: string;
    username: string;
    passwordHash: string;
    verified: boolean;
    verificationToken?: string;
    verificationTokenExpires?: string;
    passwordResetToken?: string;
    passwordResetExpires?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the instance method signatures explicitly
export interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// Create a combined Model type mapping the data and mongoose methods
export type UserModel = Model<IUser, object, IUserMethods>;

// Pass the types into the Schema generic in order: Data, Model, Methods
const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minlength: [5, 'Email must be at least 5 characters'],
            match: [
                /^\w+([.-]\w+)*@\w+([.-]\w+)*(\.\w{2,3})+$/,
                'Please enter a valid email address',
            ],
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minLength: [3, 'Username must be at least 3 characters'],
            maxLength: [10, 'Username must be at least 10 characters'],
        },
        passwordHash: {
            type: String,
            required: true,
            trim: true,
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        verified: {
            type: Boolean,
            required: true,
            default: false,
        },
        verificationToken: {
            type: String,
            required: false,
        },
        verificationTokenExpires: {
            type: Date,
            required: false,
        },
        passwordResetToken: {
            type: String,
            required: false,
        },
        passwordResetExpires: {
            type: Date,
            required: false,
        },
    },
    { timestamps: true },
);

// Mongoose correctly types `this` based on the Schema definition
UserSchema.pre('save', async function hashPasswordBeforeSave() {
    if (this.isModified('passwordHash')) {
        this.passwordHash = await hashPassword(this.passwordHash);
    }
});

// `this` will safely expose both IUser and IUserMethods properties here
UserSchema.methods.comparePassword = async function compareUserPassword(
    candidatePassword: string,
) {
    if (!this.passwordHash)
        throw new Error('Password hash not selected in query');

    return comparePasswords(candidatePassword, this.passwordHash);
};

// Initialize the model using the strict UserModel type mapping
const User =
    (mongoose.models.User as UserModel) ||
    model<IUser, UserModel>('User', UserSchema);

export default User;
