import { describe, it, expect } from 'vitest';
import { hashPassword } from './crypto';

describe('hashPassword', () => {
  it('hashes a password using SHA-256', async () => {
    // The SHA-256 hash of "password" is:
    // 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
    const hash = await hashPassword('password');
    expect(hash).toBe('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
  });

  it('produces different hashes for different passwords', async () => {
    const hash1 = await hashPassword('admin123');
    const hash2 = await hashPassword('admin124');
    expect(hash1).not.toBe(hash2);
  });
});
