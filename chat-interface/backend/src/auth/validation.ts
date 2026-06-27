const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface RegistrationInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string') {
    return 'Email is required';
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return 'Email is required';
  }
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return `Email must be ${MAX_EMAIL_LENGTH} characters or fewer`;
  }
  if (!EMAIL_RE.test(trimmed)) {
    return 'Email is not a valid address';
  }
  return null;
}

function validatePasswordShape(password: unknown): string | null {
  if (typeof password !== 'string') {
    return 'Password is required';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer`;
  }
  return null;
}

export function validateRegistration(input: unknown): ValidationResult<RegistrationInput> {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const body = input as Record<string, unknown>;
  const emailError = validateEmail(body.email);
  if (emailError) {
    return { ok: false, error: emailError };
  }
  const passwordError = validatePasswordShape(body.password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }
  return {
    ok: true,
    value: {
      email: (body.email as string).trim().toLowerCase(),
      password: body.password as string,
    },
  };
}

export function validateLogin(input: unknown): ValidationResult<LoginInput> {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const body = input as Record<string, unknown>;
  const emailError = validateEmail(body.email);
  if (emailError) {
    return { ok: false, error: emailError };
  }
  if (typeof body.password !== 'string' || body.password.length === 0) {
    return { ok: false, error: 'Password is required' };
  }
  return {
    ok: true,
    value: {
      email: (body.email as string).trim().toLowerCase(),
      password: body.password as string,
    },
  };
}
