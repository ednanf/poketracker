import mongoose, { Types, HydratedDocument, Schema, model } from 'mongoose';

export interface IRefreshToken {
    _id: Types.ObjectId;
    token: string;
    userId: Types.ObjectId;
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IRefreshTokenDocument
    extends IRefreshToken, HydratedDocument<IRefreshToken> {
    isExpired(): boolean;
}

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true },
);

// TTL Index: Instructs MongoDB to delete the document automatically when expiresAt is reached
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Synchronous check to handle the gap between expiration and MongoDB's background sweep
RefreshTokenSchema.methods.isExpired = function checkExpiration(): boolean {
    return Date.now() >= this.expiresAt.getTime();
};

const RefreshToken =
    mongoose.models.RefreshToken ||
    model<IRefreshTokenDocument>('RefreshToken', RefreshTokenSchema);

export default RefreshToken;
