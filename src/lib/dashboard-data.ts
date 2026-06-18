import 'server-only';

import { getSupabaseAdminClient } from './db';

export type ProjectLink = {
  id: string;
  label: string;
  url: string;
  kind: string | null;
  hasCredentials: boolean;
  sortOrder: number;
};

export type Project = {
  id: string;
  clientGroupId: string;
  name: string;
  description: string | null;
  status: string;
  sortOrder: number;
  links: ProjectLink[];
};

export type ClientGroup = {
  id: string;
  name: string;
  slug: string;
  niche: string | null;
  description: string | null;
  isInternal: boolean;
  sortOrder: number;
  projects: Project[];
};

export type DashboardData = {
  clientGroups: ClientGroup[];
  selectedClientGroup: ClientGroup | null;
};

type RawClientGroup = {
  id: string;
  name: string;
  slug: string;
  niche: string | null;
  description: string | null;
  is_internal: boolean;
  sort_order: number;
};

type RawProject = {
  id: string;
  client_group_id: string;
  name: string;
  description: string | null;
  status: string;
  sort_order: number;
};

type RawProjectLink = {
  id: string;
  project_id: string;
  label: string;
  url: string;
  kind: string | null;
  has_credentials: boolean;
  sort_order: number;
};

export function sanitizeProjectCredentialFields<T extends { id: string }>(row: T): { id: string } {
  return { id: row.id };
}

export function mapDashboardRows(rows: {
  clientGroups: RawClientGroup[];
  projects: RawProject[];
  links: RawProjectLink[];
  selectedClientGroupId?: string | null;
}): DashboardData {
  const linksByProjectId = new Map<string, ProjectLink[]>();

  for (const link of rows.links) {
    const mappedLink: ProjectLink = {
      id: link.id,
      label: link.label,
      url: link.url,
      kind: link.kind,
      hasCredentials: link.has_credentials,
      sortOrder: link.sort_order,
    };
    const existing = linksByProjectId.get(link.project_id) ?? [];
    existing.push(mappedLink);
    linksByProjectId.set(link.project_id, existing);
  }

  const projectsByClientGroupId = new Map<string, Project[]>();
  for (const project of rows.projects) {
    const mappedProject: Project = {
      id: project.id,
      clientGroupId: project.client_group_id,
      name: project.name,
      description: project.description,
      status: project.status,
      sortOrder: project.sort_order,
      links: (linksByProjectId.get(project.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    };
    const existing = projectsByClientGroupId.get(project.client_group_id) ?? [];
    existing.push(mappedProject);
    projectsByClientGroupId.set(project.client_group_id, existing);
  }

  const clientGroups = rows.clientGroups
    .map<ClientGroup>((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      niche: group.niche,
      description: group.description,
      isInternal: group.is_internal,
      sortOrder: group.sort_order,
      projects: (projectsByClientGroupId.get(group.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => Number(b.isInternal) - Number(a.isInternal) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const selectedClientGroup =
    clientGroups.find((group) => group.id === rows.selectedClientGroupId) ?? clientGroups.find((group) => group.isInternal) ?? clientGroups[0] ?? null;

  return { clientGroups, selectedClientGroup };
}

async function selectOrThrow<T>(query: { data: T | null; error: { message: string } | null }): Promise<T> {
  if (query.error) throw new Error(query.error.message);
  return query.data as T;
}

export async function getClientGroupsForSidebar(): Promise<ClientGroup[]> {
  const supabase = getSupabaseAdminClient();
  const clientGroups = await selectOrThrow<RawClientGroup[]>(
    await supabase
      .from('client_groups')
      .select('id,name,slug,niche,description,is_internal,sort_order')
      .order('is_internal', { ascending: false })
      .order('sort_order')
      .order('name'),
  );

  return mapDashboardRows({ clientGroups, projects: [], links: [] }).clientGroups;
}

export async function getDashboardData(selectedClientGroupId?: string | null): Promise<DashboardData> {
  const supabase = getSupabaseAdminClient();

  const [clientGroups, projects, links] = await Promise.all([
    selectOrThrow<RawClientGroup[]>(
      await supabase
        .from('client_groups')
        .select('id,name,slug,niche,description,is_internal,sort_order')
        .order('is_internal', { ascending: false })
        .order('sort_order')
        .order('name'),
    ),
    selectOrThrow<RawProject[]>(
      await supabase
        .from('projects')
        .select('id,client_group_id,name,description,status,sort_order')
        .order('sort_order')
        .order('name'),
    ),
    selectOrThrow<RawProjectLink[]>(
      await supabase
        .from('project_links')
        .select('id,project_id,label,url,kind,has_credentials,sort_order')
        .order('sort_order')
        .order('label'),
    ),
  ]);

  return mapDashboardRows({ clientGroups, projects, links, selectedClientGroupId });
}
