// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    // 1. GLOBAL IGNORES: This must be its own object at the top.
    // This tells ESLint to never cross into compiled folders across the entire monorepo.
    {
        ignores: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    },

    // 2. BASE CONFIGURATIONS
    eslint.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,

    // 3. PROJECT-SPECIFIC RULES
    {
        // This ensures the linter traverses into your workspaces
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.mjs'],
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
        },
        languageOptions: {
            parserOptions: {
                // this prevents TS own no-unused checks from surfacing in ESLint
                projectService: false,
            },
        },
    },
);
