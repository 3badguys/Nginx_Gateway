# Scripts

Cross-platform Node.js scripts for managing Nginx Gateway.

## Usage

All scripts work on Windows, macOS, and Linux without any modification.

### Generate Configuration
```bash
npm run config:generate
```

### Get SSL Certificate
```bash
npm run ssl:get your-domain.com your-email@example.com
```

### Renew SSL Certificate
```bash
npm run ssl:renew [your-domain.com]
```

### Quick Start
```bash
npm start
```

## Migration from Shell Scripts

Shell scripts (`.sh`) have been replaced with Node.js scripts (`.js`) for better cross-platform support.

**Before:**
```bash
./scripts/generate-config.sh
./scripts/get-ssl-cert.sh
```

**After:**
```bash
npm run config:generate
npm run ssl:get
```

Or use `npm start` for the complete deployment workflow.
