import argon2 from 'argon2';

/**
 * Hashes a plain-text password using Argon2id.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password);
};

/**
 * Verifies a plain-text password against a stored Argon2 hash.
 */
export const verifyPassword = async (
  hash: string,
  plainTextPassword: string,
): Promise<boolean> => {
  return await argon2.verify(hash, plainTextPassword);
};
