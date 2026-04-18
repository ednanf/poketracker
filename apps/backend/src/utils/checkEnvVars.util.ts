import { EnvVarsMissingError } from '../errors/index.js';

const checkEnvVarsUtil = (requiredVars: string[]): void => {
    const missingVars = requiredVars.filter((key) => !process.env[key]);
    if (missingVars.length) {
        throw new EnvVarsMissingError(
            `[system] missing environment variables: ${missingVars.join(', ')}`,
        );
    }
};

export default checkEnvVarsUtil;
