/**
 * Common utilities for Nginx Gateway scripts
 */

const fs = require('fs');
const path = require('path');
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
 * Detect docker-compose command (supports both v1 and v2)
 * @returns {string} docker-compose or docker compose
 */
function getDockerCompose() {
  try {
    execSync('docker compose version', { stdio: 'ignore' });
    return 'docker compose';
  } catch {
    return 'docker-compose';
  }
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
 * Check if SSL certificate exists for domain
 * @param {string} domain - Domain name
 * @returns {boolean}
 */
function hasCertificate(domain) {
  const certPath = path.join(__dirname, '..', 'nginx', 'letsencrypt', 'live', domain);
  return fs.existsSync(certPath);
}

module.exports = {
  loadEnv,
  getDockerCompose,
  createDirectories,
  processTemplate,
  execCommand,
  hasCertificate
};
