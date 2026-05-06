const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update SiteContent interface
code = code.replace(/heroImage: string;/g, 'heroImageUrl: string;\n  storyImage1Url: string;\n  storyImage2Url: string;');
code = code.replace(/heroImageScale\?: number;/g, 'heroImageScale?: number;\n  storyImage1Scale?: number;\n  storyImage2Scale?: number;\n  storyImage1Position?: string;\n  storyImage2Position?: string;');

// 2. Update INITIAL_CONTENT
code = code.replace(/heroImage: "https:\/\/raw\.githubusercontent\.com\/Fortotest\/Project-BWD02-Kelompok-Esteh-33x\.base\/590db9ebd22970c6c5420509f7a10a1fb904c243\/c7084c08-31bd-48cc-90d0-727aec21680a\.jpeg",/g, 
`heroImageUrl: "https://raw.githubusercontent.com/Fortotest/Project-BWD02-Kelompok-Esteh-33x.base/590db9ebd22970c6c5420509f7a10a1fb904c243/c7084c08-31bd-48cc-90d0-727aec21680a.jpeg",
  storyImage1Url: "https://raw.githubusercontent.com/Fortotest/Project-BWD02-Kelompok-Esteh-33x.base/590db9ebd22970c6c5420509f7a10a1fb904c243/3.jpeg",
  storyImage2Url: "https://raw.githubusercontent.com/Fortotest/Project-BWD02-Kelompok-Esteh-33x.base/590db9ebd22970c6c5420509f7a10a1fb904c243/2.jpeg",`);

// Replace existing heroImage usages with heroImageUrl
code = code.replace(/content\.heroImage/g, 'content.heroImageUrl');
code = code.replace(/tempContent\?\.heroImage/g, 'tempContent?.heroImageUrl');
code = code.replace(/tempContent, heroImage:/g, 'tempContent, heroImageUrl:');
code = code.replace(/parsed\.heroImage/g, 'parsed.heroImageUrl');

// Replace about images in Our Story section
// The current code is: src={resolveDirectImageUrl(content.products[0]?.image || INITIAL_CONTENT.products[0].image)}
code = code.replace(/src={resolveDirectImageUrl\(content\.products\[0\]\?\.image \|\| INITIAL_CONTENT\.products\[0\]\.image\)}/g, 
  'src={resolveDirectImageUrl(content.storyImage1Url || INITIAL_CONTENT.storyImage1Url)}');
  
// Replace about images in Our Story section for the second image
// The current code is: src={resolveDirectImageUrl(content.products[content.products.length - 1]?.image || INITIAL_CONTENT.products[3].image)}
code = code.replace(/src={resolveDirectImageUrl\(content\.products\[content\.products\.length - 1\]\?\.image \|\| INITIAL_CONTENT\.products\[3\]\.image\)}/g, 
  'src={resolveDirectImageUrl(content.storyImage2Url || INITIAL_CONTENT.storyImage2Url)}');

// Adjust Scale and Position in Our Story
code = code.replace(/transform: \`scale\(\$\{content\.products\[0\]\?\.imageScale \|\| 1\}\) translate\(\$\{50 - parseImagePosition\(content\.products\[0\]\?\.imagePosition\)\.x\}%, \$\{50 - parseImagePosition\(content\.products\[0\]\?\.imagePosition\)\.y\}%\)\`/g,
  'transform: `scale(${content.storyImage1Scale || 1}) translate(${50 - parseImagePosition(content.storyImage1Position).x}%, ${50 - parseImagePosition(content.storyImage1Position).y}%)`');

code = code.replace(/transform: \`scale\(\$\{content\.products\[content\.products\.length - 1\]\?\.imageScale \|\| 1\}\) translate\(\$\{50 - parseImagePosition\(content\.products\[content\.products\.length - 1\]\?\.imagePosition\)\.x\}%, \$\{50 - parseImagePosition\(content\.products\[content\.products\.length - 1\]\?\.imagePosition\)\.y\}%\)\`/g,
  'transform: `scale(${content.storyImage2Scale || 1}) translate(${50 - parseImagePosition(content.storyImage2Position).x}%, ${50 - parseImagePosition(content.storyImage2Position).y}%)`');

fs.writeFileSync('src/App.tsx', code);
