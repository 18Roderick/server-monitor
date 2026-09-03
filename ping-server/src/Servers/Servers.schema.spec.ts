import { describe, expect, it } from 'vitest';
import { Schema } from 'effect';

import { CreateServerInputSchema } from '@/Servers/Servers.schema';

describe('CreateServerInputSchema', () => {
  it('accepts a server with only an ip', () => {
    const result = Schema.decodeUnknownSync(CreateServerInputSchema)({
      ip: '10.0.0.1',
      title: 'my server',
    });
    expect(result.ip).toBe('10.0.0.1');
  });

  it('accepts a server with only a url', () => {
    const result = Schema.decodeUnknownSync(CreateServerInputSchema)({
      url: 'https://example.com',
      title: 'my site',
    });
    expect(result.url).toBe('https://example.com');
  });

  it('rejects a server with neither url nor ip', () => {
    expect(() =>
      Schema.decodeUnknownSync(CreateServerInputSchema)({ title: 'nothing to ping' }),
    ).toThrow();
  });

  it('rejects an invalid ip', () => {
    expect(() =>
      Schema.decodeUnknownSync(CreateServerInputSchema)({ ip: 'not-an-ip', title: 'bad ip' }),
    ).toThrow();
  });
});
