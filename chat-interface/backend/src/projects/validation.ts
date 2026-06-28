import { resolveProviderModel, type ValidationResult } from '../chats/validation';

export const MAX_NAME_LENGTH = 80;

export interface CreateProjectInputParsed {
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
}

export interface UpdateProjectInputParsed {
  name?: string;
  system_prompt?: string | null;
  default_llm_provider_model?: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function trimName(raw: unknown, partial: boolean): string | null {
  if (raw === undefined || raw === null) {
    return partial ? null : 'name is required';
  }
  if (typeof raw !== 'string') {
    return 'name must be a string';
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return partial ? null : 'name is required';
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `name must be ${MAX_NAME_LENGTH} characters or fewer`;
  }
  return trimmed;
}

function systemPromptValue(raw: unknown): { value: string | null; error: string | null } {
  if (raw === undefined) {
    return { value: null, error: null };
  }
  if (raw === null) {
    return { value: null, error: null };
  }
  if (typeof raw !== 'string') {
    return { value: null, error: 'system_prompt must be a string or null' };
  }
  return { value: raw, error: null };
}

function partialSystemPromptValue(raw: unknown): { value: string | null | undefined; error: string | null } {
  if (raw === undefined) {
    return { value: undefined, error: null };
  }
  if (raw === null) {
    return { value: null, error: null };
  }
  if (typeof raw !== 'string') {
    return { value: undefined, error: 'system_prompt must be a string or null' };
  }
  return { value: raw, error: null };
}

function requireModel(raw: unknown): { value: string; error: string | null } {
  if (typeof raw !== 'string' || raw.length === 0) {
    return { value: '', error: 'default_llm_provider_model is required' };
  }
  const resolved = resolveProviderModel(raw);
  if (!resolved.ok) {
    return { value: '', error: resolved.error };
  }
  return { value: raw, error: null };
}

function optionalModel(raw: unknown, partial: boolean): { value: string | null; error: string | null } {
  if (raw === undefined) {
    return { value: partial ? null : '', error: null };
  }
  if (typeof raw !== 'string' || raw.length === 0) {
    return { value: '', error: 'default_llm_provider_model must be a non-empty string' };
  }
  const resolved = resolveProviderModel(raw);
  if (!resolved.ok) {
    return { value: '', error: resolved.error };
  }
  return { value: raw, error: null };
}

export function parseCreateProjectBody(body: unknown): ValidationResult<CreateProjectInputParsed> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const nameResult = trimName(body.name, false);
  if (nameResult === null || typeof nameResult !== 'string') {
    return { ok: false, error: nameResult ?? 'name is required' };
  }
  const systemPrompt = systemPromptValue(body.system_prompt);
  if (systemPrompt.error) {
    return { ok: false, error: systemPrompt.error };
  }
  const model = requireModel(body.default_llm_provider_model);
  if (model.error) {
    return { ok: false, error: model.error };
  }
  return {
    ok: true,
    value: {
      name: nameResult,
      system_prompt: systemPrompt.value,
      default_llm_provider_model: model.value,
    },
  };
}

export function parseUpdateProjectBody(body: unknown): ValidationResult<UpdateProjectInputParsed> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const out: UpdateProjectInputParsed = {};
  const hasName = Object.prototype.hasOwnProperty.call(body, 'name');
  if (hasName) {
    const trimmed = trimName(body.name, true);
    if (trimmed === null || typeof trimmed !== 'string') {
      return { ok: false, error: trimmed ?? 'name must be a non-empty string' };
    }
    out.name = trimmed;
  }
  const hasSystemPrompt = Object.prototype.hasOwnProperty.call(body, 'system_prompt');
  if (hasSystemPrompt) {
    const parsed = partialSystemPromptValue(body.system_prompt);
    if (parsed.error) {
      return { ok: false, error: parsed.error };
    }
    if (parsed.value !== undefined) {
      out.system_prompt = parsed.value;
    }
  }
  const hasModel = Object.prototype.hasOwnProperty.call(body, 'default_llm_provider_model');
  if (hasModel) {
    const model = optionalModel(body.default_llm_provider_model, true);
    if (model.error) {
      return { ok: false, error: model.error };
    }
    if (model.value !== null) {
      out.default_llm_provider_model = model.value as string;
    }
  }
  if (!hasName && !hasSystemPrompt && !hasModel) {
    return { ok: false, error: 'At least one of name, system_prompt, or default_llm_provider_model is required' };
  }
  return { ok: true, value: out };
}

export function parseProjectIdParam(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
}
