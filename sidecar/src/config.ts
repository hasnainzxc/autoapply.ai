import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SidecarConfig, ModeDefinition } from './types.js';

function loadModesFromCareerOps(careerOpsPath: string): ModeDefinition[] {
  const configPath = resolve(careerOpsPath, 'opencode.json');
  if (!existsSync(configPath)) {
    console.warn(`career-ops config not found at ${configPath}, using empty modes`);
    return [];
  }

  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const commands = parsed.command ?? {};

    const modes: ModeDefinition[] = [];

    for (const [key, val] of Object.entries(commands)) {
      if (!key.startsWith('career-ops-')) continue;

      const cmd = val as { description?: string };
      const modeName = key.replace('career-ops-', '');

      modes.push({
        id: key,
        name: modeName,
        command: key,
        description: cmd.description ?? '',
        inputSchema: {},
        outputType: 'string',
      });
    }

    return modes;
  } catch (err) {
    console.error('Failed to parse career-ops config:', err);
    return [];
  }
}

export function loadConfig(): SidecarConfig {
  const careerOpsPath =
    process.env.CAREER_OPS_PATH ??
    resolve(process.env.HOME ?? '/home/hairzee', 'prods/job_automation/career-ops');

  const modes = loadModesFromCareerOps(careerOpsPath);

  const config: SidecarConfig = {
    sidecarPort: parseInt(process.env.SIDECAR_PORT ?? '4197', 10),
    wsPort: parseInt(process.env.SIDECAR_WS_PORT ?? '4198', 10),
    wsSecret: process.env.SIDECAR_WS_SECRET ?? 'dev-secret',
    opencodeHost: process.env.OPENCODE_HOST ?? '127.0.0.1',
    opencodePort: parseInt(process.env.OPENCODE_PORT ?? '4196', 10),
    careerOpsPath,
    logLevel: process.env.LOG_LEVEL ?? 'info',
    modes,
  };

  console.log(`config: ${modes.length} career-ops modes loaded`);
  return config;
}
