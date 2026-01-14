import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash un mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Vérifie un mot de passe
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
