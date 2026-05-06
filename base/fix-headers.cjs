const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/mb-10 border-b border-\[\#F1E9E0\] pb-8/g, 'mb-5 border-b border-[#F1E9E0] pb-4');
code = code.replace(/mb-6 sm:mb-10 border-b border-\[\#F1E9E0\] pb-6 sm:pb-8/g, 'mb-4 border-b border-[#F1E9E0] pb-4');

fs.writeFileSync('src/App.tsx', code);
