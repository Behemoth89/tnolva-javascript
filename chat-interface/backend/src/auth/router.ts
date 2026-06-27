import { Router, type Request, type Response } from 'express';
import { hashPassword, verifyPassword } from './passwords';
import { findByEmail, createUser, findById, type PublicUser } from './usersRepo';
import { validateLogin, validateRegistration } from './validation';

const router = Router();

function publicUserShape(user: PublicUser): { id: number; email: string; is_admin: number } {
  return { id: user.id, email: user.email, is_admin: user.is_admin };
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

router.post('/register', async (req: Request, res: Response) => {
  const parsed = validateRegistration(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const existing = findByEmail(parsed.value.email);
  if (existing) {
    res.status(409).json({ error: 'Email is already registered' });
    return;
  }
  const passwordHash = await hashPassword(parsed.value.password);
  let created;
  try {
    created = createUser({ email: parsed.value.email, passwordHash });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create user';
    if (message.toLowerCase().includes('unique')) {
      res.status(409).json({ error: 'Email is already registered' });
      return;
    }
    res.status(500).json({ error: 'Failed to create user' });
    return;
  }
  try {
    await regenerateSession(req);
  } catch {
    res.status(500).json({ error: 'Failed to start session' });
    return;
  }
  req.session.userId = created.user.id;
  req.session.isAdmin = created.isAdmin;
  try {
    await saveSession(req);
  } catch {
    res.status(500).json({ error: 'Failed to start session' });
    return;
  }
  res.status(201).json({ user: publicUserShape(created.user) });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = validateLogin(req.body);
  if (!parsed.ok) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const user = findByEmail(parsed.value.email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const ok = await verifyPassword(parsed.value.password, user.password_hash);
  if (!ok) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  try {
    await regenerateSession(req);
  } catch {
    res.status(500).json({ error: 'Failed to start session' });
    return;
  }
  req.session.userId = user.id;
  req.session.isAdmin = user.is_admin === 1;
  try {
    await saveSession(req);
  } catch {
    res.status(500).json({ error: 'Failed to start session' });
    return;
  }
  res.status(200).json({
    user: publicUserShape({ id: user.id, email: user.email, is_admin: user.is_admin }),
  });
});

router.post('/logout', (req: Request, res: Response) => {
  if (!req.session) {
    res.status(204).end();
    return;
  }
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to log out' });
      return;
    }
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

router.get('/me', (req: Request, res: Response) => {
  const userId = req.session?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const user = findById(userId);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.status(200).json({
    user: publicUserShape({ id: user.id, email: user.email, is_admin: user.is_admin }),
  });
});

export default router;
