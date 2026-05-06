const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// The whole content block
const contentStartIdx = code.indexOf(`                {/* Tab: Content (Copywriting) */}`);
const historyStartIdx = code.indexOf(`                {/* Tab: History */}`);

let contentBlock = code.substring(contentStartIdx, historyStartIdx);

// We want to extract the underlying sections:
function extractSection(name) {
    const startPattern = `<h3 className="text-xl font-black text-brand-dark">${name}</h3>`;
    const startPattern2 = `<h3 className="text-lg sm:text-xl font-black text-brand-dark">${name}</h3>`;
    let startIdx = contentBlock.indexOf(startPattern);
    if (startIdx === -1) startIdx = contentBlock.indexOf(startPattern2);
    if (startIdx === -1) throw new Error("not found: " + name);
    
    // go back to <section
    startIdx = contentBlock.lastIndexOf('<section', startIdx);
    
    // find next </section>
    const endIdx = contentBlock.indexOf('</section>', startIdx) + '</section>'.length;
    return contentBlock.substring(startIdx, endIdx);
}

const colSec = extractSection("Collection Introduction");
const ctaSec = extractSection("CTA & Interaction");
const socialSec = extractSection("Social Media Links");
const footerSec = extractSection("Footer Content");

// Reconstruct Content Block
// Wait, in my previous edit_file, I already added some structure.
// Let's reset the whole block and apply from scratch.
EOF // oh wait I will just rewrite the whole file
