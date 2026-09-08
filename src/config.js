class ConfigError extends Error {
  constructor(missing) {
    super(`Faltan variables de entorno: ${missing.join(', ')}`);
    this.name = 'ConfigError';
    this.missing = missing;
  }
}

function getConfig(options = {}) {
  const required = ['SUPABASE_URL'];
  if (options.requirePublishable) required.push('SUPABASE_PUBLISHABLE_KEY');
  if (options.requireSecret) required.push('SUPABASE_SECRET_KEY');

  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) throw new ConfigError(missing);

  return {
    appEnv: process.env.APP_ENV || 'development',
    projectRef: process.env.SUPABASE_PROJECT_REF || null,
    supabaseUrl: process.env.SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || null,
    secretKey: process.env.SUPABASE_SECRET_KEY || null,
    cronSecret: process.env.CRON_SECRET || null,
    operatorApiToken: process.env.OPERATOR_API_TOKEN || null,
  };
}

module.exports = { ConfigError, getConfig };
