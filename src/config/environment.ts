// Environment & Runtime Mode Abstraction for CAREGRAPH
// Explicitly distinguishes DEMO MODE (synthetic in-memory architecture) from PRODUCTION MODE.
// Prevents accidental data mixing and controls visibility of demo banners and providers.

export type CareGraphMode = 'demo' | 'production';

export interface AppConfig {
  mode: CareGraphMode;
  isDemo: boolean;
  isProduction: boolean;
  apiBaseUrl: string;
  authProvider: 'demo' | 'oidc';
  showDemoBanner: boolean;
  sessionTimeoutMinutes: number;
}

// Safely access environment variables with production-ready defaults
const envMode = (import.meta.env?.VITE_CAREGRAPH_MODE as CareGraphMode) || 'demo';

export const config: AppConfig = {
  mode: envMode,
  isDemo: envMode === 'demo',
  isProduction: envMode === 'production',
  apiBaseUrl: import.meta.env?.VITE_API_BASE_URL || '/api',
  authProvider: (import.meta.env?.VITE_AUTH_PROVIDER as 'demo' | 'oidc') || 'demo',
  showDemoBanner: envMode === 'demo',
  sessionTimeoutMinutes: Number(import.meta.env?.VITE_SESSION_TIMEOUT_MINUTES) || 30,
};
