export type CredentialClipboardInput = {
  projectName: string;
  url: string;
  username?: string | null;
  password?: string | null;
  notes?: string | null;
};

export function formatCredentialsForClipboard(input: CredentialClipboardInput): string {
  return [input.username?.trim(), input.password?.trim()].filter(Boolean).join('\n');
}
