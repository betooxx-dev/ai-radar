const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const { getConfig } = require('./config');

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  realtime: { transport: WebSocket },
};

function createReadClient() {
  const config = getConfig({ requirePublishable: true });
  return createClient(config.supabaseUrl, config.publishableKey, clientOptions);
}

function createWriteClient() {
  const config = getConfig({ requireSecret: true });
  return createClient(config.supabaseUrl, config.secretKey, clientOptions);
}

module.exports = { createReadClient, createWriteClient };
