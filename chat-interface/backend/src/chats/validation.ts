import { getDb } from '../db';

export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 32_000;

export const PROVIDER_MODEL_REGEX = /^[A-Za-z0-9._-]+:[A-Za-z0-9._:-]+$/;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface ResolvedProvider {
  providerName: string;
  modelName: string;
  providerId: number;
  modelId: number;
  url: string;
  apiKey: string;
  type: 'openai_completions' | 'openai_responses' | 'anthropic';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function resolveProviderModel(
  providerModel: string,
): { ok: true; value: ResolvedProvider } | { ok: false; error: string } {
  if (typeof providerModel !== 'string' || !PROVIDER_MODEL_REGEX.test(providerModel)) {
    return {
      ok: false,
      error: 'provider_model must be of the form <provider>:<model>',
    };
  }
  const colonIdx = providerModel.indexOf(':');
  const providerName = providerModel.slice(0, colonIdx);
  const modelName = providerModel.slice(colonIdx + 1);
  const db = getDb();
  const provider = db
    .prepare(
      'SELECT id, name, url, api_key, type FROM llm_providers WHERE name = ?',
    )
    .get(providerName) as
    | {
        id: number;
        name: string;
        url: string;
        api_key: string;
        type: 'openai_completions' | 'openai_responses' | 'anthropic';
      }
    | undefined;
  if (!provider) {
    return { ok: false, error: `Unknown provider "${providerName}"` };
  }
  const model = db
    .prepare(
      'SELECT id, name FROM llm_provider_models WHERE llm_provider_id = ? AND name = ?',
    )
    .get(provider.id, modelName) as { id: number; name: string } | undefined;
  if (!model) {
    return {
      ok: false,
      error: `Model "${modelName}" is not registered for provider "${providerName}"`,
    };
  }
  return {
    ok: true,
    value: {
      providerName: provider.name,
      modelName: model.name,
      providerId: provider.id,
      modelId: model.id,
      url: provider.url,
      apiKey: provider.api_key,
      type: provider.type,
    },
  };
}

export interface CreateChatInputParsed {
  title: string | null;
  default_llm_provider_model: string;
  project_id?: number;
}

export function parseCreateChatBody(body: unknown): ValidationResult<CreateChatInputParsed> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const title = body.title;
  if (title !== undefined && title !== null) {
    if (typeof title !== 'string') {
      return { ok: false, error: 'title must be a string' };
    }
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return { ok: false, error: 'title must be a non-empty string' };
    }
    if (trimmed.length > MAX_TITLE_LENGTH) {
      return {
        ok: false,
        error: `title must be ${MAX_TITLE_LENGTH} characters or fewer`,
      };
    }
  }
  const providerModel = body.default_llm_provider_model;
  if (typeof providerModel !== 'string' || providerModel.length === 0) {
    return { ok: false, error: 'default_llm_provider_model is required' };
  }
  const resolved = resolveProviderModel(providerModel);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }
  const out: CreateChatInputParsed = {
    title: typeof title === 'string' ? title.trim() : null,
    default_llm_provider_model: providerModel,
  };
  if (Object.prototype.hasOwnProperty.call(body, 'project_id') && body.project_id !== undefined && body.project_id !== null) {
    if (typeof body.project_id !== 'number' || !Number.isInteger(body.project_id) || body.project_id <= 0) {
      return { ok: false, error: 'project_id must be a positive integer' };
    }
    out.project_id = body.project_id;
  }
  return {
    ok: true,
    value: out,
  };
}

export interface UpdateChatInputParsed {
  title?: string | null;
  default_llm_provider_model?: string;
}

export function parseUpdateChatBody(body: unknown): ValidationResult<UpdateChatInputParsed> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const out: UpdateChatInputParsed = {};
  const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title');
  if (hasTitle) {
    const title = body.title;
    if (title !== null && typeof title !== 'string') {
      return { ok: false, error: 'title must be a string or null' };
    }
    if (typeof title === 'string') {
      const trimmed = title.trim();
      if (trimmed.length === 0) {
        return { ok: false, error: 'title must be a non-empty string' };
      }
      if (trimmed.length > MAX_TITLE_LENGTH) {
        return {
          ok: false,
          error: `title must be ${MAX_TITLE_LENGTH} characters or fewer`,
        };
      }
      out.title = trimmed;
    } else {
      out.title = null;
    }
  }
  const hasModel = Object.prototype.hasOwnProperty.call(body, 'default_llm_provider_model');
  if (hasModel) {
    const providerModel = body.default_llm_provider_model;
    if (typeof providerModel !== 'string' || providerModel.length === 0) {
      return { ok: false, error: 'default_llm_provider_model must be a non-empty string' };
    }
    const resolved = resolveProviderModel(providerModel);
    if (!resolved.ok) {
      return { ok: false, error: resolved.error };
    }
    out.default_llm_provider_model = providerModel;
  }
  if (!hasTitle && !hasModel) {
    return { ok: false, error: 'At least one of title or default_llm_provider_model is required' };
  }
  return { ok: true, value: out };
}

export interface SendMessageInputParsed {
  content: string;
  provider_model?: string;
}

export function parseSendMessageBody(body: unknown): ValidationResult<SendMessageInputParsed> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const content = body.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    return { ok: false, error: 'content must be a non-empty string' };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      ok: false,
      error: `content must be ${MAX_CONTENT_LENGTH} characters or fewer`,
    };
  }
  const out: SendMessageInputParsed = { content };
  if (body.provider_model !== undefined && body.provider_model !== null) {
    if (typeof body.provider_model !== 'string') {
      return { ok: false, error: 'provider_model must be a string' };
    }
    const resolved = resolveProviderModel(body.provider_model);
    if (!resolved.ok) {
      return { ok: false, error: resolved.error };
    }
    out.provider_model = body.provider_model;
  }
  return { ok: true, value: out };
}
