import { describe, it, expect } from 'vitest';
import { config } from '@/config/environment';

describe('CAREGRAPH Environment Configuration', () => {
  it('defaults to demo mode in current environment', () => {
    expect(config.mode).toBe('demo');
    expect(config.isDemo).toBe(true);
    expect(config.isProduction).toBe(false);
  });

  it('displays demo banner in demo mode', () => {
    expect(config.showDemoBanner).toBe(true);
  });

  it('has 30-minute default session timeout', () => {
    expect(config.sessionTimeoutMinutes).toBe(30);
  });

  it('configures demo auth provider by default', () => {
    expect(config.authProvider).toBe('demo');
  });
});
