const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `onChange={(e) => setTempContent({ ...tempContent!, aboutDescription2: e.target.value })}
                              className={\`w-full bg-white border border-[#F1E9E0] rounded-2xl px-4 py-4 text-xs font-medium leading-relaxed text-gray-500 italic h-40 resize-none transition-all \${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}\`}
                            />
                          </div>
                        </div>`;

const newStr = `onChange={(e) => setTempContent({ ...tempContent!, aboutDescription2: e.target.value })}
                              className={\`w-full bg-white border border-[#F1E9E0] rounded-2xl px-4 py-4 text-xs font-medium leading-relaxed text-gray-500 italic h-40 resize-none transition-all \${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}\`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[8px] font-black text-brand-gold uppercase tracking-widest mb-1.5 block">Story Image 1 (Toples) URL</label>
                            <div className="relative">
                              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                              <input 
                                disabled={editingSection !== 'aboutStory'}
                                value={editingSection === 'aboutStory' ? tempContent?.storyImage1Url : content.storyImage1Url}
                                onChange={(e) => setTempContent({ ...tempContent!, storyImage1Url: e.target.value })}
                                className={\`w-full bg-white border border-[#F1E9E0] rounded-xl pl-12 pr-4 py-3 text-[10px] font-bold text-brand-dark transition-all \${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}\`}
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-brand-gold uppercase tracking-widest mb-1.5 block">Story Image 2 (Cookies) URL</label>
                            <div className="relative">
                              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                              <input 
                                disabled={editingSection !== 'aboutStory'}
                                value={editingSection === 'aboutStory' ? tempContent?.storyImage2Url : content.storyImage2Url}
                                onChange={(e) => setTempContent({ ...tempContent!, storyImage2Url: e.target.value })}
                                className={\`w-full bg-white border border-[#F1E9E0] rounded-xl pl-12 pr-4 py-3 text-[10px] font-bold text-brand-dark transition-all \${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}\`}
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        </div>`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/App.tsx', code);
