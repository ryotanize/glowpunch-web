const fs = require('fs');
let code = fs.readFileSync('src/pages/index.astro', 'utf-8');
code = code.replace(/<span[^>]*>New Tool.*?<\/span>\n?/g, '');
code = code.replace(/<div class="mt-4 flex items-center[^>]*>\s*New Tool.*?<\/div>\n?/g, '');
// Clean up any remaining whitespace issues inside the anchor div
code = code.replace(/<div>\s*<h2([^>]*)>([^<]*)<\/h2>\s*<\/div>/g, '<div>\n          <h2$1>$2</h2>\n        </div>');
fs.writeFileSync('src/pages/index.astro', code);
console.log('Done');
