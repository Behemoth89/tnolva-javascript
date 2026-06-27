export type LLMProviderType = 'openai_completions' | 'openai_responses' | 'anthropic';

export const LLM_PROVIDER_TYPES: readonly LLMProviderType[] = [
  'openai_completions',
  'openai_responses',
  'anthropic',
] as const;

export interface LLMProvider {
  id: number;
  name: string;
  url: string;
  api_key: string;
  type: LLMProviderType;
  created_at: string;
}

export interface LLMProviderModel {
  id: number;
  llm_provider_id: number;
  name: string;
  created_at: string;
}

export interface CreateProviderInput {
  name: string;
  url: string;
  api_key: string;
  type: LLMProviderType;
}

export type UpdateProviderInput = Partial<CreateProviderInput>;

export interface CreateModelInput {
  llm_provider_id: number;
  name: string;
}

export type UpdateModelInput = Partial<CreateModelInput>;

const JSON_HEADERS: HeadersInit = {
  'content-type': 'application/json',
};

const FETCH_OPTIONS: RequestInit = {
  credentials: 'include',
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (data && typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    // fall through
  }
  return `Request failed with status ${res.status}`;
}

async function request<T>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, {
    ...FETCH_OPTIONS,
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as T;
}

export async function listProviders(): Promise<LLMProvider[]> {
  return request<LLMProvider[]>('/api/admin/llm-providers');
}

export async function getProvider(id: number): Promise<LLMProvider> {
  return request<LLMProvider>(`/api/admin/llm-providers/${id}`);
}

export async function createProvider(input: CreateProviderInput): Promise<LLMProvider> {
  return request<LLMProvider>('/api/admin/llm-providers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProvider(
  id: number,
  input: UpdateProviderInput,
): Promise<LLMProvider> {
  return request<LLMProvider>(`/api/admin/llm-providers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteProvider(id: number): Promise<void> {
  const res = await fetch(`/api/admin/llm-providers/${id}`, {
    ...FETCH_OPTIONS,
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseError(res));
  }
}

export async function listModels(providerId?: number): Promise<LLMProviderModel[]> {
  const url =
    typeof providerId === 'number'
      ? `/api/admin/llm-provider-models?provider_id=${providerId}`
      : '/api/admin/llm-provider-models';
  return request<LLMProviderModel[]>(url);
}

export async function getModel(id: number): Promise<LLMProviderModel> {
  return request<LLMProviderModel>(`/api/admin/llm-provider-models/${id}`);
}

export async function createModel(input: CreateModelInput): Promise<LLMProviderModel> {
  return request<LLMProviderModel>('/api/admin/llm-provider-models', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateModel(
  id: number,
  input: UpdateModelInput,
): Promise<LLMProviderModel> {
  return request<LLMProviderModel>(`/api/admin/llm-provider-models/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteModel(id: number): Promise<void> {
  const res = await fetch(`/api/admin/llm-provider-models/${id}`, {
    ...FETCH_OPTIONS,
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseError(res));
  }
}
