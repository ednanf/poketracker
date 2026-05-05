import mongoose, { Types, HydratedDocument, Schema, model } from 'mongoose';

// Represents how the data is stored in MongoDB.
export interface ISaveFile {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    name: string;
    type: 'NATIONAL' | 'REGIONAL';
    gameVersion: string;
    caughtIds: string[];
    documentVersion: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ISaveFileDocument
    extends ISaveFile, HydratedDocument<ISaveFile> {
    // Utility method for future features (e.g., "Reset Save File" functionality).
    clearDex(): void;
}

const SaveFileSchema = new Schema<ISaveFileDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, 'Save file name cannot exceed 50 characters'],
        },
        type: {
            type: String,
            enum: ['NATIONAL', 'REGIONAL'],
            required: true,
        },
        gameVersion: {
            type: String,
            required: true,
            trim: true,
        },
        caughtIds: [
            {
                type: String,
                match: [
                    /^\d{3,4}-[a-z]+$/,
                    'Invalid composite ID format (Expected format: "001-base")',
                ],
            },
        ],
        documentVersion: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true },
);

// Optimize queries like "Find my Violet save file."
SaveFileSchema.index({ userId: 1, gameVersion: 1 });

// Verify ownership and find the document.
SaveFileSchema.index({ _id: 1, userId: 1 });

// Instance method to wipe the sparse array without deleting the metadata.
SaveFileSchema.methods.clearDex = function wipeSaveFile(): void {
    this.caughtIds = [];
    this.documentVersion += 1;
};

const SaveFile =
    mongoose.models.SaveFile ||
    model<ISaveFileDocument>('SaveFile', SaveFileSchema);

export default SaveFile;
