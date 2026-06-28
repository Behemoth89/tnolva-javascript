import { resolveProviderModel, type ValidationResult } from '../chats/validation';

export const MAX_NAME_LENGTH = 128;

export interface CreateProjectTemplateInputParsed {
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
  is_default: boolean;
}

export interface UpdateProjectTemplateInputParsed {
  name?: string;
  system_prompt?: string | null;
  default_llm_provider_model?: string;
  is_default?: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function checkName(raw: unknown, partial: boolean): string | null {
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

function checkModel(raw: unknown, partial: boolean): string | null {
  if (raw === undefined || raw === null) {
    return partial ? null : 'default_llm_provider_model is required';
  }
  if (typeof raw !== 'string' || raw.length === 0) {
    return partial ? null : 'default_llm_provider_model must be a non-empty string';
  }
  const resolved = resolveProviderModel(raw);
  if (!resolved.ok) {
    return resolved.error;
  }
  return raw;
}

function checkIsDefault(raw: unknown, partial: boolean): { value: boolean | undefined; error: string | null } {
  if (raw === undefined) {
    if (partial) {
      return { value: undefined, error: null };
    }
    return { value: false, error: null };
  }
  if (typeof raw !== 'boolean') {
    return { value: undefined, error: 'is_default must be a boolean' };
  }
  return { value: raw, error: null };
}

export function parseCreateProjectTemplateBody(
  body: unknown,
): ValidationResult<CreateProjectTemplateInputParsed> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const name = checkName(body.name, false);
  if (name === null) {
    return { ok: false, error: 'name is required' };
  }
  if (typeof name !== 'string') {
    return { ok: false, error: name };
  }
  const systemPrompt = systemPromptValue(body.system_prompt);
  if (systemPrompt.error) {
    return { ok: false, error: systemPrompt.error };
  }
  const model = checkModel(body.default_llm_provider_model, false);
  if (model === null) {
    return { ok: false, error: 'default_llm_provider_model is required' };
  }
  if (typeof model !== 'string') {
    return { ok: false, error: model };
  }
  const isDefault = checkIsDefault(body.is_default, false);
  if (isDefault.error) {
    return { ok: false, error: isDefault.error };
  }
  return {
    ok: true,
    value: {
      name,
      system_prompt: systemPrompt.value,
      default_llm_provider_model: model,
      is_default: Boolean(isDefault.value),
    },
  };
}

export function parseUpdateProjectTemplateBody(
  body: unknown,
): ValidationResult<UpdateProjectTemplateInputParsed> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const out: UpdateProjectTemplateInputParsed = {};
  const hasName = Object.prototype.hasOwnProperty.call(body, 'name');
  if (hasName) {
    const name = checkName(body.name, true);
    if (typeof name !== 'string') {
      return { ok: false, error: name ?? 'name must be a non-empty string' };
    }
    out.name = name;
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
    const model = checkModel(body.default_llm_provider_model, true);
    if (model === null) {
      // keep
    } else if (typeof model !== 'string') {
      return { ok: false, error: model };
    } else {
      out.default_llm_provider_model = model;
    }
  }
  const hasIsDefault = Object.prototype.hasOwnProperty.call(body, 'is_default');
  if (hasIsDefault) {
    const isDefault = checkIsDefault(body.is_default, true);
    if (isDefault.error) {
      return { ok: false, error: isDefault.error };
    }
    if (isDefault.value !== undefined) {
      out.is_default = isDefault.value;
    }
  }
  if (!hasName && !hasSystemPrompt && !hasModel && !hasIsDefault) {
    return {
      ok: false,
      error: 'At least one of name, system_prompt, default_llm_provider_model, or is_default is required',
    };
  }
  return { ok: true, value: out };
}
