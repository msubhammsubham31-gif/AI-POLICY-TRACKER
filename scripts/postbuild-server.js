const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const serverDist = path.join(__dirname, '..', 'server', 'dist');
const rootDist = path.join(__dirname, '..', 'dist');
const clientServerDist = path.join(__dirname, '..', 'client', 'server', 'dist');

console.log('[postbuild-server] Copying compiled server to all deployment entrypoints...');

// 1. Copy to root dist/
if (fs.existsSync(serverDist)) {
  copyDirRecursive(serverDist, rootDist);
  console.log('✓ Synced to root dist/');
}

// 2. Copy to client/server/dist/ (for Render if Root Directory is "client")
if (fs.existsSync(serverDist)) {
  copyDirRecursive(serverDist, clientServerDist);
  // Ensure CommonJS mode in client subdirectory
  fs.writeFileSync(
    path.join(clientServerDist, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2),
    'utf8'
  );
  console.log('✓ Synced to client/server/dist/');
}

console.log('[postbuild-server] All deployment target directories populated successfully.');
