import bcrypt from 'bcryptjs';

const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12; // Number of salt rounds to strengthen the hash
    return bcrypt.hash(password, saltRounds); // Hash the password with the specified salt rounds
};

export default hashPassword;
