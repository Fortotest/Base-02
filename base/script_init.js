const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add new states
const stateCode = `  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('overview');
  const [activeContentTab, setActiveContentTab] = useState<'hero' | 'nav' | 'features' | 'footer'>('hero');
  const [activeAboutTab, setActiveAboutTab] = useState<'text' | 'media' | 'stats'>('text');`;
code = code.replace(/  const \[activeAdminTab, setActiveAdminTab\] = useState<AdminTab>\('overview'\);/, stateCode);

// 2. Wrap content tab
const contentStart = `{/* Tab: Content (Copywriting) */}
                {activeAdminTab === 'content' && (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >`;
const contentReplace = `{/* Tab: Content (Copywriting) */}
                {activeAdminTab === 'content' && (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="max-w-4xl mx-auto w-full">
                      <div className="flex overflow-x-auto border-b border-[#F1E9E0] mb-6 no-scrollbar">
                        {[
                          { id: 'hero', label: 'Hero & Visuals' },
                          { id: 'nav', label: 'Navigation' },
                          { id: 'features', label: 'Features' },
                          { id: 'footer', label: 'Footer & Socials' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveContentTab(tab.id as any)}
                            className={\`whitespace-nowrap px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all \${
                              activeContentTab === tab.id 
                              ? 'text-brand-dark border-b-2 border-brand-gold bg-brand-soft/30' 
                              : 'text-gray-400 hover:text-brand-dark hover:bg-gray-50'
                            }\`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-10">
                        {activeContentTab === 'nav' && (
                          <>`;

code = code.replace(contentStart, contentReplace);

const beforeHero = `{/* Hero Editor */}`; // wait, is it there?
// We need to inject `{activeContentTab === 'hero' && (<>` above Hero Section, and sum up.
// Let's use regex or split logic cleanly.
fs.writeFileSync('src/refactor.js', '');
