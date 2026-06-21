export interface ProjectCredentials {
  username: string | null;
  password: string | null;
  notes: string | null;
  hasCredentials: boolean;
  projectName: string;
  url: string;
}

export interface ExtensionConfig {
  dashboardUrl: string;
  apiToken: string | null;
  enabledDomains: string[];
  autoSubmit: boolean;
}

export interface LoginFormRecipe {
  domain: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  waitForSelector?: string;
  customFill?: (username: string, password: string) => Promise<void>;
}

export interface CredentialRequest {
  type: 'GET_CREDENTIALS';
  payload: {
    linkId: string;
    projectUrl: string;
  };
}

export interface CredentialResponse {
  type: 'CREDENTIALS_RESPONSE';
  payload: ProjectCredentials | { error: string };
}

export interface OpenProjectMessage {
  type: 'OPEN_PROJECT';
  payload: {
    linkId: string;
    url: string;
    projectName: string;
    username?: string | null;
    password?: string | null;
  };
}

export interface GetConfigRequest {
  type: 'GET_CONFIG';
}

export interface GetConfigResponse {
  type: 'CONFIG_RESPONSE';
  payload: ExtensionConfig;
}

export type ExtensionMessage = CredentialRequest | OpenProjectMessage | GetConfigRequest;

export type BackgroundMessage = CredentialResponse | GetConfigResponse;

export const MESSAGE_TYPES = {
  GET_CREDENTIALS: 'GET_CREDENTIALS',
  CREDENTIALS_RESPONSE: 'CREDENTIALS_RESPONSE',
  OPEN_PROJECT: 'OPEN_PROJECT',
  GET_CONFIG: 'GET_CONFIG',
  CONFIG_RESPONSE: 'CONFIG_RESPONSE',
  FORM_FILLED: 'FORM_FILLED',
  AUTO_SUBMIT: 'AUTO_SUBMIT',
} as const;