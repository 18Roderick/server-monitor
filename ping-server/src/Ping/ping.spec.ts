import { describe, expect, it } from 'vitest';
import { Schema } from 'effect';

import { PingResult } from '@/Ping/ping';

describe('PingResult', () => {
  it('decodes the ping package raw output, coercing numeric-looking strings', () => {
    const raw = {
      inputHost: 'example.com',
      host: 'example.com',
      alive: true,
      output: 'PING example.com...',
      time: 12.3,
      times: [12.3, 11.9],
      numeric_host: '93.184.216.34',
      min: '11.900',
      max: '12.300',
      avg: '12.100',
      stddev: '0.200',
      packetLoss: '0.000',
    };

    const result = Schema.decodeUnknownSync(PingResult)(raw);
    expect(result.min).toBe(11.9);
    expect(result.max).toBe(12.3);
    expect(result.avg).toBe(12.1);
    expect(result.packetLoss).toBe(0);
  });

  it('rejects output missing required fields', () => {
    expect(() => Schema.decodeUnknownSync(PingResult)({ alive: true })).toThrow();
  });
});
