module.exports = {
  apps: [
    {
      name: 'evolution-api',
      script: 'dist/main.js',
      cwd: 'C:/Users/USER/Documents/evolution-api-v2',
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ubifacturas',
      script: 'src/index.js',
      cwd: 'C:/Users/USER/Documents/UbicarFacturasApp',
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
