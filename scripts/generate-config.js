#!/usr/bin/env node

const { loadEnv, createDirectories, processTemplate } = require('./utils');

// Main function
function main() {
  console.log('======================================');
  console.log('Nginx Configuration Generator');
  console.log('======================================\n');
  
  const env = loadEnv();
  
  // Define required environment variables
  const requiredVars = [
    'DOMAIN',
    'LETSENCRYPT_EMAIL',
    'FRONTEND_SERVICE_NAME',
    'FRONTEND_PORT',
    'FRONTEND_PATH',
    'BACKEND_SERVICE_NAME',
    'BACKEND_PORT',
    'BACKEND_PATH',
    'NGINX_WORKER_PROCESSES',
    'NGINX_WORKER_CONNECTIONS',
    'CLIENT_MAX_BODY_SIZE',
    'ACCESS_LOG',
    'ERROR_LOG',
    'FRPS_BIND_PORT',
    'FRPS_DASHBOARD_PORT',
    'FRPS_DASHBOARD_PATH',
    'FRPS_DASHBOARD_USER',
    'FRPS_DASHBOARD_PWD',
    'FRPS_TOKEN',
    'FRPS_VHOST_HTTP_PORT',
    'FRPS_VHOST_HTTPS_PORT'
  ];
  
  // Validate all required variables
  const missingVars = requiredVars.filter(varName => !env[varName]);
  if (missingVars.length > 0) {
    console.error('Error: Missing required environment variables in .env:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease copy .env.example to .env and configure all required variables.');
    process.exit(1);
  }
  
  console.log('Configuration:');
  console.log(`  Domain: ${env.DOMAIN}`);
  console.log(`  Email: ${env.LETSENCRYPT_EMAIL}`);
  console.log(`  Frontend: ${env.FRONTEND_SERVICE_NAME}:${env.FRONTEND_PORT} at ${env.FRONTEND_PATH}`);
  console.log(`  Backend: ${env.BACKEND_SERVICE_NAME}:${env.BACKEND_PORT} at ${env.BACKEND_PATH}`);
  console.log();
  
  // Create directories
  createDirectories([
    'nginx/conf.d',
    'nginx/letsencrypt',
    'nginx/www/certbot',
    'nginx/logs',
    'frp'
  ]);
  console.log();
  
  const baseDir = require('path').join(__dirname, '..');
  
  // Generate nginx.conf
  processTemplate(
    require('path').join(baseDir, 'nginx/nginx.conf.template'),
    require('path').join(baseDir, 'nginx/nginx.conf'),
    {
      NGINX_WORKER_PROCESSES: env.NGINX_WORKER_PROCESSES,
      NGINX_WORKER_CONNECTIONS: env.NGINX_WORKER_CONNECTIONS,
      CLIENT_MAX_BODY_SIZE: env.CLIENT_MAX_BODY_SIZE,
      ACCESS_LOG: env.ACCESS_LOG,
      ERROR_LOG: env.ERROR_LOG
    }
  );
  
  // Generate domain config
  processTemplate(
    require('path').join(baseDir, 'nginx/conf.d/domain.conf.template'),
    require('path').join(baseDir, 'nginx/conf.d', `${env.DOMAIN}.conf`),
    {
      DOMAIN: env.DOMAIN,
      FRONTEND_SERVICE_NAME: env.FRONTEND_SERVICE_NAME,
      FRONTEND_PORT: env.FRONTEND_PORT,
      FRONTEND_PATH: env.FRONTEND_PATH,
      BACKEND_SERVICE_NAME: env.BACKEND_SERVICE_NAME,
      BACKEND_PORT: env.BACKEND_PORT,
      BACKEND_PATH: env.BACKEND_PATH,
      FRPS_DASHBOARD_PORT: env.FRPS_DASHBOARD_PORT,
      FRPS_DASHBOARD_PATH: env.FRPS_DASHBOARD_PATH
    }
  );

  // Generate frps config
  processTemplate(
    require('path').join(baseDir, 'frp/frps.toml.template'),
    require('path').join(baseDir, 'frp/frps.toml'),
    {
      FRPS_BIND_PORT: env.FRPS_BIND_PORT,
      FRPS_DASHBOARD_PORT: env.FRPS_DASHBOARD_PORT,
      FRPS_DASHBOARD_USER: env.FRPS_DASHBOARD_USER,
      FRPS_DASHBOARD_PWD: env.FRPS_DASHBOARD_PWD,
      FRPS_TOKEN: env.FRPS_TOKEN,
      FRPS_VHOST_HTTP_PORT: env.FRPS_VHOST_HTTP_PORT,
      FRPS_VHOST_HTTPS_PORT: env.FRPS_VHOST_HTTPS_PORT
    }
  );

  console.log('\n✓ Configuration generated successfully!');
}

main();
