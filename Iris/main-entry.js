// main-entry.js
// This file serves as a custom entry point for Electron
import { app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Construct the path to the webpack output
const mainPath = path.join(process.cwd(), '.webpack', 'main', 'main.js');

// Import the actual main.js file from webpack output
import(mainPath)
  .catch((err) => {
    console.error('Failed to load main module:', err);
    app.quit();
  });