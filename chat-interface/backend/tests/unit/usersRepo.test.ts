import { initDb, closeDb } from '../../src/db';
import { countUsers, createUser, findByEmail } from '../../src/auth/usersRepo';

const TEST_DB_PATH = ':memory:';

describe('usersRepo first-user-admin rule (unit)', () => {
  beforeEach(() => {
    closeDb();
    initDb(TEST_DB_PATH);
  });

  afterAll(() => {
    closeDb();
  });

  it('marks the first user as admin', async () => {
    expect(countUsers()).toBe(0);
    const result = createUser({
      email: 'Alice@Example.com',
      passwordHash: 'hashed-not-used-here',
    });
    expect(result.isAdmin).toBe(true);
    expect(result.user.is_admin).toBe(1);
    expect(result.user.email).toBe('alice@example.com');
  });

  it('marks every subsequent user as non-admin', async () => {
    createUser({ email: 'first@example.com', passwordHash: 'h' });
    const second = createUser({ email: 'second@example.com', passwordHash: 'h' });
    const third = createUser({ email: 'third@example.com', passwordHash: 'h' });
    expect(second.isAdmin).toBe(false);
    expect(third.isAdmin).toBe(false);
    expect(second.user.is_admin).toBe(0);
    expect(third.user.is_admin).toBe(0);
  });

  it('enforces uniqueness on the normalized lowercase email', () => {
    createUser({ email: 'first@example.com', passwordHash: 'h' });
    expect(() => createUser({ email: 'FIRST@example.com', passwordHash: 'h' })).toThrow();
    const stored = findByEmail('first@example.com');
    expect(stored).not.toBeNull();
    expect(stored?.email).toBe('first@example.com');
  });
});
