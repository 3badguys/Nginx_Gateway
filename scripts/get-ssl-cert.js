#!/usr/bin/env node

const { loadEnv, getDockerCompose, execCommand } = require('./utils');

// Main function
function main() {
  const args = process.argv.slice(2);
  const env = loadEnv();
  
  const domain = args[0] || env.DOMAIN;
  const email = args[1] || env.LETSENCRYPT_EMAIL;
  
  const dockerCompose = getDockerCompose();
  
  console.log(`Getting certificate for ${domain}...`);
  
  try {
    // Stop nginx-gateway to free port 80
    console.log('Stopping nginx-gateway...');
    execCommand(`${dockerCompose} down nginx-gateway`);
    
    // Run certbot to get certificate
    console.log('Running Certbot...');
    execCommand(
      `${dockerCompose} run --rm certbot certonly --webroot ` +
      `--webroot-path /var/www/certbot ` +
      `-d "${domain}" --email "${email}" --agree-tos --no-eff-email ` +
      `--force-renewal --keep-until-expiring`
    );
    
    // Restart nginx-gateway
    console.log('Starting nginx-gateway...');
    execCommand(`${dockerCompose} up -d nginx-gateway`);
    
    console.log('\n✓ Certificate acquired');
  } catch (error) {
    console.error('\n✗ Failed to acquire certificate');
    console.error(error.message);
    process.exit(1);
  }
}

main();
