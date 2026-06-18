import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-admin-password -- <password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const escapedForNextEnv = hash.replaceAll('$', '\\$');

console.log('Add this line to .env.local:');
console.log(`ADMIN_PASSWORD_HASH=${escapedForNextEnv}`);
