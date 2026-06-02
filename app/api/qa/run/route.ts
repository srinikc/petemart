import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const selectedTypes: string[] = body.types || [];
    const env: string = body.env || 'sandbox';
    const tier: string = body.tier || '';

    const root = path.join(process.cwd());
    const configPath = path.join(root, 'qa-dashboard', 'test-run-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const buildLabel = body.buildLabel || `manual-${Date.now()}`;
    const triggeredBy = body.triggeredBy || 'qa-dashboard';

    let typeArg: string;
    if (tier && config.tiers?.[tier]) {
      typeArg = config.tiers[tier].testTypes.join(',');
    } else if (selectedTypes.length === 0) {
      return NextResponse.json({ error: 'No test types or tier specified' }, { status: 400 });
    } else {
      typeArg = selectedTypes.join(',');
    }

    const envConfig = config.environments[env];
    if (!envConfig) {
      return NextResponse.json({ error: `Unknown environment: ${env}` }, { status: 400 });
    }

    const enabled = envConfig.testTypes;
    for (const key of Object.keys(enabled)) {
      enabled[key].enabled = (tier && config.tiers?.[tier])
        ? config.tiers[tier].testTypes.includes(key)
        : selectedTypes.includes(key);
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    const cmd = `node scripts/run-tests.js --env=${env} --type=${typeArg}`;

    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 600000,
      cwd: root,
      env: { ...process.env, CI: env === 'ci' ? 'true' : 'false' },
      stdio: 'pipe',
    });

    return NextResponse.json({
      success: true,
      output: output,
      selectedTypes: typeArg.split(','),
      env,
      tier: tier || 'custom',
      buildLabel,
      triggeredBy,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Unknown error',
      output: err.stdout || '',
      stderr: err.stderr || '',
    }, { status: 500 });
  }
}
