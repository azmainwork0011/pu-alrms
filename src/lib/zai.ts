import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Load z-ai-web-dev-sdk config and merge X-Token from the incoming gateway request.
 * The gateway forwards X-Token header which is required by the AI backend.
 */
async function loadBaseConfig() {
  const homeDir = os.homedir();
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(homeDir, '.z-ai-config'),
    '/etc/.z-ai-config',
  ];
  for (const filePath of configPaths) {
    try {
      const configStr = await fs.readFile(filePath, 'utf-8');
      const config = JSON.parse(configStr);
      if (config.baseUrl && config.apiKey) {
        return config;
      }
    } catch {}
  }
  throw new Error('z-ai-web-dev-sdk config not found');
}

let cachedConfig: any = null;

export async function createZAI(req: NextRequest) {
  // Cache base config to avoid reading file on every request
  if (!cachedConfig) {
    cachedConfig = await loadBaseConfig();
  }

  // Forward X-Token from gateway request if present
  const xToken = req.headers.get('x-token');
  const config = { ...cachedConfig };
  if (xToken) {
    config.token = xToken;
  }

  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  return new ZAI(config);
}
