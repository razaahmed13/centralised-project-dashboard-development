export type CredentialClipboardInput = {
  projectName: string;
  url: string;
  username?: string | null;
  password?: string | null;
  notes?: string | null;
};

export function formatCredentialsForClipboard(input: CredentialClipboardInput): string {
  const lines = [`Project: ${input.projectName}`, `URL: ${input.url}`];

  if (input.username?.trim()) lines.push(`Username: ${input.username.trim()}`);
  if (input.password?.trim()) lines.push(`Password: ${input.password}`);
  if (input.notes?.trim()) lines.push(`Notes: ${input.notes.trim()}`);

  return lines.join('\n');
}
