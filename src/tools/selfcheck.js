/**
 * Small sanity checker so 'npm run lint' can catch obvious issues without eslint.
 */
const fs = require('fs');
const path = require('path');

function main() {
  const required = [
    'src/index.js',
    'src/discord/deploy-commands.js',
    'src/discord/client.js',
    'src/nitrado/client.js',
    '.env.example',
    'README.md'
  ];

  const missing = required.filter(p => !fs.existsSync(path.join(process.cwd(), p)));
  if (missing.length) {
    console.error('Missing required files:', missing);
    process.exit(1);
  }

  console.log('Selfcheck OK');
}

main();
