import { createHash, createHmac, randomBytes } from 'node:crypto';

/** 256 bits of entropy encoded as 43 URL-safe characters. */
export function generateBearerToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashBearerToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Domain separation prevents the same value in two bucket types from sharing a counter. */
export function rateBucketHash(key: Buffer, type: 'ip' | 'email', value: string): string {
  return createHmac('sha256', key).update(type).update('\0').update(value).digest('hex');
}
