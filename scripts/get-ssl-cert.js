#!/usr/bin/env node

const { loadEnv, execCommand, hasCertificate } = require('./utils');

// Main function
function main() {
  const args = process.argv.slice(2);
  const env = loadEnv();
  
  const domain = args[0] || env.DOMAIN;
  const email = args[1] || env.LETSENCRYPT_EMAIL;

  // Skip if certificate already exists
  if (hasCertificate(domain)) {
    console.log(`Certificate for ${domain} already exists, skipping.`);
    return;
  }

  console.log(`Getting certificate for ${domain}...`);
  
  try {
    // Stop nginx-gateway to free port 80
    console.log('Stopping nginx-gateway...');
    execCommand(`docker compose down nginx-gateway`);
    
    // Run certbot to get certificate
    // Use --standalone: certbot runs its own temporary web server on port 80,
    // which avoids the deadlock of needing nginx running for --webroot mode.
    console.log('Running Certbot...');
    // --entrypoint certbot overrides the renewal-loop entrypoint defined in
    // docker-compose.yml, so certonly actually runs instead of the loop.
    execCommand(
      `docker compose run --rm -p 80:80 --entrypoint certbot certbot certonly ` +
      `--standalone -d "${domain}" --email "${email}" --agree-tos --no-eff-email ` +
      `--force-renewal --keep-until-expiring`
    );
    
    // Restart nginx-gateway
    console.log('Starting nginx-gateway...');
    execCommand(`docker compose up -d nginx-gateway`);
    
    console.log('\n✓ Certificate acquired');
  } catch (error) {
    console.error('\n✗ Failed to acquire certificate');
    console.error(error.message);
    process.exit(1);
  }
}

main();
