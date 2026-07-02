import bcrypt from 'bcryptjs';

const comparePasswords = async (
    candidatePassword: string,
    hashedPassword: string,
): Promise<boolean> => bcrypt.compare(candidatePassword, hashedPassword);

export default comparePasswords;
