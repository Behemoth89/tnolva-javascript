/**
 * User payload attached to request after JWT authentication
 */
export interface AuthUserPayload {
  userId: string;
  email: string;
  companyId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload | null;
    }
  }
}
