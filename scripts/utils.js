/**
 * Common utilities for Nginx Gateway scripts
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

/**
 * Load environment variables from .env file
 * @returns {Object} Environment variables
 */
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env not found');
    console.error('Please copy .env.example to .env and configure it first.');
    process.exit(1);
  }
  
  const env = {};
  const content = fs.readFileSync(envPath, 'utf8');
  // Handle both CRLF (Windows) and LF (Unix) line endings
  content.split(/\r?\n/).forEach(line => {
    // Skip empty lines and comments
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  return env;
}

/**
 * Create directories if they don't exist
 * @param {string[]} dirs - Array of directory paths relative to project root
 */
function createDirectories(dirs) {
  const baseDir = path.join(__dirname, '..');
  dirs.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  });
}

/**
 * Process template file and replace variables
 * @param {string} templatePath - Path to template file
 * @param {string} outputPath - Path to output file
 * @param {Object} variables - Variables to replace
 */
function processTemplate(templatePath, outputPath, variables) {
  if (!fs.existsSync(templatePath)) {
    console.log(`⊘ Template not found: ${path.basename(templatePath)}`);
    return;
  }

  if (fs.existsSync(outputPath)) {
    console.log(`⊘ Skip (already exists): ${path.relative(path.join(__dirname, '..'), outputPath)}`);
    return;
  }

  let content = fs.readFileSync(templatePath, 'utf8');

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    content = content.replace(regex, value);
  });

  // Ensure Unix-style line endings (LF) for compatibility with Linux containers
  content = content.replace(/\r\n/g, '\n');

  fs.writeFileSync(outputPath, content);
  console.log(`✓ Generated: ${path.relative(path.join(__dirname, '..'), outputPath)}`);
}

/**
 * Execute shell command with inherited stdio
 * @param {string} command - Command to execute
 * @param {boolean} silent - If true, suppress output
 */
function execCommand(command, silent = false) {
  const options = silent ? { stdio: 'pipe' } : { stdio: 'inherit' };
  return execSync(command, options);
}

/**
 * Check if a valid SSL certificate exists for the domain and its wildcard.
 * The certificate must contain both domain and *.domain in the Subject Alternative Name (SAN).
 * @param {string} domain - Domain name (e.g., example.com)
 * @returns {boolean} - True if the certificate file exists and covers both domain and *.domain
 */
function hasCertificate(domain) {
  // Path to the fullchain.pem file
  const certFilePath = path.join(__dirname, '..', 'nginx', 'letsencrypt', 'live', domain, 'fullchain.pem');

  // If the certificate file does not exist, definitely no valid certificate
  if (!fs.existsSync(certFilePath)) {
    return false;
  }

  try {
    // Use openssl to extract the Subject Alternative Name (SAN) section
    const output = execSync(
      `openssl x509 -in "${certFilePath}" -noout -ext subjectAltName`,
      { encoding: 'utf8' }
    );

    // Check if both the root domain and wildcard domain are present
    const hasRoot = output.includes(`DNS:${domain}`);
    const hasWildcard = output.includes(`DNS:*.${domain}`);

    // Only consider the certificate valid if it covers both
    return hasRoot && hasWildcard;
  } catch (error) {
    // If openssl fails (e.g., corrupt file), treat as no valid certificate
    console.error(`Error reading certificate for ${domain}:`, error.message);
    return false;
  }
}

/**
 * Compute MD5 hash of a string
 * @param {string} str
 * @returns {string} hex digest
 */
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

module.exports = {
  loadEnv,
  createDirectories,
  processTemplate,
  execCommand,
  hasCertificate,
  md5
};
