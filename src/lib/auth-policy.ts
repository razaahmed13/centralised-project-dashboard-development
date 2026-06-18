export function getAllowedGoogleEmails(raw = process.env.ALLOWED_GOOGLE_EMAILS ?? 'hello@neodym.ai'): string[] {
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedGoogleEmail(email: string | null | undefined, rawAllowlist?: string): boolean {
  if (!email) return false;
  return getAllowedGoogleEmails(rawAllowlist).includes(email.trim().toLowerCase());
}
