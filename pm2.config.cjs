module.exports = {
  apps: [
    {
      name: 'vk-bot',
      cwd: __dirname,
      script: 'npm',
      args: 'run start:prod',
      interpreter: 'none',
      watch: false,
      max_restarts: 10,
      autorestart: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};