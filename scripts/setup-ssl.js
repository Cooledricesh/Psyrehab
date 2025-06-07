#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

/**
 * Setup SSL certificates for development
 */
const setupSSL = () => {
  console.log('🔒 Setting up SSL certificates for development...');

  // Create certs directory if it doesn't exist
  const certsDir = path.join(process.cwd(), 'certs');
  if (!existsSync(certsDir)) {
    mkdirSync(certsDir, { recursive: true });
    console.log('📁 Created certs directory');
  }

  // Check if mkcert is installed (try brew version first, then npm version)
  let mkcertCmd = 'mkcert';
  try {
    execSync('/opt/homebrew/bin/mkcert -version', { stdio: 'pipe' });
    mkcertCmd = '/opt/homebrew/bin/mkcert';
    console.log('✅ mkcert (brew) is installed');
  } catch (error) {
    try {
      execSync('which mkcert', { stdio: 'pipe' });
      console.log('✅ mkcert is available in PATH');
    } catch (whichError) {
      console.log('📦 Installing mkcert using brew...');
      try {
        execSync('brew install mkcert', { stdio: 'inherit' });
        mkcertCmd = '/opt/homebrew/bin/mkcert';
      } catch (installError) {
        console.error('❌ Failed to install mkcert. Please install it manually:');
        console.error('   brew install mkcert');
        console.error('   or visit: https://github.com/FiloSottile/mkcert');
        process.exit(1);
      }
    }
  }

  // Install mkcert CA if not already done
  try {
    console.log('🔐 Installing local CA...');
    execSync(`${mkcertCmd} -install`, { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️  Could not install CA. Certificates may not be trusted.');
  }

  // Generate certificates
  const certPath = path.join(certsDir, 'localhost.pem');
  const keyPath = path.join(certsDir, 'localhost-key.pem');

  if (existsSync(certPath) && existsSync(keyPath)) {
    console.log('✅ SSL certificates already exist');
  } else {
    try {
      console.log('🔑 Generating SSL certificates...');
      execSync(`${mkcertCmd} -cert-file ${certPath} -key-file ${keyPath} localhost 127.0.0.1 ::1`, {
        stdio: 'inherit',
        cwd: certsDir
      });
      console.log('✅ SSL certificates generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate SSL certificates:', error.message);
      process.exit(1);
    }
  }

  // Update .env.local with certificate paths
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = `
# SSL Certificate paths for development
VITE_SSL_CERT=${certPath}
VITE_SSL_KEY=${keyPath}
EXPRESS_SSL_CERT=${certPath}
EXPRESS_SSL_KEY=${keyPath}
`;

  try {
    let existingEnv = '';
    if (existsSync(envPath)) {
      existingEnv = readFileSync(envPath, 'utf8');
    }

    // Remove existing SSL entries
    const cleanedEnv = existingEnv
      .split('\n')
      .filter(line => !line.startsWith('VITE_SSL_') && !line.startsWith('EXPRESS_SSL_'))
      .join('\n');

    // Append new SSL configuration
    writeFileSync(envPath, cleanedEnv + envContent);
    console.log('✅ Updated .env.local with SSL certificate paths');
  } catch (error) {
    console.error('❌ Failed to update .env.local:', error.message);
    console.log('📝 Please manually add these lines to your .env.local:');
    console.log(envContent);
  }

  console.log('🎉 SSL setup complete!');
  console.log('📋 Next steps:');
  console.log('   1. Restart your development server');
  console.log('   2. Access your app at https://localhost:5173');
  console.log('   3. Access your API at https://localhost:3001');
};

// Check if running as script
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSSL();
}

export default setupSSL; 