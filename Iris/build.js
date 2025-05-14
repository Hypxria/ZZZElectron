import fs from 'fs'
import path from 'path'

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// Process all JS files in the dist directory
walkDir('./dist', function(filePath) {
  if (path.extname(filePath) === '.js') {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace .ts imports with .js
    let newContent = content.replace(/from\s+['"](.+)\.ts['"]/g, 'from "$1.js"');
    newContent = newContent.replace(/import\s+['"](.+)\.ts['"]/g, 'import "$1.js"');
    
    // Also handle .tsx imports
    newContent = newContent.replace(/from\s+['"](.+)\.tsx['"]/g, 'from "$1.js"');
    newContent = newContent.replace(/import\s+['"](.+)\.tsx['"]/g, 'import "$1.js"');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed imports in ${filePath}`);
    }
  }
});
