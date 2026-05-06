const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/gap-8 max-w-4xl/g, 'gap-5 max-w-4xl');

code = code.replace(/padding: 18px 24px;/g, 'padding: 10px 14px;');
code = code.replace(/border-radius: 1\.25rem;/g, 'border-radius: 0.5rem;');
code = code.replace(/font-size: 14px;/g, 'font-size: 13px;');

code = code.replace(/padding: 12px 16px;/g, 'padding: 8px 12px;');
code = code.replace(/border-radius: 0\.75rem;/g, 'border-radius: 0.375rem;');
code = code.replace(/font-size: 13px;/g, 'font-size: 12px;');

code = code.replace(/tracking-\[0\.2em\]/g, 'tracking-widest');

fs.writeFileSync('src/App.tsx', code);
