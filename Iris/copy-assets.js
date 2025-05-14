import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// Copy non-TypeScript files from src to dist
console.log('Copying non-TypeScript files to dist...');

function copyNonTsFiles(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  walkDir(srcDir, function(filePath) {
    const relativePath = path.relative(srcDir, filePath);
    const destPath = path.join(destDir, relativePath);
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Skip TypeScript files as they are compiled by tsc
    if (fileExt !== '.ts' && fileExt !== '.tsx') {
      const destFolder = path.dirname(destPath);
      
      if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
      }
      
      fs.copyFileSync(filePath, destPath);
      console.log(`Copied: ${relativePath}`);
    }
  });
}

copyNonTsFiles('./src', './dist');