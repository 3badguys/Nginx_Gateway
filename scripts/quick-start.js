#!/usr/bin/env node

const { loadEnv, getDockerCompose, createDirectories, hasCertificate, execCommand } = require('./utils');
const path = require('path');

// Main function
function main() {
  console.log('Starting Nginx Gateway deployment...\n');
  
  const env = loadEnv();
  const dockerCompose = getDockerCompose();
  
  // Create directories
  createDirectories(['nginx/letsencrypt', 'nginx/www/certbot', 'nginx/logs']);
  
  // Check certificate
  if (!hasCertificate(env.DOMAIN)) {
    console.log('Certificate not found. Run: npm run ssl:get\n');
    
    // Ask user if they want to get certificate now
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Get certificate now? (y/n) ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'y') {
        try {
          execCommand(`node ${path.join(__dirname, 'get-ssl-cert.js')} "${env.DOMAIN}" "${env.LETSENCRYPT_EMAIL}"`);
        } catch (error) {
          console.error('\nFailed to get certificate. Please try manually.');
          process.exit(1);
        }
      }
      
      startServices();
    });
  } else {
    startServices();
  }
  
  function startServices() {
    console.log('\nStarting services...');
    try {
      execCommand(`${dockerCompose} up -d`);
      
      // Wait a bit for services to start
      setTimeout(() => {
        try {
          execCommand(`${dockerCompose} ps`);
          
          console.log('\n✓ Deployment complete!');
          console.log(`\nAccess your application:`);
          console.log(`  HTTPS: https://${env.DOMAIN}${env.FRONTEND_PATH}`);
          console.log(`  HTTP: http://${env.DOMAIN}${env.FRONTEND_PATH} (redirects to HTTPS)`);
        } catch (error) {
          console.error('\n✗ Failed to verify deployment');
        }
      }, 3000);
    } catch (error) {
      console.error('\n✗ Failed to start services');
      console.error(error.message);
      process.exit(1);
    }
  }
}

main();
