import { LLM_PROVIDER_TYPES, type LLMProviderType } from './llmProvidersRepo';

export const MAX_NAME_LENGTH = 128;
export const MAX_URL_LENGTH = 512;
export const MAX_API_KEY_LENGTH = 512;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface ProviderInput {
  name: string;
  url: string;
  api_key: string;
  type: LLMProviderType;
}

export interface ModelInput {
  llm_provider_id?: number;
  name: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function checkName(name: unknown, field: string, partial: boolean): string | null {
  if (name === undefined || name === null) {
    return partial ? null : `${field} is required`;
  }
  if (typeof name !== 'string') {
    return `${field} must be a string`;
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return partial ? null : `${field} is required`;
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `${field} must be ${MAX_NAME_LENGTH} characters or fewer`;
  }
  return null;
}

function checkUrl(url: unknown, partial: boolean): string | null {
  if (url === undefined || url === null) {
    return partial ? null : 'url is required';
  }
  if (typeof url !== 'string') {
    return 'url must be a string';
  }
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return partial ? null : 'url is required';
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return `url must be ${MAX_URL_LENGTH} characters or fewer`;
  }
  return null;
}

function checkType(type: unknown, partial: boolean): string | null {
  if (type === undefined || type === null) {
    return partial ? null : 'type is required';
  }
  if (typeof type !== 'string') {
    return 'type must be a string';
  }
  if (!LLM_PROVIDER_TYPES.includes(type as LLMProviderType)) {
    return `type must be one of: ${LLM_PROVIDER_TYPES.join(', ')}`;
  }
  return null;
}

function checkApiKey(apiKey: unknown, partial: boolean): string | null {
  if (apiKey === undefined || apiKey === null) {
    return partial ? null : 'api_key is required';
  }
  if (typeof apiKey !== 'string') {
    return 'api_key must be a string';
  }
  if (apiKey.length === 0) {
    return partial ? null : 'api_key is required';
  }
  if (apiKey.length > MAX_API_KEY_LENGTH) {
    return `api_key must be ${MAX_API_KEY_LENGTH} characters or fewer`;
  }
  return null;
}

function checkProviderId(value: unknown, partial: boolean): string | null {
  if (value === undefined || value === null) {
    return partial ? null : 'llm_provider_id is required';
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return 'llm_provider_id must be a positive integer';
  }
  return null;
}

export function parseProviderBody(
  body: unknown,
  options: { partial?: boolean } = {},
): ValidationResult<ProviderInput> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const partial = options.partial === true;

  const nameError = checkName(body.name, 'name', partial);
  if (nameError) {
    return { ok: false, error: nameError };
  }
  const urlError = checkUrl(body.url, partial);
  if (urlError) {
    return { ok: false, error: urlError };
  }
  const apiKeyError = checkApiKey(body.api_key, partial);
  if (apiKeyError) {
    return { ok: false, error: apiKeyError };
  }
  const typeError = checkType(body.type, partial);
  if (typeError) {
    return { ok: false, error: typeError };
  }

  const result: ProviderInput = {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    url: typeof body.url === 'string' ? body.url.trim() : '',
    type: body.type as LLMProviderType,
    api_key: typeof body.api_key === 'string' ? body.api_key : '',
  };
  if (partial) {
    if (body.name === undefined || body.name === null) {
      delete (result as { name?: string }).name;
    }
    if (body.url === undefined || body.url === null) {
      delete (result as { url?: string }).url;
    }
    if (body.type === undefined || body.type === null) {
      delete (result as { type?: LLMProviderType }).type;
    }
    if (body.api_key === undefined || body.api_key === null || body.api_key === '') {
      delete (result as { api_key?: string }).api_key;
    }
  }
  return { ok: true, value: result };
}

export function parseModelBody(
  body: unknown,
  options: { partial?: boolean } = {},
): ValidationResult<ModelInput> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const partial = options.partial === true;

  const providerIdError = checkProviderId(body.llm_provider_id, partial);
  if (providerIdError) {
    return { ok: false, error: providerIdError };
  }
  const nameError = checkName(body.name, 'name', partial);
  if (nameError) {
    return { ok: false, error: nameError };
  }

  const result: ModelInput = {
    llm_provider_id: typeof body.llm_provider_id === 'number' ? body.llm_provider_id : 0,
    name: typeof body.name === 'string' ? body.name.trim() : '',
  };
  if (partial && (body.llm_provider_id === undefined || body.llm_provider_id === null)) {
    delete (result as { llm_provider_id?: number }).llm_provider_id;
  }
  if (partial && (body.name === undefined || body.name === null)) {
    delete (result as { name?: string }).name;
  }
  return { ok: true, value: result };
}
