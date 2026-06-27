import { BCRYPT_COST, hashPassword, verifyPassword } from '../../src/auth/passwords';

describe('passwords (unit)', () => {
  it('hashes to a value that is not the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.length).toBeGreaterThan(20);
    expect(hash).not.toContain('correct horse battery staple');
  });

  it('verifyPassword returns true for the correct password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('verifyPassword returns false for a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });

  it('produces hashes at the documented bcrypt cost factor', async () => {
    const hash = await hashPassword('a-test-password');
    // bcrypt hash format: $2a$<cost>$...
    const match = /^\$2[aby]?\$(\d{2})\$/.exec(hash);
    expect(match).not.toBeNull();
    const cost = Number(match![1]);
    expect(cost).toBe(BCRYPT_COST);
    expect(cost).toBeGreaterThanOrEqual(10);
  });
});
