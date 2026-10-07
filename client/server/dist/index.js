// Forwarder bridge in case Render Root Directory is configured to "client"
const path = require('path');
const fs = require('fs');
const rootTarget = path.resolve(__dirname, '../../../server/dist/index.js');
if (fs.existsSync(rootTarget)) {
  require(rootTarget);
} else {
  console.error("Target server file not found at:", rootTarget);
  process.exit(1);
}
