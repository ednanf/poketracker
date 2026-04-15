import { z } from 'zod';

// ==========================================
// AUTHENTICATION DOMAIN
// ==========================================

export const RegisterSchema = z.object({
    body: z.object({
        email: z.string()
                .email('Invalid email address format.'),
        username: z.string()
                   .min(3, 'Username must be at least 3 characters.')
                   .max(30, 'Username cannot exceed 30 characters.'),
        // Zod handles the validation, so Mongoose never sees a short password.
        password: z.string()
                   .min(6, 'Password must be at least 6 characters.'),
    })
           .strict(), // Rejects any payload containing fields not explicitly defined here
});

export const LoginSchema = z.object({
    body: z.object({
        email: z.string()
                .email('Invalid email address format.'),
        // Do not enforce min length on login to prevent timing/guessing attacks.
        // Just ensure it's not empty.
        password: z.string()
                   .min(1, 'Password is required.'),
    })
           .strict(),
});

// ==========================================
// SAVE FILE DOMAIN
// ==========================================

export const CreateSaveFileSchema = z.object({
    body: z.object({
        name: z.string()
               .min(1, 'Save file name is required.')
               .max(50, 'Save file name cannot exceed 50 characters.'),
        type: z.enum(['NATIONAL', 'REGIONAL']),
        gameVersion: z.string()
                      .min(1, 'Game version is required.'),
    })
           .strict(),
});

const SyncActionSchema = z.object({
    action: z.enum(['ADD', 'REMOVE']),
    pokemonId: z.string()
                .regex(
                    /^\d{3,4}-[a-z]+$/,
                    'Invalid composite ID format. Expected format: "001-base"',
                ),
});

export const SyncPayloadSchema = z.object({
    // Expect the ID in the URL params, and the actions in the body
    params: z.object({
        id: z.string()
             .length(24, 'Invalid Save File ID.'), // MongoDB ObjectId length
    }),
    body: z.object({
        // Rate-limiting the mutation payload to prevent memory exhaustion attacks
        actions: z.array(SyncActionSchema)
                  .min(1, 'At least one action is required.')
                  .max(100, 'Cannot process more than 100 actions per sync payload.'),
    })
           .strict(),
});

// ==========================================
// EXPORTED TYPES
// ==========================================
// Infer TypeScript interfaces directly from the schemas.

export type RegisterInput = z.infer<typeof RegisterSchema>['body'];
export type LoginInput = z.infer<typeof LoginSchema>['body'];
export type CreateSaveFileInput = z.infer<typeof CreateSaveFileSchema>['body'];
export type SyncPayloadInput = z.infer<typeof SyncPayloadSchema>['body'];
export type SyncActionInput = z.infer<typeof SyncActionSchema>;