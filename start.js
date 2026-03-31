const { spawn } = require('child_process');
const path = require('path');

// Variables para Evolution API tomadas del entorno de Railway
// Evolution API usa puerto fijo 8081 para no interferir con el PORT de Railway
const evolutionEnv = {
  ...process.env,
  PORT: '8081',
  SERVER_PORT: '8081',
  SERVER_URL: 'http://localhost:8081',
  DATABASE_PROVIDER: 'postgresql',
  DATABASE_CONNECTION_URI: process.env.DATABASE_CONNECTION_URI,
  AUTHENTICATION_API_KEY: process.env.EVOLUTION_API_KEY,
  CACHE_REDIS_ENABLED: 'false',
  CACHE_REDIS_URI: '',
  LOG_LEVEL: 'ERROR,WARN,INFO,LOG',
  DEL_INSTANCE: 'false',
  LANGUAGE: 'pt-BR',
};

// El servidor Node usa el PORT de Railway
process.env.EVOLUTION_API_URL = 'http://localhost:8081';

// Arrancar Evolution API
console.log('[start] Iniciando Evolution API...');
const evolution = spawn('node', ['dist/main.js'], {
  cwd: path.join(__dirname, 'evolution'),
  env: evolutionEnv,
  stdio: 'inherit',
});

evolution.on('exit', (code) => {
  console.error('[start] Evolution API se cerro con codigo:', code);
  process.exit(code);
});

// Esperar 6 segundos y arrancar el servidor Node
setTimeout(() => {
  console.log('[start] Iniciando servidor Node...');
  const app = spawn('node', ['src/index.js'], {
    cwd: __dirname,
    env: process.env,
    stdio: 'inherit',
  });

  app.on('exit', (code) => {
    console.error('[start] Servidor Node se cerro con codigo:', code);
    process.exit(code);
  });
}, 6000);
