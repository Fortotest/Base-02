const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/grid gap-6 px-1/g, 'grid gap-4 px-1');
code = code.replace(/grid grid-cols-1 md:grid-cols-2 gap-6/g, 'grid grid-cols-1 md:grid-cols-2 gap-4');

fs.writeFileSync('src/App.tsx', code);
