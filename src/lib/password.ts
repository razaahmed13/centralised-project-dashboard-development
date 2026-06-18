import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyAdminPassword(password: string, hash: string | undefined): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}
