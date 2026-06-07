import { describe, it, expect } from 'vitest';
import { formatEgldBalance } from './mvx';

describe('mvx service', () => {
  it('formats EGLD balance correctly', () => {
    expect(formatEgldBalance('1000000000000000000')).toBe('1.000000');
    expect(formatEgldBalance(0)).toBe('0.000000');
    expect(formatEgldBalance(undefined)).toBe('0');
  });

  it('handles edge cases', () => {
    expect(formatEgldBalance('0')).toBe('0.000000');
    expect(formatEgldBalance('999999999999999999')).toContain('0.999999');
  });
});
