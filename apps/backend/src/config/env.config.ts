/*
 * Verify environment variables integrity using Zod.
 * */

import { z, ZodError } from 'zod';

// Reuse the schema to shape the type
type EnvConfig = z.infer<typeof envSchema>;

// Possible results of parsing - could be implied, but this adds clarity
export type ParseResult<T> =
    { success: true; data: T } | { success: false; error: ZodError };

// Zod schema with all .env properties
const envSchema = z.object({
    NODE_VERSION: z.string().optional(),

    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),

    PORT: z
        .string()
        .default('9000')
        .transform((val) => parseInt(val, 10)),

    MONGODB_URI: z.string().default('EMPTY_URI'),

    MONGODB_LOCAL_URI: z.url().default('mongodb://localhost:27017/poketracker'),

    JWT_SECRET: z
        .string()
        .min(64, { message: '**[error]** JWT_SECRET is missing or too short' }),

    JWT_LIFETIME: z.string().default('30d'),
});

// Parse proccess.env values against envSchema
const result: ParseResult<EnvConfig> = envSchema.safeParse(process.env);

if (!result.success) {
    console.error('**[error]** environment validation failed');

    // Map errors to be displayed as a table
    const errorReport = result.error.issues.map((issue) => ({
        variable: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
    }));

    // Display the errors as a table
    console.table(errorReport);

    throw new Error('**[error]** check .env file for missing or invalid keys');
}

const envConfig: EnvConfig = result.data;

// Export validated configuration
export default envConfig;
