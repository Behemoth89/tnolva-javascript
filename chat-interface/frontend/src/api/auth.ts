export interface PublicUser {
  id: number;
  email: string;
  is_admin: number;
}

interface EnvelopedUser {
  user: PublicUser;
}

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

export async function fetchMe(): Promise<PublicUser | null> {
  const res = await fetch('/api/auth/me', { ...FETCH_OPTIONS });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const data = (await res.json()) as EnvelopedUser;
  return data.user;
}

export async function register(email: string, password: string): Promise<PublicUser> {
  const data = await request<EnvelopedUser>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function login(email: string, password: string): Promise<PublicUser> {
  const data = await request<EnvelopedUser>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function logout(): Promise<void> {
  const res = await fetch('/api/auth/logout', {
    ...FETCH_OPTIONS,
    method: 'POST',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseError(res));
  }
}

export async function listUsers(): Promise<PublicUser[]> {
  return request<PublicUser[]>('/api/admin/users');
}
