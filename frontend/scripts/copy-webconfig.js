const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'public', 'web.config');
const destDir = path.join(root, 'dist');
const dest = path.join(destDir, 'web.config');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(src)) {
  fail(`web.config not found at ${src}. Please ensure frontend/public/web.config exists.`);
}

if (!fs.existsSync(destDir)) {
  fail(`dist directory not found at ${destDir}. Did the build succeed?`);
}

try {
  fs.copyFileSync(src, dest);
  console.log(`Copied web.config to ${dest}`);
  process.exit(0);
} catch (err) {
  fail(`Failed to copy web.config: ${err.message}`);
}
