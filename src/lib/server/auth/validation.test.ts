import { describe, expect, it } from 'vitest';
import { generateBearerToken, hashBearerToken, rateBucketHash } from './primitives';
import {
  normalizeEmail,
  parseAuthOrigin,
  parseRateLimitKey,
  safeReturnPath,
  validBearerToken
} from './validation';

describe('account input boundaries', () => {
  it('normalizes an address and rejects malformed or oversized input', () => {
    expect(normalizeEmail('  Person@Example.COM  ')).toBe('person@example.com');
    expect(normalizeEmail('not an address')).toBeNull();
    expect(normalizeEmail('a'.repeat(255) + '@example.com')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  it('accepts only known relative return paths', () => {
    expect(safeReturnPath('/reviews')).toBe('/reviews');
    expect(safeReturnPath('//evil.example')).toBe('/account');
    expect(safeReturnPath('https://evil.example')).toBe('/account');
    expect(safeReturnPath('/reviews/../account')).toBe('/account');
  });

  it('requires an explicit HTTPS origin except on loopback', () => {
    expect(parseAuthOrigin('https://onihayo.example').origin).toBe('https://onihayo.example');
    expect(parseAuthOrigin('http://localhost:3000').origin).toBe('http://localhost:3000');
    expect(() => parseAuthOrigin('http://onihayo.example')).toThrow();
    expect(() => parseAuthOrigin('https://onihayo.example/path')).toThrow();
    expect(() => parseAuthOrigin('https://user:pass@onihayo.example')).toThrow();
  });

  it('requires a 256-bit rate-limit key and separates IP and email buckets', () => {
    const encoded = Buffer.alloc(32, 7).toString('base64url');
    const key = parseRateLimitKey(encoded);
    expect(key.length).toBe(32);
    expect(rateBucketHash(key, 'ip', 'shared')).not.toBe(rateBucketHash(key, 'email', 'shared'));
    expect(rateBucketHash(key, 'email', 'shared')).not.toContain('shared');
    expect(() => parseRateLimitKey('short')).toThrow();
  });

  it('generates opaque 256-bit bearer values and stores only their hashes', () => {
    const first = generateBearerToken();
    const second = generateBearerToken();
    expect(first).toHaveLength(43);
    expect(validBearerToken(first)).toBe(true);
    expect(first).not.toBe(second);
    expect(hashBearerToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashBearerToken(first)).not.toBe(first);
    expect(validBearerToken(first + 'x')).toBe(false);
  });
});
