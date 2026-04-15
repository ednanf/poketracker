module.exports = {
    root: true,
    env: {
        node: true,
        es2022: true,
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    ignorePatterns: ['node_modules/', 'dist/', 'build/'],
    rules: {
        // Add any global rules here (e.g., 'no-console': 'warn')
        '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
    },
};