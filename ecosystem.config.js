const path = require('path');
const base = __dirname;

module.exports = {
  apps: [
    {
      name: 'evolution-api',
      script: path.join(base, 'evolution', 'dist', 'main.js'),
      cwd: path.join(base, 'evolution'),
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ubifacturas',
      script: path.join(base, 'src', 'index.js'),
      cwd: base,
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
