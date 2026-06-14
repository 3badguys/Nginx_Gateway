#!/usr/bin/env node

const { loadEnv, execCommand } = require('./utils');

function main() {
  const env = loadEnv();
  const domain = process.argv[2] || env.DOMAIN;
  const provider = env.DNS_PROVIDER || 'west_cn';

  console.log(`Renewing certificate for ${domain}...`);

  try {
    // acme.sh daemon auto-renews via cron; this is the manual fallback
    execCommand(`docker compose run --rm -T acme --renew-all --dns dns_${provider}`);
    execCommand(`docker compose exec -T nginx-gateway nginx -s reload`);

    console.log('✓ Certificate renewed');
  } catch (error) {
    console.error('✗ Failed to renew certificate');
    console.error(error.message);
    process.exit(1);
  }
}

main();
