// Validates env once at startup and reports every problem together. Values are never printed.
export interface Config {
  env: 'development' | 'production' | 'test';
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const problems: string[] = [];
  const pick = <T extends string>(name: string, allowed: readonly T[], fallback: T): T => {
    const v = env[name] || fallback;
    if (!allowed.includes(v as T)) problems.push(`${name} must be one of: ${allowed.join(', ')}`);
    return v as T;
  };
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) problems.push('PORT must be an integer between 1 and 65535');
  const config: Config = {
    env: pick('NODE_ENV', ['development', 'production', 'test'], 'development'),
    port,
    logLevel: pick('LOG_LEVEL', ['debug', 'info', 'warn', 'error'], 'info'),
  };
  if (problems.length) throw new Error(`Invalid environment:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  return config;
}
