import mongoose, { Types, HydratedDocument, Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
    _id: Types.ObjectId;
    email: string;
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
        const salt = await bcrypt.genSalt(12);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
});

UserSchema.methods.comparePassword = async function compareUserPassword(
    candidatePassword: string,
): Promise<boolean> {
    // Note: Because we use 'select: false', this.passwordHash will be undefined
    // unless we explicitly '.select("+passwordHash")' in the controller query.
    if (!this.passwordHash)
        throw new Error('Password hash not selected in query');
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.models.User || model<IUserDocument>('User', UserSchema);

export default User;
