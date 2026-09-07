import { describe, expect, it } from 'vitest';
import { Schema } from 'effect';

import { CreateServerInput, UpdateServerInput } from '@/Servers/Servers.schema';

describe('CreateServerInput', () => {
  it('accepts a server with mode ip and an ip', () => {
    const result = Schema.decodeUnknownSync(CreateServerInput)({
      mode: 'ip',
      ip: '10.0.0.1',
      title: 'my server',
    });
    expect(result.mode).toBe('ip');
    expect(result).toMatchObject({ ip: '10.0.0.1' });
  });

  it('accepts a server with mode url and a url', () => {
    const result = Schema.decodeUnknownSync(CreateServerInput)({
      mode: 'url',
      url: 'https://example.com',
      title: 'my site',
    });
    expect(result.mode).toBe('url');
    expect(result).toMatchObject({ url: 'https://example.com' });
  });

  it('rejects a payload with no mode', () => {
    expect(() =>
      Schema.decodeUnknownSync(CreateServerInput)({ title: 'nothing to ping' }),
    ).toThrow();
  });

  it('rejects mode url without a url', () => {
    expect(() =>
      Schema.decodeUnknownSync(CreateServerInput)({ mode: 'url', title: 'nothing to ping' }),
    ).toThrow();
  });

  it('rejects mode ip with an invalid ip', () => {
    expect(() =>
      Schema.decodeUnknownSync(CreateServerInput)({ mode: 'ip', ip: 'not-an-ip', title: 'bad ip' }),
    ).toThrow();
  });

  it('ignores an ip sent alongside mode url — the url variant has no ip field', () => {
    // Sending both is not a distinct case the schema needs to reject: `mode`
    // selects the variant, and `ip` isn't one of its fields, so it's simply
    // dropped rather than applied. This is what makes "both at once" the
    // Servers.schema.ts header describes as structurally exclusive.
    const result = Schema.decodeUnknownSync(CreateServerInput)({
      mode: 'url',
      url: 'https://example.com',
      ip: '10.0.0.1',
      title: 'both',
    });
    expect(result).toMatchObject({ mode: 'url', url: 'https://example.com' });
    expect('ip' in result).toBe(false);
  });
});

describe('UpdateServerInput', () => {
  it('accepts a title-only update for mode url', () => {
    const result = Schema.decodeUnknownSync(UpdateServerInput)({ mode: 'url', title: 'Renamed' });
    expect(result.mode).toBe('url');
  });

  it('accepts a title-only update for mode ip', () => {
    const result = Schema.decodeUnknownSync(UpdateServerInput)({ mode: 'ip', title: 'Renamed' });
    expect(result.mode).toBe('ip');
  });

  it('rejects a payload with no mode', () => {
    expect(() => Schema.decodeUnknownSync(UpdateServerInput)({ title: 'Renamed' })).toThrow();
  });
});
