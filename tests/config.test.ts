import { expect, it } from 'vitest';
import { redirectFor } from '../src/config.js';
import { isPortInUse } from '../src/index.js';

it('defaults the Twitch redirect to the configured PORT only when unset', () => {
  expect(redirectFor(3137, undefined)).toBe('http://localhost:3137/auth/callback');
  expect(redirectFor(3137, 'http://localhost:3000/auth/callback')).toBe('http://localhost:3000/auth/callback');
});
it('recognizes only a port conflict as a nameable startup failure', () => {
  expect(isPortInUse(Object.assign(new Error('listen EADDRINUSE'), { code: 'EADDRINUSE' }))).toBe(true);
  expect(isPortInUse(new Error('anything else'))).toBe(false);
  expect(isPortInUse(null)).toBe(false);
});
