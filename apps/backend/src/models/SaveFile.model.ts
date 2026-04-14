import mongoose, { Schema, Document } from 'mongoose';

export interface ISaveFile extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    type: 'NATIONAL' | 'REGIONAL';
    gameVersion: string;
    caughtIds: string[]; // Stores our composite IDs: "001-base"
    documentVersion: number;
}

const SaveFileSchema = new Schema<ISaveFile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true, // We will frequently query "Get all saves for User X"
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        type: {
            type: String,
            enum: ['NATIONAL', 'REGIONAL'],
            required: true,
        },
        gameVersion: {
            type: String,
            required: true,
        },
        // The Sparse Array
        caughtIds: [
            {
                type: String,
                // Mongoose regex validation as a secondary defense layer behind Zod
                match: [/^\d{3,4}-[a-z]+$/, 'Invalid composite ID format'],
            },
        ],
        documentVersion: {
            type: Number,
            default: 1,
        },
    },
    {
        timestamps: true,
    },
);

export const SaveFileModel = mongoose.model<ISaveFile>(
    'SaveFileModel',
    SaveFileSchema,
);
