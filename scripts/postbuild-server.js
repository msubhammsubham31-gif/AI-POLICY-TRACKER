const fs = require('fs');
const path = require('path');

// 1. Ensure root dist/index.js points to server/dist/index.js
const rootDist = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(rootDist)) {
  fs.mkdirSync(rootDist, { recursive: true });
}

fs.writeFileSync(
  path.join(rootDist, 'index.js'),
  `// Root entrypoint forwarding to server/dist/index.js\nrequire('../server/dist/index.js');\n`,
  'utf8'
);

// 2. Ensure client/server/dist/index.js exists as a forwarder bridge in case Render rootDir is set to "client"
const clientServerDist = path.join(__dirname, '..', 'client', 'server', 'dist');
if (!fs.existsSync(clientServerDist)) {
  fs.mkdirSync(clientServerDist, { recursive: true });
}

// Mark client/server/dist as CommonJS so it can require server files
fs.writeFileSync(
  path.join(clientServerDist, 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2),
  'utf8'
);

fs.writeFileSync(
  path.join(clientServerDist, 'index.js'),
  `// Forwarder bridge in case Render Root Directory is configured to "client"\nconst path = require('path');\nconst fs = require('fs');\nconst rootTarget = path.resolve(__dirname, '../../../server/dist/index.js');\nif (fs.existsSync(rootTarget)) {\n  require(rootTarget);\n} else {\n  console.error("Target server file not found at:", rootTarget);\n  process.exit(1);\n}\n`,
  'utf8'
);

console.log('[postbuild-server] Created root dist/index.js and client/server/dist/index.js bridge successfully.');
