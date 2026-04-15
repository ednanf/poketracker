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
// ACCOUNT DOMAIN
// ==========================================

export const UpdateAccountSchema = z.object({
    body: z.object({
        email: z.string()
                .email('Invalid email address format.')
                .optional(),
        password: z.string()
                   .min(6, 'Password must be at least 6 characters.')
                   .optional(),
    })
           .strict()
        // Refine ensures that they actually sent at least one thing to update
           .refine((data) => Object.keys(data).length > 0, {
               message: 'At least one field (email or password) must be provided to update.',
           }),
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

// Validates routes that ONLY take an ID parameter (GET /:id, DELETE /:id)
export const SaveFileIdSchema = z.object({
    params: z.object({
        id: z.string()
             .length(24, 'Invalid Save File ID format.'),
    }),
});

// Validates standard updates (e.g., changing the name of the save file)
export const UpdateSaveFileSchema = z.object({
    params: z.object({
        id: z.string()
             .length(24, 'Invalid Save File ID format.'),
    }),
    body: z.object({
        name: z.string()
               .min(1, 'Save file name is required.')
               .max(50, 'Save file name cannot exceed 50 characters.')
               .optional(), // .optional() because PATCH requests should allow partial updates
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
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>['body'];
export type CreateSaveFileInput = z.infer<typeof CreateSaveFileSchema>['body'];
export type SaveFileIdInput = z.infer<typeof SaveFileIdSchema>['params'];
export type UpdateSaveFileInput = z.infer<typeof UpdateSaveFileSchema>['body'];
export type SyncPayloadInput = z.infer<typeof SyncPayloadSchema>['body'];
export type SyncActionInput = z.infer<typeof SyncActionSchema>;