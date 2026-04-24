import mongoose, { Types, HydratedDocument, Schema, model } from 'mongoose';
import hashPassword from '../utils/hashPassword.util.js';
import comparePasswords from '../utils/comparePasswords.util.js';

export interface IUser {
    _id: Types.ObjectId;
    email: string;
    username: string;
    passwordHash: string;
    verified: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserDocument extends IUser, HydratedDocument<IUser> {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minlength: [5, 'Email must be at least 5 characters long.'],
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters long.'],
            maxlength: [30, 'Username cannot exceed 30 characters.'],
        },
        passwordHash: {
            type: String,
            required: true,
            trim: true,
            minlength: [6, 'Password must be at least 6 characters long'],
            select: false,
        },
        verified: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true },
);

// Hash password only if it was modified (Modern Async Pattern)
UserSchema.pre('save', async function hashPasswordBeforeSave() {
    if (this.isModified('passwordHash')) {
        this.passwordHash = await hashPassword(this.passwordHash);
    }
});

UserSchema.methods.comparePassword = async function compareUserPassword(
    candidatePassword: string,
): Promise<boolean> {
    // Note: Because 'select: false', this.passwordHash will be undefined
    // unless we explicitly '.select("+passwordHash")' in the controller query.
    if (!this.passwordHash)
        throw new Error('Password hash not selected in query');
    return comparePasswords(candidatePassword, this.passwordHash);
};

const User = mongoose.models.User || model<IUserDocument>('User', UserSchema);

export default User;
