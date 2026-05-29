#!/usr/bin/env node

const { loadEnv, getDockerCompose, execCommand } = require('./utils');

// Main function
function main() {
  const args = process.argv.slice(2);
  const env = loadEnv();
  
  const domain = args[0] || env.DOMAIN;
  
  const dockerCompose = getDockerCompose();
  
  console.log(`Renewing certificate for ${domain}...`);
  
  try {
    // Run certbot to renew certificate
    execCommand(
      `${dockerCompose} run --rm certbot renew ` +
      `--webroot --webroot-path /var/www/certbot --quiet`
    );
    
    // Reload nginx
    try {
      execCommand(`${dockerCompose} exec nginx-gateway nginx -s reload`);
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
