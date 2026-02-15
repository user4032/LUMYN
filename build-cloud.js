#!/usr/bin/env node

/**
 * Build script for cloud deployment
 * Skips electron-builder when NODE_ENV=production
 */

const { execSync } = require('child_process');

const isProduction = process.env.NODE_ENV === 'production';

console.log(`Building LUMYN (NODE_ENV: ${process.env.NODE_ENV})...`);

try {
  // TypeScript compilation
  console.log('\n[1/3] TypeScript compilation...');
  execSync('tsc', { stdio: 'inherit' });
  
  // Vite build
  console.log('\n[2/3] Vite production build...');
  execSync('vite build', { stdio: 'inherit' });
  
  // electron-builder (skip in production)
  if (!isProduction) {
    console.log('\n[3/3] Building Electron installers...');
    execSync('electron-builder', { stdio: 'inherit' });
  } else {
    console.log('\n[3/3] Skipping Electron build (production environment)');
  }
  
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
