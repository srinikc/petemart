// =============================================================================
// ProductForge — Platform configuration helper
// Reads config/platform.config.json and applies NEXT_PUBLIC_<PREFIX>_* env overrides.
// Works on both server and client (Next.js).
// =============================================================================

import rawPlatformConfig from '../../../config/platform.config.json';

export type PlatformConfig = {
  appName: string;
  appTagline: string;
  appSlug: string;
  codeKey: string;
  envPrefix: string;
  consoleTitle: string;
  consoleSubtitle: string;
  projectId: string;
  projectName: string;
  projectDescription: string;
  supportEmail: string;
  ports: {
    frameworkConsole: number;
    product: number;
    qaDashboard: number;
  };
};

const BASE: PlatformConfig = rawPlatformConfig as PlatformConfig;

function envKey(prefix: string, key: string): string {
  return `NEXT_PUBLIC_${prefix}_${key}`.toUpperCase();
}

function readEnvOverrides(cfg: PlatformConfig): PlatformConfig {
  const prefix = cfg.envPrefix;
  const next: PlatformConfig = { ...cfg, ports: { ...cfg.ports } };
  const overrides: Record<string, keyof PlatformConfig> = {
    APP_NAME: 'appName',
    APP_TAGLINE: 'appTagline',
    APP_SLUG: 'appSlug',
    CODE_KEY: 'codeKey',
    CONSOLE_TITLE: 'consoleTitle',
    CONSOLE_SUBTITLE: 'consoleSubtitle',
    PROJECT_ID: 'projectId',
    PROJECT_NAME: 'projectName',
    PROJECT_DESCRIPTION: 'projectDescription',
    SUPPORT_EMAIL: 'supportEmail',
  };
  for (const [env, field] of Object.entries(overrides)) {
    const val = process.env[envKey(prefix, env)];
    if (val) (next as Record<string, unknown>)[field] = val;
  }
  return next;
}

export function getPlatformConfig(): PlatformConfig {
  return readEnvOverrides(BASE);
}

export function platformConfig(): PlatformConfig {
  return getPlatformConfig();
}

export function getAppName(): string {
  return getPlatformConfig().appName;
}

export function getAppTagline(): string {
  return getPlatformConfig().appTagline;
}