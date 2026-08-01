const fs = require('fs');

// 1. Update index.html
let indexContent = fs.readFileSync('index.html', 'utf8');
indexContent = indexContent.replace(/<title>متحف التراث العراقي<\/title>/g, '<title>المتحف الرقمي</title>');
indexContent = indexContent.replace(/<h1>متحف التراث العراقي<\/h1>/g, '<h1>المتحف الرقمي</h1>');
fs.writeFileSync('index.html', indexContent);

// 2. Update manifest.json
let manifestContent = fs.readFileSync('manifest.json', 'utf8');
let manifest = JSON.parse(manifestContent);
manifest.name = "المتحف الرقمي";
manifest.short_name = "المتحف الرقمي";
manifest.description = "المتحف الرقمي للجولات الافتراضية";
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));

// 3. Update style.css to Black and White
let styleContent = fs.readFileSync('style.css', 'utf8');
const oldRoot = /:root \{[\s\S]*?\}/;
const newRoot = `:root {
    --bg-color: #000000;
    --card-bg: rgba(20, 20, 20, 0.8);
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --accent: #ffffff;
    --accent-hover: #aaaaaa;
    --glass-border: rgba(255, 255, 255, 0.2);
}`;
styleContent = styleContent.replace(oldRoot, newRoot);

// Remove blue gradients from body
styleContent = styleContent.replace(/rgba\(15, 23, 42, 1\)/g, '#000000');
// Remove blue gradients from viewer-container
styleContent = styleContent.replace(/#1e293b/g, '#222222');
styleContent = styleContent.replace(/#0f172a/g, '#000000');

fs.writeFileSync('style.css', styleContent);

console.log('UI updated to Black and White and title changed to المتحف الرقمي');
