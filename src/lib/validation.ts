import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

export const uuidSchema = z.string().uuid();

export const clientGroupInputSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required.').max(120),
  niche: z.string().trim().min(1, 'Client niche is required.').max(120),
  description: optionalText,
});

const urlSchema = z
  .string()
  .trim()
  .url('Enter a valid project URL.')
  .transform((value) => new URL(value).toString());

export const projectWithLinkInputSchema = z.object({
  clientGroupId: uuidSchema,
  name: z.string().trim().min(1, 'Project name is required.').max(160),
  description: optionalText,
  url: urlSchema,
  username: optionalText,
  password: optionalText,
  accessNotes: optionalText,
});

export const projectInputSchema = z.object({
  clientGroupId: uuidSchema,
  name: z.string().trim().min(1, 'Project name is required.').max(160),
  description: optionalText,
});

export const linkInputSchema = z.object({
  projectId: uuidSchema,
  label: z.string().trim().min(1).max(80).default('Project'),
  url: urlSchema,
  kind: optionalText,
});

export type ClientGroupInput = z.infer<typeof clientGroupInputSchema>;
export type ProjectWithLinkInput = z.infer<typeof projectWithLinkInputSchema>;
