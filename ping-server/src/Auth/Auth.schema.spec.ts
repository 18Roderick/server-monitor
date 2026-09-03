import { describe, expect, it } from 'vitest';

import { SignUpInput } from '@/Auth/Auth.schema';

describe('SignUpInput', () => {
  it('accepts a strong password', () => {
    const result = SignUpInput.make({
      name: 'Rodrigo',
      email: 'rod@example.com',
      password: 'Str0ng!Pass',
    });
    expect(result.password).toBe('Str0ng!Pass');
  });

  it('rejects a password missing a symbol', () => {
    expect(() =>
      SignUpInput.make({ name: 'Rodrigo', email: 'rod@example.com', password: 'Str0ngPass' }),
    ).toThrow();
  });

  it('rejects a password that is too short', () => {
    expect(() =>
      SignUpInput.make({ name: 'Rodrigo', email: 'rod@example.com', password: 'Sh0rt!' }),
    ).toThrow();
  });

  it('rejects an invalid email', () => {
    expect(() =>
      SignUpInput.make({ name: 'Rodrigo', email: 'not-an-email', password: 'Str0ng!Pass' }),
    ).toThrow();
  });
});
