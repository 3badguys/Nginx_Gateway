#!/usr/bin/env node

const { loadEnv, execCommand } = require('./utils');

// Main function
function main() {
  const args = process.argv.slice(2);
  const env = loadEnv();
  
  const domain = args[0] || env.DOMAIN;
  
  console.log(`Renewing certificate for ${domain}...`);
  
  try {
    // Run certbot to renew certificate
    // --entrypoint certbot overrides the renewal-loop entrypoint defined in
    // docker-compose.yml, so the renew command actually runs.
    // webroot mode works here because nginx is already running on port 80.
    execCommand(
      `docker compose run --rm --entrypoint certbot certbot renew ` +
      `--webroot --webroot-path /var/www/certbot --quiet`
    );
    
    // Reload nginx
    try {
      execCommand(`docker compose exec nginx-gateway nginx -s reload`);
    } catch {
      // Ignore reload errors
    }
    
    console.log('✓ Certificate renewed');
  } catch (error) {
    console.error('✗ Failed to renew certificate');
    console.error(error.message);
    process.exit(1);
  }
}

main();
