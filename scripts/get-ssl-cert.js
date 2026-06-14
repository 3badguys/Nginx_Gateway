#!/usr/bin/env node

const { loadEnv, execCommand, hasCertificate } = require('./utils');

function main() {
  const args = process.argv.slice(2);
  const env = loadEnv();

  const domain = args[0] || env.DOMAIN;
  const email = args[1] || env.LETSENCRYPT_EMAIL;
  const provider = env.DNS_PROVIDER || 'west_cn';

  if (!env.DNS_API_USER || !env.DNS_API_KEY) {
    console.error('Error: DNS_API_USER and DNS_API_KEY must be set in .env');
    process.exit(1);
  }

  // Skip if certificate already exists
  if (hasCertificate(domain)) {
    console.log(`Certificate for ${domain} already exists, skipping.`);
    return;
  }

  console.log(`Getting certificate for ${domain} + *.${domain}...`);

  try {
    // Ensure acme daemon is running
    execCommand(`docker compose up -d acme`);

    // Issue certificate via DNS-01 challenge (provider mapped by entrypoint wrapper)
    console.log(`Issuing certificate (DNS-01 challenge via ${provider})...`);
    execCommand(
      `docker compose run --rm -T acme --issue ` +
      `--dns dns_${provider} ` +
      `-d "${domain}" -d "*.${domain}" ` +
      `--server letsencrypt ` +
      `--email "${email}"`
    );

    // Install cert to nginx path
    console.log('Installing certificate...');
    execCommand(
      `docker compose run --rm -T acme --install-cert -d "${domain}" ` +
      `--key-file /etc/letsencrypt/live/${domain}/privkey.pem ` +
      `--fullchain-file /etc/letsencrypt/live/${domain}/fullchain.pem`
    );

    // Reload nginx to pick up new cert
    execCommand(`docker compose exec -T nginx-gateway nginx -s reload`);

    console.log('\n✓ Certificate acquired');
    console.log(`  Domain: ${domain}`);
    console.log(`  Wildcard: *.${domain}`);
  } catch (error) {
    console.error('\n✗ Failed to acquire certificate');
    console.error(error.message);
    process.exit(1);
  }
}

main();
