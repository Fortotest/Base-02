const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/bg-white rounded-\[1\.5rem\] sm:rounded-\[2\.5rem\] p-5 sm:p-8 lg:p-10/g, 'bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5');
code = code.replace(/bg-white rounded-\[2\.5rem\] p-8 lg:p-10/g, 'bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5');
code = code.replace(/flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8/g, 'flex-grow overflow-y-auto p-4 sm:p-5');

// Sidebar width
code = code.replace(/w-72/g, 'w-60');

// Features row
// it was gap-x-12 gap-y-8. Make it tighter.
code = code.replace(/gap-x-12 gap-y-8/g, 'gap-x-6 gap-y-4');
// p-6 for features
code = code.replace(/p-6 bg-\[\#FBFBF9\]/g, 'p-4 bg-[#FBFBF9]');

fs.writeFileSync('src/App.tsx', code);
