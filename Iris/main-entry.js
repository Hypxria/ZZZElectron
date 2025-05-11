// Dynamic entry point for Electron app
import { join } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Check if x64 path exists, otherwise use default path
const x64Path = join(__dirname, '.webpack', 'x64', 'main.js');
const defaultPath = join(__dirname, '.webpack', 'main.js');

// Dynamically determine which path to use
const entryPath = existsSync(x64Path) ? x64Path : defaultPath;

// Convert to proper file URL format for ESM imports
const fileUrl = new URL(`file://${entryPath.replace(/\\/g, '/')}`);

// Import and run the actual app
import(fileUrl).catch(err => {
  console.error('Failed to load application:', err);
  process.exit(1);
});