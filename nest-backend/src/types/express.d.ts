/**
 * User payload attached to request after JWT authentication
 */
export interface AuthUserPayload {
  userId: string;
  email: string;
  companyId: string | null;
  companies: Array<{
    companyId: string;
    role: string;
  }>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload | null;
      companyId?: string | null;
    }
  }
}
