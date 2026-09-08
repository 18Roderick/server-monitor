import { describe, expect, it } from 'vitest';

import { parseFpingOutput } from '@/Ping/ping';

describe('parseFpingOutput', () => {
  it('parses a fully alive fping -C line into stats', () => {
    const result = parseFpingOutput('example.com : 12.3 11.9 12.5\n');

    expect(result).not.toBeNull();
    expect(result?.alive).toBe(true);
    expect(result?.times).toEqual([12.3, 11.9, 12.5]);
    expect(result?.packetLoss).toBe(0);
    expect(result?.min).toBeCloseTo(11.9);
    expect(result?.max).toBeCloseTo(12.5);
    expect(result?.avg).toBeCloseTo((12.3 + 11.9 + 12.5) / 3);
  });

  it('treats "-" tokens as lost packets and computes partial loss', () => {
    const result = parseFpingOutput('example.com : 12.3 - 12.5\n');

    expect(result?.alive).toBe(true);
    expect(result?.times).toEqual([12.3, 12.5]);
    expect(result?.packetLoss).toBeCloseTo(100 / 3);
  });

  it('reports fully dead when every packet is lost', () => {
    const result = parseFpingOutput('example.com : - - -\n');

    expect(result?.alive).toBe(false);
    expect(result?.times).toEqual([]);
    expect(result?.packetLoss).toBe(100);
    expect(result?.min).toBe(0);
    expect(result?.max).toBe(0);
    expect(result?.avg).toBe(0);
  });

  it('returns null for output with no parseable target line', () => {
    expect(parseFpingOutput('')).toBeNull();
    expect(parseFpingOutput('some unrelated fping error\n')).toBeNull();
  });

  it('returns null when the line is a non-numeric error message', () => {
    expect(parseFpingOutput('badhost : Name or service not known\n')).toBeNull();
  });
});
