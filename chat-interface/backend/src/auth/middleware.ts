import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { findById, type PublicUser } from './usersRepo';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface AuthInfo {
      userId: number;
      isAdmin: boolean;
      user: PublicUser;
    }
    interface Request {
      auth?: AuthInfo;
    }
  }
}

function notAuthenticated(res: Response): Response {
  return res.status(401).json({ error: 'Not authenticated' });
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.session?.userId;
  if (typeof userId !== 'number') {
    notAuthenticated(res);
    return;
  }
  const user = findById(userId);
  if (!user) {
    req.session.destroy(() => {
      notAuthenticated(res);
    });
    return;
  }
  req.auth = {
    userId: user.id,
    isAdmin: user.is_admin === 1,
    user: { id: user.id, email: user.email, is_admin: user.is_admin },
  };
  if (req.session) {
    req.session.isAdmin = user.is_admin === 1;
  }
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (typeof req.session?.userId !== 'number') {
    notAuthenticated(res);
    return;
  }
  if (!req.auth) {
    notAuthenticated(res);
    return;
  }
  if (!req.auth.isAdmin) {
    res.status(403).json({ error: 'Admin privileges required' });
    return;
  }
  next();
};
