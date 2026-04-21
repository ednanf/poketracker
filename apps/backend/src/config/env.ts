import { z } from 'zod';

/**
 * Zod schema matching the .env structure.
 */
const envSchema = z.object({
    NODE_VERSION: z.string().optional(),
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),

    PORT: z
        .string()
        .default('9000')
        .transform((val) => parseInt(val, 10)),

    MONGODB_URI: z.string().default('EMPTY'),

    MONGODB_LOCAL_URI: z
        .string()
        .url()
        .default('mongodb://localhost:27017/poketracker'),

    JWT_ACCESS_SECRET: z
        .string()
        .min(32, { message: 'JWT_ACCESS_SECRET is missing or too short' }),

    JWT_REFRESH_SECRET: z
        .string()
        .min(32, { message: 'JWT_REFRESH_SECRET is missing or too short' }),

    JWT_LIFETIME: z.string().default('30d'),
});

/**
 * Validate the process.env.
 */
const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error('**[system]** ❌ Environment validation failed:');

    const errorReport = result.error.issues.map((issue) => ({
        variable: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
    }));

    console.table(errorReport);

    throw new Error(
        '[system] Check your .env file for missing or invalid keys.',
    );
}

/**
 * Exported validated configuration.
 */
export const env = result.data;
