const fs = require('fs');
fs.writeFileSync('dist/_redirects', '/* /index.html 200\n');
console.log('[post-build] dist/_redirects written');
