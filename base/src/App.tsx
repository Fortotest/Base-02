import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Instagram, Menu, X, ArrowRight, MessageCircle, Heart, Star, Coffee, Package, User, Users, MousePointerClick, Activity, Save, Trash2, Plus, LogOut, Link as LinkIcon, Edit3, LayoutDashboard, Settings, Image as ImageIcon, FileText, CheckCircle, Eye, Quote, History, RotateCcw, Database, MapPin, AlertCircle, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import productsData from './data/products.json';
import mainContentData from './data/main-content.json';
import ourStoryData from './data/our-story.json';
import { pushDataToGithub } from './services/githubService';

// --- TYPES ---
type View = 'store' | 'admin' | 'login';
type AdminTab = 'overview' | 'content' | 'products' | 'about' | 'history' | 'settings';

interface HistoryRecord {
  id: string;
  timestamp: number;
  type: 'content' | 'product_add' | 'product_edit' | 'product_delete' | 'restore';
  label: string;
  details: string;
  previousState: SiteContent;
}
interface Product {
  id: number;
  name: string;
  tagline: string;
  description: string;
  details: string;
  price: string;
  image: string;
  badge: string;
  waLink: string;
  whatsappMessage?: string;
  imagePosition?: string;
  imageScale?: number;
}

interface SiteContent {
  // Navigation
  navCollection: string;
  navAbout: string;
  navContact: string;
  navOrder: string;

  // Hero
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBadge: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroImageUrl: string;
  heroImageUrlPosition?: string;
  heroImageUrlScale?: number;
  storyImage1Url: string;
  storyImage1Position?: string;
  storyImage1Scale?: number;
  storyImage2Url: string;
  storyImage2Position?: string;
  storyImage2Scale?: number;

  // Features
  features: { label: string; sub: string }[];

  // Collection
  collectionTitle: string;
  collectionDescription: string;

  // About
  aboutTagline: string;
  aboutTitle: string;
  aboutDescription1: string;
  aboutDescription2: string;
  
  // Stats
  stats: { value: string; label: string }[];

  // CTA
  ctaBadge: string;
  ctaTitle1: string;
  ctaTitle2: string;
  ctaDescription: string;

  // Footer
  footerAbout: string;
  footerCopyright: string;
  footerTagline: string;
  footerQuickLinksTitle: string;
  footerServiceTitle: string;
  instagramLink: string;
  whatsappLink: string;
  mapsLink: string;
  products: Product[];
}

// --- UTILS ---
const processImageUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  try {
    let u = url.trim();
    let directUrl = u;

    // 1. Ekstraksi GitHub Blob -> Raw
    if (u.includes('github.com') && u.includes('/blob/')) {
      directUrl = u.replace(/https?:\/\/github\.com\//, 'https://raw.githubusercontent.com/').replace('/blob/', '/');
    }
    
    // 2. Pinterest & Direct Links Handler
    // Pinterest (pinimg.com) sudah berupa direct link jika user melakukan "Copy Image Address".
    // Jadi kita biarkan directUrl sama dengan u, namun tetap WAJIB di-proxy di bawah.
    
    // 3. CORS BYPASS (THE MAGIC TRICK)
    // Jika URL sudah mengandung proxy wsrv.nl, jangan di-double
    if (directUrl.includes('wsrv.nl')) {
      return directUrl;
    }
    
    // Bungkus semua Direct URL (termasuk GitHub Raw dan Pinterest) dengan Image Proxy
    // Ini menggaransi 100% gambar bisa masuk ke Canvas tanpa kena block CORS
    return `https://wsrv.nl/?url=${encodeURIComponent(directUrl)}&cors=1`;

  } catch (e) {
    console.error("URL Conversion Error:", e);
    return url || undefined;
  }
};

const parseImagePosition = (pos: string | undefined) => {
  if (!pos || pos === 'center') return { x: 50, y: 50 };
  const parts = pos.split(' ');
  if (parts.length !== 2) return { x: 50, y: 50 };
  
  const x = parseInt(parts[0]);
  const y = parseInt(parts[1]);
  
  return { 
    x: isNaN(x) ? 50 : x, 
    y: isNaN(y) ? 50 : y 
  };
};

// --- INITIAL DATA ---
const INITIAL_CONTENT: SiteContent = {
  ...(mainContentData as any),
  ...(ourStoryData as any),
  products: productsData,
};

// --- COMPONENTS ---
const Storefront = ({ content, isLoggedIn, onAdminClick, imageRefreshKey, trackLinkClick, trackProductClick }: { content: SiteContent, isLoggedIn: boolean, onAdminClick: () => void, imageRefreshKey: number, trackLinkClick: () => void, trackProductClick: () => void }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string>('home');

  React.useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id || 'home');
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const sections = ['collection', 'about', 'contact'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Handle home section manually based on scroll
    const handleHomeScroll = () => {
      if (window.scrollY < 300) {
        setActiveSection('home');
      }
    };
    window.addEventListener('scroll', handleHomeScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleHomeScroll);
    };
  }, []);

  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Precision Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 overflow-hidden ${isScrolled ? 'bg-white shadow-sm h-16 lg:h-20' : 'h-24 md:h-28 lg:h-32'}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-full flex flex-col justify-center">
          <div className="flex justify-between items-center">
            <div className="flex-shrink-0">
              <a href="#" className="font-serif text-xl md:text-2xl font-black tracking-tighter text-brand-dark group">
                Apsari <span className="text-brand-gold italic">Patisserie</span><span className="text-brand-gold">.</span>
              </a>
            </div>

            <div className="hidden md:flex items-center space-x-12">
              <a href="#collection" className={`relative py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${activeSection === 'collection' ? 'text-brand-dark' : 'text-gray-400 hover:text-brand-gold'}`}>
                {content.navCollection}
                {activeSection === 'collection' && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-dark rounded-full mx-auto w-8"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </a>
              <a href="#about" className={`relative py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${activeSection === 'about' ? 'text-brand-dark' : 'text-gray-400 hover:text-brand-gold'}`}>
                {content.navAbout}
                {activeSection === 'about' && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-dark rounded-full mx-auto w-8"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </a>
              <a href="#contact" className={`relative py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${activeSection === 'contact' ? 'text-brand-dark' : 'text-gray-400 hover:text-brand-gold'}`}>
                {content.navContact}
                {activeSection === 'contact' && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-dark rounded-full mx-auto w-8"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </a>

              <a href={content.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary rounded-full px-8 py-3 text-xs font-bold tracking-[0.1em] uppercase" onClick={trackLinkClick}>
                {content.navOrder}
              </a>
            </div>

            <div className="md:hidden flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-brand-dark hover:bg-gray-100 rounded-lg transition-colors"
                id="mobile-menu-btn"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-white md:hidden pt-24 px-8 pb-10 flex flex-col justify-between h-[100dvh] overflow-y-auto"
            style={{ transformOrigin: 'center' }}
          >
            <div className="flex flex-col flex-grow justify-center space-y-10 min-h-max">
              <a href="#collection" onClick={() => setIsMobileMenuOpen(false)} className="font-serif text-5xl hover:italic transition-all uppercase tracking-tighter text-brand-dark">{content.navCollection}s</a>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="font-serif text-5xl hover:italic transition-all uppercase tracking-tighter text-brand-dark">{content.navAbout}</a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="font-serif text-5xl hover:italic transition-all uppercase tracking-tighter text-brand-dark">{content.navContact}</a>
            </div>
            
            <div className="border-t border-brand-gold/10 pt-10">
              <div className="mb-10">
                <span className="inline-block py-1 px-3 rounded-full bg-brand-soft text-brand-gold text-[8px] font-black uppercase tracking-widest mb-4 border border-brand-gold/10">
                  {content.heroBadge}
                </span>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-6">Get in touch</p>
                <div className="flex gap-8 items-center">
                  <a href={content.instagramLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-brand-soft rounded-full text-brand-gold hover:bg-brand-gold hover:text-white transition-all" onClick={trackLinkClick}>
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href={content.whatsappLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-brand-soft rounded-full text-brand-gold hover:bg-brand-gold hover:text-white transition-all" onClick={trackLinkClick}>
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <a href={content.mapsLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-brand-soft rounded-full text-brand-gold hover:bg-brand-gold hover:text-white transition-all" onClick={trackLinkClick}>
                    <MapPin className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <a href={content.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-gold/20" onClick={trackLinkClick}>
                Pesan via WhatsApp
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero: Modern Editorial with Image */}
      <header id="home" className="relative pt-24 pb-16 lg:pt-40 lg:pb-32 px-6 sm:px-10 overflow-hidden bg-white">
        {/* Subtle geometric background element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#FAF9F6] -skew-x-12 transform translate-x-1/2 z-0 hidden lg:block"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left"
            >
              <span className="inline-block py-1.5 px-4 rounded-full bg-brand-soft text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-sm border border-brand-gold/10">
                {content.heroBadge}
              </span>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-brand-dark mb-8 leading-[1.05] tracking-tighter">
                {content.heroTitle} <br/>
                <span className="italic text-brand-gold inline-block leading-tight">{content.heroSubtitle}</span>
              </h1>
              
              <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-md mb-12 font-light">
                {content.heroDescription}
              </p>
              
              <div className="flex flex-wrap items-center gap-8">
                <motion.a 
                  href="#collection" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('products'); }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden bg-brand-gold text-white px-10 py-5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(179,142,93,0.35)] hover:shadow-[0_25px_50px_-12px_rgba(179,142,93,0.45)] transition-all flex items-center gap-4 group"
                >
                  <span className="relative z-10">{content.heroCtaPrimary}</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  
                  {/* Premium Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </motion.a>
                
                <a 
                  href="#about" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                  className="text-brand-dark font-black text-[11px] uppercase tracking-[0.25em] hover:text-brand-gold transition-colors flex items-center gap-3 group relative py-2"
                >
                  <span className="w-6 h-[1px] bg-brand-gold/40 group-hover:w-8 transition-all duration-300"></span>
                  {content.heroCtaSecondary}
                  <span className="absolute bottom-1 left-9 w-0 h-[2px] bg-brand-gold/20 group-hover:w-[calc(100%-36px)] transition-all duration-300"></span>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 40 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full lg:mt-0"
            >
              <div className="relative group perspective-1000 max-w-[500px] lg:max-w-none mx-auto">
                {/* Decorative Frame with animation */}
                <div className="absolute -inset-6 border border-brand-gold/10 rounded-[3rem] lg:rounded-[4rem] -z-10 transition-transform duration-1000 group-hover:scale-105"></div>
                
                <div className="relative aspect-[4/5] md:aspect-[4/3] lg:aspect-[4/5] rounded-2xl lg:rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-30px_rgba(156,140,127,0.25)] border-4 border-white ring-1 ring-black/[0.03] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:shadow-brand-gold/20 group-hover:-translate-y-2">
                  <img 
                    src={processImageUrl(content.heroImageUrl)} 
                    key={`hero-main-${imageRefreshKey}`}
                    className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" 
                    alt="Apsari Patisserie Premium Collection" 
                  crossOrigin="anonymous" referrerPolicy="no-referrer" />
                  
                  {/* Subtle glass overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </div>
                
                {/* Strategic Precision Ambient Glow */}
                <div className="absolute -inset-10 bg-brand-gold/5 blur-[100px] rounded-full -z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Compact Feature stats */}
      <section className="py-12 border-y border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4">
          {(content.features || []).map((item, i) => {
            const icons = [Heart, Star, Coffee, ShoppingBag];
            const Icon = icons[i % icons.length];
            return (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center group/feat"
              >
                <Icon className="w-5 h-5 text-brand-gold mb-3 transition-transform duration-500 group-hover/feat:scale-110" />
                <p className="text-xs font-bold text-brand-dark mb-0.5">{item.label}</p>
                <p className="text-[9px] uppercase tracking-widest text-gray-400">{item.sub}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Collection Grid: Centered & Precise alignment */}
      <section id="collection" className="py-24 px-6 sm:px-10 bg-[#FBFBF9]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center mb-20 gap-4"
          >
            <div className="max-w-2xl">
              <h2 className="text-5xl lg:text-7xl font-serif font-bold mb-6 text-brand-dark">{content.collectionTitle}</h2>
              <p className="text-gray-500 text-base md:text-lg leading-relaxed font-light italic">
                {content.collectionDescription}
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {(content.products || []).length > 0 ? (
              (content.products || []).map((p, i) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="product-card group rounded-[32px] p-8 flex flex-col sm:flex-row gap-8 items-center relative overflow-hidden"
                  >
                    <div className="relative aspect-square sm:w-48 shrink-0 rounded-2xl overflow-hidden bg-brand-soft ring-1 ring-brand-gold/5">
                    <img 
                      src={processImageUrl(p.image)} 
                      alt={p.name} 
                      className="w-full h-full object-cover pointer-events-none transition-transform duration-1000 group-hover:scale-110 shadow-inner" 
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center',
                        transform: `scale(${p.imageScale || 1}) translate(${50 - parseImagePosition(p.imagePosition).x}%, ${50 - parseImagePosition(p.imagePosition).y}%)`
                      }}
                    crossOrigin="anonymous" referrerPolicy="no-referrer" />
                    <motion.div 
                      className="absolute top-4 right-4 flex items-center justify-center text-xl lg:text-2xl select-none drop-shadow-md z-10"
                      animate={
                        p.badge === "🤩" ? { scale: [1, 1.15, 1] } :
                        p.badge === "🥶" ? { x: [-1, 1, -1, 0] } :
                        p.badge === "😋" ? { y: [0, -4, 0] } :
                        p.badge === "🥳" ? { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] } : {}
                      }
                      transition={{
                        duration: p.badge === "🥶" ? 0.4 : (p.badge === "😋" ? 1.5 : 2.5),
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {p.badge}
                    </motion.div>
                  </div>
                  <div className="px-2 py-2 flex flex-col flex-grow w-full">
                    <div className="flex items-center gap-2 mb-2 w-full">
                      <span className="w-4 h-[1px] bg-brand-gold shrink-0"></span>
                      <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.25em] truncate">{p.tagline}</span>
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl font-bold mb-3 text-brand-dark group-hover:text-brand-gold transition-colors leading-tight truncate">{p.name}</h3>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed line-clamp-2 font-light italic">"{p.description}"</p>
                    
                    <div className="mt-auto space-y-4">
                      <div className="flex justify-between items-end border-b border-brand-gold/10 pb-4">
                        <div className="flex flex-col min-w-0 flex-grow pr-3">
                          <span className="text-[7px] font-black text-brand-gold uppercase tracking-widest mb-0.5">Packaging & Size</span>
                          <span className="text-[10px] font-bold text-brand-dark leading-tight italic truncate">{p.details}</span>
                        </div>
                        <div className="flex flex-col items-end text-right flex-shrink-0">
                          <span className="text-[7px] font-black text-brand-gold uppercase tracking-widest mb-0.5">Price</span>
                          <span className="font-serif text-xl md:text-2xl font-bold text-brand-dark leading-none whitespace-nowrap">
                            <span className="text-[9px] font-sans font-normal opacity-60 mr-0.5">Rp</span>
                            {p.price.replace('Rp', '').trim()}
                          </span>
                        </div>
                      </div>
  
                      <a 
                         href={`${p.waLink.split('?')[0]}?text=${encodeURIComponent(p.whatsappMessage || `Halo Apsari Patisserie, saya ingin pesan ${p.name}!`)}`} 
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-full group/btn flex items-center justify-center gap-3 bg-brand-gold text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 hover:bg-brand-dark shadow-xl shadow-brand-gold/10 hover:shadow-brand-dark/20 hover:-translate-y-0.5 active:translate-y-0"
                         onClick={trackProductClick}
                       >
                         <MessageCircle className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                         WhatsApp
                       </a>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-serif text-xl italic mb-6">Oops! Sepertinya katalog menu sedang kosong.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About/Section: Concise & Balanced Story */}
      <section id="about" className="py-20 md:py-28 px-6 sm:px-10 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 order-2 lg:order-1"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.3em]">{content.aboutTagline}</span>
              <div className="h-[1px] flex-grow bg-brand-gold/20"></div>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-serif font-bold mb-6 md:mb-8 leading-[1.15] text-brand-dark tracking-tighter whitespace-pre-line">
              {content.aboutTitle}
            </h2>
            <div className="space-y-4 md:space-y-6 text-gray-500 text-[15px] md:text-lg leading-relaxed max-w-xl font-light">
              <p>{content.aboutDescription1}</p>
              <p>{content.aboutDescription2}</p>
            </div>
            
            {/* Stats Area - More Responsive for Mobile */}
            <div className="mt-10 md:mt-12 flex flex-wrap items-center gap-x-8 gap-y-8 md:gap-12">
              {(content.stats || []).map((stat, idx) => (
                <div key={idx} className="flex items-center gap-8">
                  <div className="text-left">
                    <p className="font-serif text-4xl md:text-5xl text-brand-dark mb-1 tracking-tighter italic font-semibold">{stat.value}</p>
                    <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-black text-brand-gold">{stat.label}</p>
                  </div>
                  {idx < content.stats.length - 1 && (
                    <div className="hidden sm:block w-px h-10 bg-brand-gold/20"></div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 order-1 lg:order-2 grid grid-cols-2 gap-3 md:gap-4 mb-10 lg:mb-0"
          >
              <div className="rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden aspect-[4/5] md:aspect-[3/4] mt-6 md:mt-12 shadow-2xl border-2 md:border-4 border-white">
                <img 
                  src={processImageUrl(content.storyImage1Url || INITIAL_CONTENT.storyImage1Url)} 
                  alt="Story 1" 
                  className="w-full h-full object-cover pointer-events-none" 
                  style={{ 
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transform: `scale(${content.storyImage1Scale || 1}) translate(${50 - parseImagePosition(content.storyImage1Position).x}%, ${50 - parseImagePosition(content.storyImage1Position).y}%)`
                  }}
                crossOrigin="anonymous" referrerPolicy="no-referrer" />
             </div>
             <div className="rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden aspect-[4/5] md:aspect-[3/4] shadow-2xl border-2 md:border-4 border-white">
                <img 
                  src={processImageUrl(content.storyImage2Url || INITIAL_CONTENT.storyImage2Url)} 
                  alt="Story 2" 
                  className="w-full h-full object-cover pointer-events-none" 
                  style={{ 
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transform: `scale(${content.storyImage2Scale || 1}) translate(${50 - parseImagePosition(content.storyImage2Position).x}%, ${50 - parseImagePosition(content.storyImage2Position).y}%)`
                  }}
                crossOrigin="anonymous" referrerPolicy="no-referrer" />
             </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 md:py-32 bg-white relative overflow-hidden px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-gradient-to-br from-[#FAF7F2] to-[#F5F1E9] rounded-[3rem] md:rounded-[5rem] px-8 py-16 md:px-16 md:py-28 overflow-hidden border border-brand-gold/10 text-center shadow-[0_40px_100px_-30px_rgba(156,140,127,0.15)]"
          >
            <div className="relative z-10">
              <div className="flex justify-center mb-8">
                <span className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-white text-brand-gold text-[10px] font-black uppercase tracking-[0.25em] shadow-sm border border-brand-gold/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span>
                  {content.ctaBadge}
                </span>
              </div>
              
              <h2 className="text-5xl md:text-8xl font-serif font-bold text-brand-dark mb-8 flex flex-col items-center">
                <span className="leading-none tracking-tighter mb-2">{content.ctaTitle1}</span>
                <span className="italic text-brand-gold leading-none">{content.ctaTitle2}</span>
              </h2>

              <p className="text-gray-500 text-base md:text-xl max-w-lg mx-auto leading-relaxed font-light mb-12">
                {content.ctaDescription}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                <a 
                  href={content.whatsappLink} 
                  target="_blank" rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-brand-gold text-white px-10 py-5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-brand-gold/30 hover:scale-105 active:scale-95 transition-all duration-300"
                  onClick={trackLinkClick}
                >
                  <MessageCircle className="w-5 h-5 fill-white/10" />
                  WhatsApp Kami
                </a>
                <a 
                  href={content.instagramLink} 
                  target="_blank" rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white border-2 border-brand-gold/10 text-brand-gold px-10 py-5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-brand-soft transition-all duration-300 shadow-sm"
                  onClick={trackLinkClick}
                >
                  <Instagram className="w-5 h-5" />
                  Follow Instagram
                </a>
              </div>
            </div>
            
            {/* Artistic Decorative background elements */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/40 rounded-full blur-[100px] opacity-60"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-gold/5 rounded-full blur-[120px] opacity-40"></div>
            
            {/* Subtle brand pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#B38E5D 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
          </motion.div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="pt-20 pb-10 px-6 sm:px-10 border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-20">
            <div className="md:col-span-2">
              <span className="font-serif text-3xl font-bold tracking-tighter block mb-6">Apsari <span className="text-brand-gold italic">Patisserie</span><span className="text-brand-gold">.</span></span>
              <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">{content.footerAbout}</p>
              
              <div className="flex items-center gap-3 mb-8">
                <a href={content.instagramLink} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center hover:bg-brand-soft transition-colors text-gray-400 hover:text-brand-dark" onClick={trackLinkClick}>
                  <Instagram className="w-4 h-4" />
                </a>
                <a href={content.whatsappLink} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center hover:bg-brand-soft transition-colors text-gray-400 hover:text-brand-dark" onClick={trackLinkClick}>
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a href={content.mapsLink} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center hover:bg-brand-soft transition-colors text-gray-400 hover:text-brand-dark" onClick={trackLinkClick}>
                  <MapPin className="w-4 h-4" />
                </a>
                <button 
                  onClick={onAdminClick}
                  className="w-9 h-9 rounded-full border border-brand-gold/10 flex items-center justify-center hover:bg-brand-soft transition-colors group"
                  title={isLoggedIn ? "Admin Dashboard" : "Login Admin"}
                >
                  <User className={`w-4 h-4 ${isLoggedIn ? 'text-brand-gold' : 'text-gray-300'} group-hover:scale-110 transition-transform`} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-brand-dark mb-6">{content.footerQuickLinksTitle}</p>
              <ul className="text-sm text-gray-400 space-y-3">
                <li><a href="#collection" className="hover:text-brand-gold transition-colors">{content.navCollection}</a></li>
                <li><a href="#about" className="hover:text-brand-gold transition-colors">{content.navAbout}</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Hampers Service</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Sustainability</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-brand-dark mb-6">{content.footerServiceTitle}</p>
              <ul className="text-sm text-gray-400 space-y-3">
                <li><a href="#" className="hover:text-brand-gold transition-colors">Gift Cards</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Bulk Orders</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
             <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">&copy; {content.footerCopyright}</p>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest">{content.footerTagline}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  const [content, setContent] = useState<SiteContent>(INITIAL_CONTENT);
  const [currentView, setCurrentView] = useState<View>('store');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('overview');
  const [activeContentTab, setActiveContentTab] = useState<'hero' | 'nav' | 'features' | 'footer'>('hero');
  const [activeAboutTab, setActiveAboutTab] = useState<'text' | 'media' | 'stats'>('text');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [adminNotification, setAdminNotification] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const showNotify = (type: 'success' | 'error', text: string) => {
    setAdminNotification({ type, text });
    setTimeout(() => setAdminNotification(null), 5000);
  };
  
  // GitHub Settings State
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('apsari_github_repo') || 'Fortotest/Apsari-Patisserie');
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('apsari_github_token') || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Products Saving State
  const [isSavingProductToGithub, setIsSavingProductToGithub] = useState(false);
  const [isSavingContentToGithub, setIsSavingContentToGithub] = useState(false);


  const [isAdminSidebarCollapsed, setIsAdminSidebarCollapsed] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  
  const [productScrollIndex, setProductScrollIndex] = useState(0);
  const productScrollRef = useRef<HTMLDivElement>(null);
  const handleProductScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPosition = target.scrollLeft;
    // Card width (120px) + gap (16px) = 136px
    const index = Math.round(scrollPosition / 136);
    setProductScrollIndex(Math.max(0, index));
  };

  const [tempProduct, setTempProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState<SiteContent | null>(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const [analytics, setAnalytics] = useState({ totalVisitors: 0, linkClicks: 0, productClicks: 0 });
  const [showSalesAssistant, setShowSalesAssistant] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [greeting, setGreeting] = useState('');

  const trackLinkClick = () => {
    setAnalytics(prev => {
      const newAnalytics = { ...prev, linkClicks: prev.linkClicks + 1 };
      localStorage.setItem('apsari_analytics', JSON.stringify(newAnalytics));
      return newAnalytics;
    });
  };

  const trackProductClick = () => {
    setAnalytics(prev => {
      const newAnalytics = { ...prev, productClicks: prev.productClicks + 1 };
      localStorage.setItem('apsari_analytics', JSON.stringify(newAnalytics));
      return newAnalytics;
    });
  };

  useEffect(() => {
    const savedAnalyticsStr = localStorage.getItem('apsari_analytics');
    let parsedAnalytics = { totalVisitors: 0, linkClicks: 0, productClicks: 0 };
    if (savedAnalyticsStr) {
      try {
        const parsed = JSON.parse(savedAnalyticsStr);
        parsedAnalytics = {
          totalVisitors: parsed.totalVisitors || 0,
          linkClicks: parsed.linkClicks !== undefined ? parsed.linkClicks : (parsed.ctaClicks || 0),
          productClicks: parsed.productClicks || 0
        };
      } catch (e) {
        console.error("Failed to parse analytics", e);
      }
    }
    
    // Only increment visitor once per session if possible, or per instruction: "setiap kali mount/refresh"
    parsedAnalytics.totalVisitors += 1;
    localStorage.setItem('apsari_analytics', JSON.stringify(parsedAnalytics));
    setAnalytics(parsedAnalytics);
  }, []);

  // --- SALES ASSISTANT LOGIC ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour <= 11) return 'Selamat pagi';
    if (hour > 11 && hour <= 15) return 'Selamat siang';
    if (hour > 15 && hour <= 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  // Pre-load audio
  const [audio] = useState(() => new Audio('https://raw.githubusercontent.com/Fortotest/Market.ai/aa1fd92abd82277252b6d10912a44c3146ade1ad/Notif%20iphone%20ting%20whatsapp.mp3'));

  useEffect(() => {
    audio.load();
    audio.volume = 0.8;
  }, [audio]);

  useEffect(() => {
    // Show every reload during development phase for verification
    setGreeting(getGreeting());
    const showTimer = setTimeout(() => {
      // Show badge "1" on arrival as if there's a new message
      setUnreadCount(1);
    }, 1500);
    return () => clearTimeout(showTimer);
  }, []);

  const closeSalesAssistant = () => {
    setShowSalesAssistant(false);
    setUnreadCount(0);
    sessionStorage.setItem('apsari_seen_greeting', 'true');
  };

  const toggleSalesAssistant = () => {
    if (!showSalesAssistant) {
      setGreeting(getGreeting());
      setUnreadCount(0);
      
      // Play sound only on click
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Sound error:", e));
    }
    setShowSalesAssistant(!showSalesAssistant);
  };

  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialPosX: 50, initialPosY: 50 });

  const handleImageMouseDown = (e: React.MouseEvent | React.TouchEvent, target: 'product' | 'hero' | 'story1' | 'story2' = 'product') => {
    let posStr;
    if (target === 'hero') posStr = tempContent?.heroImageUrlPosition || content.heroImageUrlPosition;
    else if (target === 'story1') posStr = tempContent?.storyImage1Position || content.storyImage1Position;
    else if (target === 'story2') posStr = tempContent?.storyImage2Position || content.storyImage2Position;
    else posStr = tempProduct?.imagePosition;
    
    const pos = parseImagePosition(posStr);
    
    // Support both mouse and touch
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      initialPosX: pos.x,
      initialPosY: pos.y
    };
  };

  const handleImageMouseMove = (e: React.MouseEvent | React.TouchEvent, target: 'product' | 'hero' | 'story1' | 'story2' = 'product') => {
    if (!dragRef.current.isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;
    
    let currentScale = 1;
    if (target === 'hero') currentScale = tempContent?.heroImageUrlScale || content.heroImageUrlScale || 1;
    else if (target === 'story1') currentScale = tempContent?.storyImage1Scale || content.storyImage1Scale || 1;
    else if (target === 'story2') currentScale = tempContent?.storyImage2Scale || content.storyImage2Scale || 1;
    else currentScale = tempProduct?.imageScale || 1;

    const sensitivity = 0.3 / currentScale; 
    
    let newX = dragRef.current.initialPosX - (deltaX * sensitivity);
    let newY = dragRef.current.initialPosY - (deltaY * sensitivity);

    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    if (target === 'hero') {
      if (tempContent) setTempContent({ ...tempContent, heroImageUrlPosition: `${Math.round(newX)}% ${Math.round(newY)}%` });
    } else if (target === 'story1') {
      if (tempContent) setTempContent({ ...tempContent, storyImage1Position: `${Math.round(newX)}% ${Math.round(newY)}%` });
    } else if (target === 'story2') {
      if (tempContent) setTempContent({ ...tempContent, storyImage2Position: `${Math.round(newX)}% ${Math.round(newY)}%` });
    } else {
      if (tempProduct) {
        setTempProduct({
          ...tempProduct,
          imagePosition: `${Math.round(newX)}% ${Math.round(newY)}%`
        });
      }
    }
  };

  const handleImageMouseUp = () => {
    dragRef.current.isDragging = false;
  };

  // Load from localStorage on mount (only history and login)
  useEffect(() => {
    const savedHistory = localStorage.getItem('apsari_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    if (INITIAL_CONTENT.products.length > 0) {
      setSelectedProductId(INITIAL_CONTENT.products[0].id);
    }
    
    const savedLogin = localStorage.getItem('apsari_logged_in');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'apsari_history' && e.newValue) {
        try {
          setHistory(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to sync history", err);
        }
      }
      if (e.key === 'apsari_logged_in') {
        setIsLoggedIn(e.newValue === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // --- AUTO LOGOUT (5 Minutes Inactivity) ---
  useEffect(() => {
    if (!isLoggedIn) return;

    let logoutTimer: number;

    const resetTimer = () => {
      if (logoutTimer) window.clearTimeout(logoutTimer);
      logoutTimer = window.setTimeout(() => {
        handleLogout();
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Activity events
    const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Set initial timer
    resetTimer();

    // Listen for activity
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      if (logoutTimer) window.clearTimeout(logoutTimer);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isLoggedIn]);

  // Save to localStorage whenever content changes
  const saveContent = (newContent: SiteContent, logType: HistoryRecord['type'] = 'content', logLabel: string = 'Update Konten') => {
    const changeDetails = getDescriptionOfChange(content, newContent);
    
    // Record History ONLY if there are actual changes detected
    if (changeDetails) {
      const record: HistoryRecord = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        type: logType,
        label: logLabel,
        details: changeDetails,
        previousState: JSON.parse(JSON.stringify(content))
      };

      const updatedHistory = [record, ...history].slice(0, 50); // Keep last 50 changes
      setHistory(updatedHistory);
      localStorage.setItem('apsari_history', JSON.stringify(updatedHistory));
    }

    // Update state to reflect changes
    setContent({ ...newContent });
  };

  const getDescriptionOfChange = (prev: SiteContent, next: SiteContent): string | null => {
    const changes: string[] = [];
    
    // Check main text fields and identify them properly
    const fieldMapping: { [key in keyof SiteContent]?: string } = {
      heroTitle: 'Judul Hero',
      heroSubtitle: 'Subjudul Hero',
      heroBadge: 'Badge Hero',
      heroDescription: 'Deskripsi Hero',
      heroCtaPrimary: 'Tombol CTA Utama',
      heroCtaSecondary: 'Tombol CTA Sekunder',
      aboutTitle: 'Judul Story',
      aboutTagline: 'Tagline Story',
      aboutDescription1: 'Paragraf Story 1',
      aboutDescription2: 'Paragraf Story 2',
      collectionTitle: 'Judul Koleksi',
      collectionDescription: 'Deskripsi Koleksi',
      ctaBadge: 'Badge CTA',
      ctaTitle1: 'Judul CTA 1',
      ctaTitle2: 'Judul CTA 2',
      ctaDescription: 'Deskripsi CTA',
      whatsappLink: 'Link WhatsApp',
      instagramLink: 'Link Instagram',
      mapsLink: 'Link Google Maps',
      footerAbout: 'Tentang (Footer)',
      footerCopyright: 'Copyright',
      footerTagline: 'Tagline (Footer)'
    };
    
    (Object.keys(fieldMapping) as (keyof SiteContent)[]).forEach(field => {
      if (prev[field] !== next[field]) {
        changes.push(`Update ${fieldMapping[field]}`);
      }
    });

    // Check Features
    if (JSON.stringify(prev.features) !== JSON.stringify(next.features)) {
      changes.push('Pembaruan Fitur Unggulan');
    }

    // Check Stats
    if (JSON.stringify(prev.stats) !== JSON.stringify(next.stats)) {
      changes.push('Pembaruan Statistik');
    }

    // Check Navigation
    const navFields: (keyof SiteContent)[] = ['navCollection', 'navAbout', 'navContact', 'navOrder'];
    navFields.forEach(f => {
      if (prev[f] !== next[f]) {
        changes.push(`Update Menu: ${next[f]}`);
      }
    });

    // Check Products
    if (prev.products.length !== next.products.length) {
      if (next.products.length > prev.products.length) {
        const added = next.products.find(p => !prev.products.find(op => op.id === p.id));
        changes.push(`Tambah produk baru: "${added?.name || 'Unknown'}"`);
      } else {
        const removed = prev.products.find(p => !next.products.find(np => np.id === p.id));
        changes.push(`Hapus produk: "${removed?.name || 'Unknown'}"`);
      }
    } else {
      next.products.forEach((p, i) => {
        const oldP = prev.products.find(op => op.id === p.id);
        if (oldP && JSON.stringify(p) !== JSON.stringify(oldP)) {
          const detailChanges: string[] = [];
          if (p.name !== oldP.name) detailChanges.push(`Nama berubah`);
          if (p.price !== oldP.price) detailChanges.push(`Harga: ${oldP.price} → ${p.price}`);
          if (p.image !== oldP.image) detailChanges.push(`Gambar diganti`);
          if (p.imagePosition !== oldP.imagePosition) detailChanges.push(`Posisi gambar diatur ulang`);
          if (p.waLink !== oldP.waLink) detailChanges.push(`Link WA diupdate`);
          
          if (detailChanges.length > 0) {
            changes.push(`Edit "${p.name}": ${detailChanges.join(', ')}`);
          } else {
            changes.push(`Update detail produk: "${p.name}"`);
          }
        }
      });
    }

    return changes.length > 0 ? changes.join(' | ') : null;
  };

  const handleRestore = (record: HistoryRecord) => {
    // Logic same as save but with different type
    const newRecord: HistoryRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      type: 'restore',
      label: 'Pemulihan Data',
      details: `Restorasi ke versi ${new Date(record.timestamp).toLocaleString()}`,
      previousState: JSON.parse(JSON.stringify(content))
    };

    const updatedHistory = [newRecord, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('apsari_history', JSON.stringify(updatedHistory));

    setContent(record.previousState);
    localStorage.setItem('apsari_content', JSON.stringify(record.previousState));
    triggerSave();
  };

  const handleStartEditingSection = (section: string) => {
    setEditingSection(section);
    setTempContent(JSON.parse(JSON.stringify(content)));
  };

  const handleSaveSection = async (logLabel: string) => {
    if (tempContent) {
      // Format URLs to ensure they have protocol
      if (editingSection === 'social') {
        const formatIgUrl = (url: string) => {
          if (!url) return url;
          const trimmedInfo = url.trim();
          if (!trimmedInfo.startsWith('http://') && !trimmedInfo.startsWith('https://')) {
            return `https://${trimmedInfo}`;
          }
          return trimmedInfo;
        };

        const formatWaUrl = (url: string) => {
          if (!url) return url;
          let trimmedWa = url.trim();
          // If the user just typed numbers or numbers starting with + / 0
          if (/^[\+]?[0-9\s\-]+$/.test(trimmedWa)) {
              let cleanNum = trimmedWa.replace(/\D/g, '');
              if (cleanNum.startsWith('0')) cleanNum = '62' + cleanNum.substring(1);
              return `https://wa.me/${cleanNum}`;
          }
          if (!trimmedWa.startsWith('http://') && !trimmedWa.startsWith('https://')) {
            return `https://${trimmedWa}`;
          }
          return trimmedWa;
        };
        
        tempContent.instagramLink = formatIgUrl(tempContent.instagramLink);
        tempContent.whatsappLink = formatWaUrl(tempContent.whatsappLink);
      }

      // Early exit if no changes
      if (JSON.stringify(tempContent) === JSON.stringify(content)) {
        handleCancelSection();
        return;
      }

      // Special Logic: Propagate WhatsApp Link to all products if modified in Social Section
      let updatingProductsFromSocial = false;
      if (editingSection === 'social' && tempContent.whatsappLink !== content.whatsappLink) {
        const digits = tempContent.whatsappLink.replace(/\D/g, '');
        if (digits.length >= 10) {
          tempContent.products = tempContent.products.map(p => ({
            ...p,
            waLink: p.waLink.replace(/wa\.me\/[0-9]*/, `wa.me/${digits}`)
          }));
          updatingProductsFromSocial = true;
        }
      }

      setIsSavingContentToGithub(true);

      try {
        const isOurStorySection = editingSection ? ['aboutText', 'aboutStory', 'aboutStats'].includes(editingSection) : false;
        const fileNameToPush = isOurStorySection ? 'our-story.json' : 'main-content.json';
        
        let payload: any = {};
        if (isOurStorySection) {
          payload = {
            aboutTagline: tempContent.aboutTagline,
            aboutTitle: tempContent.aboutTitle,
            aboutDescription1: tempContent.aboutDescription1,
            aboutDescription2: tempContent.aboutDescription2,
            storyImage1Url: tempContent.storyImage1Url,
            storyImage1Position: tempContent.storyImage1Position,
            storyImage1Scale: tempContent.storyImage1Scale,
            storyImage2Url: tempContent.storyImage2Url,
            storyImage2Position: tempContent.storyImage2Position,
            storyImage2Scale: tempContent.storyImage2Scale,
            stats: tempContent.stats
          };
        } else {
          payload = { ...tempContent };
          delete payload.products;
          delete payload.aboutTagline;
          delete payload.aboutTitle;
          delete payload.aboutDescription1;
          delete payload.aboutDescription2;
          delete payload.storyImage1Url;
          delete payload.storyImage1Position;
          delete payload.storyImage1Scale;
          delete payload.storyImage2Url;
          delete payload.storyImage2Position;
          delete payload.storyImage2Scale;
          delete payload.stats;
        }

        // Push to github
        await pushDataToGithub(fileNameToPush, payload);

        // If products were updated structurally via social WA changes, also push products
        if (updatingProductsFromSocial) {
           await pushDataToGithub('products.json', tempContent.products);
        }

        saveContent(tempContent, 'content', logLabel);
        setEditingSection(null);
        setTempContent(null);
        showNotify('success', 'Perubahan berhasil disimpan ke GitHub!');
      } catch (err: any) {
        showNotify('error', err.message || 'Periksa koneksi atau Token GitHub kamu.');
      } finally {
        setIsSavingContentToGithub(false);
      }
    }
  };

  const handleCancelSection = () => {
    setEditingSection(null);
    setTempContent(null);
  };

  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    setSettingsMessage(null);
    
    // Validation: Ensure both fields are filled
    if (!githubRepo.trim() || !githubToken.trim()) {
      setSettingsMessage({ type: 'error', text: 'Token GitHub dan Repository harus diisi!' });
      setIsSavingSettings(false);
      setTimeout(() => setSettingsMessage(null), 5000);
      return;
    }

    try {
      localStorage.setItem('apsari_github_repo', githubRepo);
      localStorage.setItem('apsari_github_token', githubToken);
      setSettingsMessage({ type: 'success', text: 'Kredensial berhasil disimpan!' });
      showNotify('success', 'Kredensial GitHub telah diperbarui.');
    } catch (err: any) {
      setSettingsMessage({ type: 'error', text: 'Gagal menyimpan kredensial.' });
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSettingsMessage(null), 3000);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'Apsarijogja' && loginForm.password === 'Apsarijogja#2426') {
      setIsLoggedIn(true);
      setCurrentView('admin');
      localStorage.setItem('apsari_logged_in', 'true');
      setError('');
    } else {
      setError('Akses ditolak. Cek kembali username & password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('store');
    localStorage.removeItem('apsari_logged_in');
  };

  const triggerSave = () => {
    showNotify('success', 'Updated Successfully');
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const newProducts = [...content.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    saveContent({ ...content, products: newProducts });
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now(),
      name: "New Cookie",
      tagline: "Delicious Taste",
      description: "Brief description of the cookie.",
      details: "Packaging info",
      price: "Rp 0",
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=600&auto=format&fit=crop",
      badge: "🆕",
      waLink: "https://wa.me/6285624237125",
      whatsappMessage: "Halo Apsari Patisserie, saya ingin pesan produk ini!",
      imagePosition: "center",
      imageScale: 1
    };
    setTempProduct(newProduct);
    setIsEditingProduct(true);
    setSelectedProductId(newProduct.id);
  };

  const removeProduct = async (id: number) => {
    const pToRemove = content.products.find(p => p.id === id);
    if (!pToRemove) return;
    
    if (!confirm(`Yakin ingin menghapus produk ${pToRemove.name}?`)) return;

    const newProducts = content.products.filter(p => p.id !== id);
    
    setIsSavingProductToGithub(true);
    try {
      await pushDataToGithub('products.json', newProducts);
      saveContent({ ...content, products: newProducts }, 'product_delete', `Hapus Produk: ${pToRemove.name}`);
      setContent({ ...content, products: newProducts });
      if (selectedProductId === id) {
        setSelectedProductId(newProducts[0]?.id || null);
      }
      showNotify('success', 'Produk berhasil dihapus dari GitHub!');
    } catch (err: any) {
      showNotify('error', err.message || 'Gagal menghapus produk.');
    } finally {
      setIsSavingProductToGithub(false);
    }
  };

  const handleStartEdit = (product: Product) => {
    setTempProduct({ ...product });
    setIsEditingProduct(true);
  };

  const handleCancelEdit = () => {
    setTempProduct(null);
    setIsEditingProduct(false);
  };

  const handleSaveProductEdits = async () => {
    if (!tempProduct) return;
    
    // Format waLink to ensure protocol
    if (tempProduct.waLink) {
      let trimmedWa = tempProduct.waLink.trim();
      if (/^[\+]?[0-9\s\-]+$/.test(trimmedWa)) {
          let cleanNum = trimmedWa.replace(/\D/g, '');
          if (cleanNum.startsWith('0')) cleanNum = '62' + cleanNum.substring(1);
          tempProduct.waLink = `https://wa.me/${cleanNum}`;
      } else if (!trimmedWa.startsWith('http://') && !trimmedWa.startsWith('https://')) {
        tempProduct.waLink = `https://${trimmedWa}`;
      }
      // Ensure we strip query text from waLink to keep it clean
      tempProduct.waLink = tempProduct.waLink.split('?')[0];
    }

    // Check if product actually changed
    const oldProduct = content.products.find(p => p.id === tempProduct.id);
    if (oldProduct && JSON.stringify(oldProduct) === JSON.stringify(tempProduct)) {
      handleCancelEdit();
      return;
    }

    const isNewProduct = !oldProduct;
    let newProducts;

    if (isNewProduct) {
      newProducts = [...content.products, tempProduct];
    } else {
      newProducts = content.products.map(p => p.id === tempProduct.id ? tempProduct : p);
    }
    
    setIsSavingProductToGithub(true);
    try {
      await pushDataToGithub('products.json', newProducts);
      
      // Update local state and history after successful GitHub push
      if (isNewProduct) {
        saveContent({ ...content, products: newProducts }, 'product_add', `Tambah produk: ${tempProduct.name}`);
      } else {
        saveContent({ ...content, products: newProducts }, 'product_edit', `Edit Produk: ${tempProduct.name}`);
      }
      setContent({ ...content, products: newProducts }); // Ensure local state has updated products

      showNotify('success', 'Produk berhasil di-push ke GitHub!');
      setIsEditingProduct(false);
      setTempProduct(null);
    } catch (err: any) {
      showNotify('error', err.message || 'Periksa koneksi atau Token GitHub kamu.');
    } finally {
      setIsSavingProductToGithub(false);
    }
  };

  return (
    <div className="min-h-screen relative font-sans selection:bg-brand-gold selection:text-white bg-white w-full overflow-x-hidden">
      
      {/* --- STOREFRONT VIEW --- */}
      {currentView === 'store' && (
        <Storefront 
          content={content} 
          isLoggedIn={isLoggedIn} 
          onAdminClick={() => isLoggedIn ? setCurrentView('admin') : setCurrentView('login')} 
          imageRefreshKey={imageRefreshKey}
          trackLinkClick={trackLinkClick}
          trackProductClick={trackProductClick}
        />
      )}

      {/* --- LOGIN VIEW --- */}
      {currentView === 'login' && (
        <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center p-6 relative overflow-hidden text-brand-dark">
          <div className="absolute inset-0 z-0">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-soft rounded-full blur-[120px] opacity-30"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-[120px] opacity-30"></div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl border border-brand-gold/10"
          >
            <button 
              onClick={() => setCurrentView('store')}
              className="absolute top-8 right-8 p-2 text-gray-300 hover:text-brand-gold transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutDashboard className="w-8 h-8 text-brand-gold" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-brand-dark mb-2">Portal Admin</h2>
              <p className="text-[9px] text-gray-400 uppercase tracking-[0.25em] font-black">Apsari Patisserie CRM</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Username</label>
                <input 
                  type="text" 
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-gold/30 rounded-2xl outline-none transition-all text-sm font-medium"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Password</label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-gold/30 rounded-2xl outline-none transition-all text-sm font-medium"
                  placeholder="Enter password"
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest bg-red-50 py-3 rounded-lg border border-red-100 italic">
                  {error}
                </p>
              )}
              
              <button 
                type="submit"
                className="btn-primary w-full py-5 rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-brand-gold/20"
              >
                Akses Dashboard
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- ADMIN DASHBOARD VIEW --- */}
      {currentView === 'admin' && (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#FDFDFC] text-brand-dark font-sans overflow-hidden">
          
          {/* External Sidebar Toggle Button (Desktop) */}
          <button 
            onClick={() => setIsAdminSidebarCollapsed(!isAdminSidebarCollapsed)}
            className={`hidden md:flex fixed top-6 z-[60] p-2 bg-white border border-gray-100 rounded-lg shadow-sm text-brand-dark hover:text-brand-gold transition-all duration-300 focus:outline-none ${isAdminSidebarCollapsed ? 'left-5' : 'left-[13.5rem]'}`}
          >
            {isAdminSidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>

          {/* Desktop & Mobile Sidebar Navigation */}
          <aside className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 md:flex ${isAdminSidebarCollapsed ? 'md:w-20' : 'w-64 md:w-60'} bg-white border-r border-[#F1E9E0] flex flex-col h-screen shrink-0 transition-all duration-300 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)]`}>
            <div className={`p-6 border-b border-[#F1E9E0] flex items-center justify-between gap-3 h-[89px] transition-opacity duration-300 ${isAdminSidebarCollapsed ? 'md:opacity-0 md:pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center text-white font-serif font-bold text-xl shrink-0 shadow-lg shadow-brand-gold/20">A</div>
                <div className="overflow-hidden">
                  <h1 className="font-serif text-lg font-bold text-brand-dark whitespace-nowrap">Apsari<span className="text-brand-gold">.</span></h1>
                  <p className="text-[8px] font-black uppercase tracking-widest text-brand-gold leading-none">Management Hub</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden p-2 text-gray-400 hover:text-brand-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-grow p-4 lg:p-6 space-y-2 overflow-y-auto custom-scrollbar">
              {[
                { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                { id: 'content', icon: FileText, label: 'Main Content' },
                { id: 'about', icon: Heart, label: 'Our Story' },
                { id: 'products', icon: ShoppingBag, label: 'Inventory' },
                { id: 'history', icon: RotateCcw, label: 'Histori' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveAdminTab(tab.id as AdminTab);
                    setIsMobileMenuOpen(false); // Auto close on mobile
                  }}
                  className={`w-full flex items-center p-3.5 my-1 rounded-xl transition-all group relative ${
                    activeAdminTab === tab.id 
                    ? 'bg-brand-soft text-brand-gold font-bold shadow-sm' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-brand-dark'
                  } ${isAdminSidebarCollapsed ? 'md:justify-center' : 'justify-start gap-4 px-3.5'}`}
                  title={tab.label}
                >
                  <tab.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${activeAdminTab === tab.id ? '' : 'text-gray-500 group-hover:text-brand-dark'}`} />
                  {!isAdminSidebarCollapsed && <span className="text-sm font-semibold whitespace-nowrap hidden md:block">{tab.label}</span>}
                  <span className="text-sm font-semibold whitespace-nowrap md:hidden">{tab.label}</span>
                  {activeAdminTab === tab.id && !isAdminSidebarCollapsed && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-brand-gold" />
                  )}
                  {activeAdminTab === tab.id && isAdminSidebarCollapsed && (
                    <div className="hidden md:block absolute inset-y-2 left-0 w-1 bg-brand-gold rounded-full" />
                  )}
                </button>
              ))}
            </nav>

            <div className={`hidden md:flex flex-col p-4 space-y-2 bg-[#FCFAF7]/30`}>
              <button 
                onClick={() => setCurrentView('store')}
                className={`flex items-center p-3 text-sm text-gray-600 hover:text-brand-gold hover:bg-orange-50 transition-colors w-full rounded-xl ${isAdminSidebarCollapsed ? 'md:justify-center' : 'justify-start gap-3'}`}
                title="Lihat Situs"
              >
                <Eye className="w-5 h-5 shrink-0" />
                {!isAdminSidebarCollapsed && <span className="whitespace-nowrap hidden md:block">Lihat Landing Page</span>}
                <span className="whitespace-nowrap md:hidden">Lihat Landing Page</span>
              </button>
              <button 
                onClick={handleLogout}
                className={`flex items-center p-3 text-sm text-red-500 hover:bg-red-50 transition-colors w-full mt-auto rounded-xl ${isAdminSidebarCollapsed ? 'md:justify-center' : 'justify-start gap-3'}`}
                title="Logout"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {!isAdminSidebarCollapsed && <span className="whitespace-nowrap hidden md:block">Logout</span>}
                <span className="whitespace-nowrap md:hidden">Logout</span>
              </button>
            </div>
          </aside>

          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-5 left-4 right-4 z-50 bg-white/90 backdrop-blur-xl border border-[#F1E9E0] px-2 py-2 rounded-2xl flex items-center justify-around shadow-2xl shadow-brand-dark/5">
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'Hub' },
              { id: 'content', icon: FileText, label: 'Edit' },
              { id: 'about', icon: Heart, label: 'Story' },
              { id: 'products', icon: ShoppingBag, label: 'Katalog' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as AdminTab)}
                className={`flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all relative ${
                  activeAdminTab === tab.id
                  ? 'text-brand-gold' 
                  : 'text-gray-400'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeAdminTab === tab.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[8px] font-black uppercase tracking-tighter">{tab.label}</span>
                {activeAdminTab === tab.id && (
                  <motion.div layoutId="bottomActive" className="absolute -top-3 w-4 h-1 bg-brand-gold rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Main Dashboard Content */}
          <main className="flex-grow overflow-y-auto pb-24 md:pb-0 h-screen custom-scrollbar">
            {/* Floating Save Toast */}
            <div className="fixed top-8 right-8 z-[100]">
              <AnimatePresence>
                {adminNotification && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, x: 20, y: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border backdrop-blur-md ${
                      adminNotification.type === 'success' 
                        ? 'bg-green-50/90 text-green-700 border-green-100' 
                        : 'bg-red-50/90 text-red-700 border-red-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      adminNotification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {adminNotification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50 leading-none mb-1">
                        {adminNotification.type === 'success' ? 'Notification' : 'System Error'}
                      </p>
                      <p className="text-xs font-bold leading-tight tracking-tight">
                        {adminNotification.text}
                      </p>
                    </div>
                    <button 
                      onClick={() => setAdminNotification(null)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                       <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dashboard Body */}
            <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full">
              
              <AnimatePresence mode="wait">
                {/* Tab: Overview */}
                {activeAdminTab === 'overview' && (
                  <motion.div 
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 sm:space-y-8"
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
                      {/* Total Products Card */}
                      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-3 md:mb-4">
                          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 bg-brand-soft text-brand-gold shadow-inner transition-transform group-hover:scale-110`}>
                            <Package className="w-4 h-4 lg:w-5 lg:h-5" />
                          </div>
                          <span className="text-[8px] md:text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded select-none">Live</span>
                        </div>
                        <div>
                          <h3 className="text-xs md:text-sm font-serif font-bold text-gray-600 mb-0.5">Product Lineup</h3>
                          <div className="flex items-baseline gap-1.5 md:gap-2">
                             <span className="text-2xl md:text-3xl font-black text-brand-dark leading-none">{content.products.length}</span>
                             <span className="text-[9px] md:text-xs font-semibold text-gray-400">Active SKU</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Visitors Card */}
                      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-3 md:mb-4">
                          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-500 shadow-inner transition-transform group-hover:scale-110`}>
                            <Users className="w-4 h-4 lg:w-5 lg:h-5" />
                          </div>
                          <span className="text-[8px] md:text-[9px] font-bold text-blue-500/80 bg-blue-50/50 px-2 py-1 rounded select-none shadow-sm relative flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>Tracked</span>
                        </div>
                        <div>
                          <h3 className="text-xs md:text-sm font-serif font-bold text-gray-600 mb-0.5">Audience Traffic</h3>
                          <div className="flex items-baseline gap-1.5 md:gap-2">
                             <span className="text-2xl md:text-3xl font-black text-brand-dark leading-none">{analytics.totalVisitors.toLocaleString()}</span>
                             <span className="text-[9px] md:text-xs font-semibold text-gray-400">Unique Visitors</span>
                          </div>
                        </div>
                      </div>

                      {/* CTA Clicks Card */}
                      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-3 md:mb-4">
                          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600 shadow-inner transition-transform group-hover:scale-110`}>
                            <MousePointerClick className="w-4 h-4 lg:w-5 lg:h-5" />
                          </div>
                          <span className="text-[8px] md:text-[9px] font-bold text-purple-600/80 bg-purple-50/50 px-2 py-1 rounded select-none shadow-sm">Engagement</span>
                        </div>
                        <div>
                          <h3 className="text-xs md:text-sm font-serif font-bold text-gray-600 mb-0.5">Social Engagement</h3>
                          <div className="flex items-baseline gap-1.5 md:gap-2">
                             <span className="text-2xl md:text-3xl font-black text-brand-dark leading-none">{(analytics.linkClicks || 0).toLocaleString()}</span>
                             <span className="text-[9px] md:text-xs font-semibold text-gray-400">Link Taps</span>
                          </div>
                        </div>
                      </div>

                      {/* Product Clicks Card (Replaces Server Status) */}
                      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-3 md:mb-4">
                          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 bg-green-50 text-green-500 shadow-inner transition-transform group-hover:scale-110`}>
                            <Activity className="w-4 h-4 lg:w-5 lg:h-5" />
                          </div>
                          <span className="text-[8px] md:text-[9px] font-bold text-green-600 bg-green-50/80 px-2 py-1 rounded select-none flex items-center gap-1.5 shadow-sm">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                            Active
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs md:text-sm font-serif font-bold text-gray-600 mb-0.5">Order Intent</h3>
                          <div className="flex items-baseline gap-1.5 md:gap-2">
                             <span className="text-2xl md:text-3xl font-black text-green-500 leading-none">{(analytics.productClicks || 0).toLocaleString()}</span>
                             <span className="text-[9px] md:text-xs font-semibold text-gray-400">WA Leads</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-3xl p-5 sm:p-8 lg:p-12 text-brand-dark relative overflow-hidden group border border-[#F1E9E0] shadow-sm">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000 rotate-12">
                          <LayoutDashboard className="w-64 h-64" />
                        </div>
                        <div className="relative z-10 text-left max-w-2xl">
                           <div className="flex items-center gap-2 mb-4 sm:mb-6">
                             <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                             <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-brand-gold border-b border-brand-gold/20 pb-1">Dashboard Management Center</span>
                           </div>
                           <h3 className="text-2xl sm:text-3xl lg:text-5xl font-serif font-black mb-4 sm:mb-6 leading-[1.1] text-brand-dark tracking-tighter">Your Digital<br/><span className="text-brand-gold italic">Presence Hub.</span></h3>
                           <p className="text-gray-500 text-xs sm:text-sm lg:text-base leading-relaxed font-light italic mb-8 sm:mb-12 max-w-lg">
                             Kelola profil toko, inventaris produk, hingga detail cerita brand kamu secara langsung. Setiap perubahan yang kamu simpan akan tampil seketika di halaman utama.
                           </p>
                           <div className="flex flex-wrap gap-4">
                             <button 
                               onClick={() => setActiveAdminTab('products')} 
                               className="px-6 sm:px-8 py-3.5 sm:py-4 bg-brand-gold text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-gold/20 hover:brightness-110 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                             >
                               Update Inventory
                             </button>
                             <button 
                               onClick={() => setActiveAdminTab('content')} 
                               className="px-6 sm:px-8 py-3.5 sm:py-4 bg-brand-soft text-brand-gold border border-brand-gold/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm w-full sm:w-auto"
                             >
                               Edit Site Content
                             </button>
                           </div>
                        </div>
                    </div>

                    {/* QUICK ACTIONS: KHUSUS MOBILE (Sembunyi di Desktop) */}
                    <div className="flex md:hidden flex-col sm:flex-row gap-3 mt-4">
                      <button 
                        onClick={() => setCurrentView('store')}
                        className="flex-1 flex items-center justify-center gap-2 p-3.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:text-brand-gold hover:border-brand-gold hover:bg-orange-50 transition-all shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat Landing Page
                      </button>

                      <button 
                        onClick={handleLogout}
                        className="flex-1 flex items-center justify-center gap-2 p-3.5 bg-red-50/80 border border-red-100 rounded-xl text-xs font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Tab: Content (Copywriting) */}
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
                            onClick={() => setActiveContentTab(tab.id as 'hero' | 'nav' | 'features' | 'footer')}
                            className={`whitespace-nowrap px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                              activeContentTab === tab.id 
                              ? 'text-brand-dark border-b-3 border-brand-gold bg-brand-soft/30' 
                              : 'text-gray-400 hover:text-brand-dark hover:bg-gray-50'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-10">
                        {activeContentTab === 'nav' && (
                          <div className="space-y-10">
                            {/* Navigation Editor */}
                    <section className="bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-black text-brand-dark">Navigation & Links</h3>
                            <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest">Menu Labels & Header</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {editingSection === 'nav' ? (
                             <>
                               <button onClick={handleCancelSection} className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Menu Navigasi')} disabled={isSavingContentToGithub} className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('nav')} className="w-full sm:w-auto px-6 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Product Nav', field: 'navCollection' },
                          { label: 'Story Nav', field: 'navAbout' },
                          { label: 'Contact Nav', field: 'navContact' },
                          { label: 'CTA Nav', field: 'navOrder' }
                        ].map(item => (
                          <div key={item.field} className="relative group">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">{item.label}</label>
                            <input 
                              disabled={editingSection !== 'nav'}
                              value={editingSection === 'nav' ? (tempContent as any)[item.field] : (content as any)[item.field]}
                              onChange={(e) => setTempContent({ ...tempContent!, [item.field]: e.target.value })}
                              className={`w-full bg-white border border-[#F1E9E0] rounded-xl px-4 py-3 text-xs font-bold text-brand-dark transition-all ${editingSection !== 'nav' ? 'opacity-50 grayscale bg-[#FAFAFA]' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                          </div>
                        )}
                        {activeContentTab === 'hero' && (
                          <div className="space-y-10">

                    <section className="bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-black text-brand-dark">Hero Section</h3>
                            <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest">Main Banner & Visuals</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {editingSection === 'hero' ? (
                             <>
                               <button onClick={handleCancelSection} className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Banner Hero')} disabled={isSavingContentToGithub} className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('hero')} className="w-full sm:w-auto px-6 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Hero Badge Tagline</label>
                          <input 
                            disabled={editingSection !== 'hero'}
                            value={editingSection === 'hero' ? tempContent?.heroBadge : content.heroBadge}
                            onChange={(e) => setTempContent({ ...tempContent!, heroBadge: e.target.value })}
                            className={`w-full bg-white border border-[#F1E9E0] rounded-xl px-4 py-3 text-xs font-bold text-brand-dark transition-all ${editingSection !== 'hero' ? 'opacity-50 grayscale bg-[#FAFAFA]' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Hero Title (Main)</label>
                            <input 
                              disabled={editingSection !== 'hero'}
                              value={editingSection === 'hero' ? tempContent?.heroTitle : content.heroTitle}
                              onChange={(e) => setTempContent({ ...tempContent!, heroTitle: e.target.value })}
                              className={`w-full bg-white border border-[#F1E9E0] rounded-xl px-4 py-3 text-xs font-bold text-brand-dark transition-all ${editingSection !== 'hero' ? 'opacity-50 grayscale bg-[#FAFAFA]' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Hero Subtitle (Italic)</label>
                            <input 
                              disabled={editingSection !== 'hero'}
                              value={editingSection === 'hero' ? tempContent?.heroSubtitle : content.heroSubtitle}
                              onChange={(e) => setTempContent({ ...tempContent!, heroSubtitle: e.target.value })}
                              className={`w-full bg-white border border-[#F1E9E0] rounded-xl px-4 py-3 text-xs font-serif font-bold italic text-brand-dark transition-all ${editingSection !== 'hero' ? 'opacity-50 grayscale bg-[#FAFAFA]' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Hero Description</label>
                          <textarea 
                            disabled={editingSection !== 'hero'}
                            value={editingSection === 'hero' ? tempContent?.heroDescription : content.heroDescription}
                            onChange={(e) => setTempContent({ ...tempContent!, heroDescription: e.target.value })}
                            className={`w-full bg-white border border-[#F1E9E0] rounded-2xl px-4 py-4 text-xs font-medium leading-relaxed text-gray-500 italic h-32 resize-none transition-all ${editingSection !== 'hero' ? 'opacity-50 grayscale bg-[#FAFAFA]' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Hero Image URL</label>
                            {editingSection === 'hero' && (
                              <button 
                                onClick={() => {
                                  setImageRefreshKey(prev => prev + 1);
                                  if (tempContent?.heroImageUrl) {
                                    setTempContent({ ...tempContent, heroImageUrl: processImageUrl(tempContent.heroImageUrl) });
                                  }
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-brand-soft text-brand-gold rounded-lg hover:bg-brand-gold hover:text-white transition-all text-[8px] font-black uppercase tracking-widest border border-brand-gold/5"
                                title="Refresh Image"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                Refresh
                              </button>
                            )}
                          </div>
                          <div className="space-y-4">
                             <div className="relative">
                               <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                               <input 
                                 disabled={editingSection !== 'hero'}
                                 value={editingSection === 'hero' ? tempContent?.heroImageUrl : content.heroImageUrl}
                                 onChange={(e) => {
                                   const url = e.target.value;
                                   const finalUrl = processImageUrl(url);
                                   setTempContent({ ...tempContent!, heroImageUrl: finalUrl });
                                 }}
                                 className={`w-full bg-white border border-[#F1E9E0] rounded-xl pl-12 pr-4 py-3 text-[10px] font-bold text-brand-dark transition-all ${editingSection !== 'hero' ? 'opacity-50 grayscale bg-[#FAFAFA]' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                                 placeholder="https://..."
                               />
                             </div>
                             
                             {editingSection === 'hero' && (
                               <div className="flex-grow flex flex-col pt-1">
                                 <div className="flex justify-between items-center mb-2">
                                   <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Visual Framing (Crop & Zoom)</label>
                                   <div className="flex gap-2">
                                     <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">X: {parseImagePosition(tempContent?.heroImageUrlPosition || content.heroImageUrlPosition).x}%</span>
                                     <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">Y: {parseImagePosition(tempContent?.heroImageUrlPosition || content.heroImageUrlPosition).y}%</span>
                                     <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">Z: {tempContent?.heroImageUrlScale || content.heroImageUrlScale || 1}x</span>
                                   </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-3 mb-4">
                                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter shrink-0">ZOOM</span>
                                   <input 
                                     type="range" min="1" max="4" step="0.01"
                                     value={tempContent?.heroImageUrlScale || content.heroImageUrlScale || 1}
                                     onChange={(e) => setTempContent({ ...tempContent!, heroImageUrlScale: parseFloat(e.target.value) })}
                                     className="flex-grow accent-brand-gold h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                     disabled={editingSection !== 'hero'}
                                   />
                                 </div>
                               </div>
                             )}

                             <div 
                               className={`relative overflow-hidden w-full aspect-video rounded-2xl bg-gray-50/50 border-2 border-brand-gold/20 shadow-inner ${editingSection === 'hero' ? 'cursor-move select-none touch-none' : ''}`}
                               onMouseDown={(e) => editingSection === 'hero' && handleImageMouseDown(e, 'hero')}
                               onMouseMove={(e) => editingSection === 'hero' && handleImageMouseMove(e, 'hero')}
                               onMouseUp={handleImageMouseUp}
                               onMouseLeave={handleImageMouseUp}
                               onTouchStart={(e) => editingSection === 'hero' && handleImageMouseDown(e, 'hero')}
                               onTouchMove={(e) => editingSection === 'hero' && handleImageMouseMove(e, 'hero')}
                               onTouchEnd={handleImageMouseUp}
                             >
                                <img 
                                  key={`hero-edit-preview-${imageRefreshKey}`}
                                  src={processImageUrl(editingSection === 'hero' ? tempContent?.heroImageUrl || content.heroImageUrl : content.heroImageUrl)} 
                                  className="w-full h-full pointer-events-none object-cover"
                                  style={{ 
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    transform: `scale(${editingSection === 'hero' ? (tempContent?.heroImageUrlScale || 1) : (content.heroImageUrlScale || 1)}) translate(${50 - parseImagePosition(editingSection === 'hero' ? tempContent?.heroImageUrlPosition : content.heroImageUrlPosition).x}%, ${50 - parseImagePosition(editingSection === 'hero' ? tempContent?.heroImageUrlPosition : content.heroImageUrlPosition).y}%)`
                                  }}
                                  alt="Framing Preview"
                                  onLoad={(e) => e.currentTarget.classList.add('opacity-100')} crossOrigin="anonymous" referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 pointer-events-none border border-white/20"></div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Features Editor */}
                          </div>
                        )}
                        {activeContentTab === 'features' && (
                          <div className="space-y-10">

                    <section className="bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-brand-dark">Features & Selling Points</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Trust Badges & Values</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {editingSection === 'features' ? (
                             <>
                               <button onClick={handleCancelSection} className="px-6 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Fitur Unggulan')} disabled={isSavingContentToGithub} className="px-8 py-2.5 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('features')} className="px-8 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all flex items-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(editingSection === 'features' ? tempContent!.features : content.features).map((feature, i) => (
                          <div key={i} className="space-y-4 p-4 bg-[#FBFBF9] rounded-2xl border border-[#F1E9E0]">
                             <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-2">Feature {i+1}</p>
                             <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Label</label>
                                <input 
                                  disabled={editingSection !== 'features'}
                                  value={feature.label}
                                  onChange={(e) => { 
                                    const newFeatures = [...tempContent!.features];
                                    newFeatures[i].label = e.target.value;
                                    setTempContent({ ...tempContent!, features: newFeatures });
                                  }}
                                  className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all ${editingSection !== 'features' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                                />
                             </div>
                             <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Subtitle</label>
                                <input 
                                  disabled={editingSection !== 'features'}
                                  value={feature.sub}
                                  onChange={(e) => { 
                                    const newFeatures = [...tempContent!.features];
                                    newFeatures[i].sub = e.target.value;
                                    setTempContent({ ...tempContent!, features: newFeatures });
                                  }}
                                  className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all ${editingSection !== 'features' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                                />
                             </div>
                          </div>
                        ))}
                      </div>
                    </section>
                          </div>
                        )}
                        {activeContentTab === 'hero' && (
                          <div className="space-y-10">

                    <section className="bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-brand-dark">Collection Introduction</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Featured Section Header</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {editingSection === 'collectionHeader' ? (
                             <>
                               <button onClick={handleCancelSection} className="px-6 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Header Koleksi')} disabled={isSavingContentToGithub} className="px-8 py-2.5 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('collectionHeader')} className="px-8 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all flex items-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Section Title</label>
                          <input 
                            disabled={editingSection !== 'collectionHeader'}
                            value={editingSection === 'collectionHeader' ? tempContent?.collectionTitle : content.collectionTitle}
                            onChange={(e) => setTempContent({ ...tempContent!, collectionTitle: e.target.value })}
                            className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all ${editingSection !== 'collectionHeader' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Intro Description</label>
                          <textarea 
                            disabled={editingSection !== 'collectionHeader'}
                            value={editingSection === 'collectionHeader' ? tempContent?.collectionDescription : content.collectionDescription}
                            onChange={(e) => setTempContent({ ...tempContent!, collectionDescription: e.target.value })}
                            className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all h-24 leading-relaxed ${editingSection !== 'collectionHeader' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <MessageCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-brand-dark">CTA & Interaction</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Closing Sections</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {editingSection === 'cta' ? (
                             <>
                               <button onClick={handleCancelSection} className="px-6 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Section CTA')} disabled={isSavingContentToGithub} className="px-8 py-2.5 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('cta')} className="px-8 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all flex items-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">CTA Badge</label>
                          <input 
                            disabled={editingSection !== 'cta'}
                            value={editingSection === 'cta' ? tempContent?.ctaBadge : content.ctaBadge}
                            onChange={(e) => setTempContent({ ...tempContent!, ctaBadge: e.target.value })}
                            className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all ${editingSection !== 'cta' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">CTA Main Header</label>
                            <input 
                              disabled={editingSection !== 'cta'}
                              value={editingSection === 'cta' ? tempContent?.ctaTitle1 : content.ctaTitle1}
                              onChange={(e) => setTempContent({ ...tempContent!, ctaTitle1: e.target.value })}
                              className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all ${editingSection !== 'cta' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">CTA Main Header (Italic)</label>
                            <input 
                              disabled={editingSection !== 'cta'}
                              value={editingSection === 'cta' ? tempContent?.ctaTitle2 : content.ctaTitle2}
                              onChange={(e) => setTempContent({ ...tempContent!, ctaTitle2: e.target.value })}
                              className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all font-serif italic ${editingSection !== 'cta' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">CTA Full Description</label>
                          <textarea 
                            disabled={editingSection !== 'cta'}
                            value={editingSection === 'cta' ? tempContent?.ctaDescription : content.ctaDescription}
                            onChange={(e) => setTempContent({ ...tempContent!, ctaDescription: e.target.value })}
                            className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all h-24 leading-relaxed ${editingSection !== 'cta' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                          />
                        </div>
                      </div>
                    </section>
                          </div>
                        )}
                        {activeContentTab === 'footer' && (
                          <div className="space-y-10">

                    <section className="bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <LinkIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-brand-dark">Social Media Links</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Interaction Links</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {editingSection === 'social' ? (
                             <>
                               <button onClick={handleCancelSection} className="px-6 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Link Social Media')} disabled={isSavingContentToGithub} className="px-8 py-2.5 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('social')} className="px-8 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all flex items-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Instagram Profile URL</label>
                          <div className="relative">
                            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input 
                              disabled={editingSection !== 'social'}
                              value={editingSection === 'social' ? tempContent?.instagramLink : content.instagramLink}
                              onChange={(e) => setTempContent({ ...tempContent!, instagramLink: e.target.value })}
                              className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all pl-12 ${editingSection !== 'social' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                              placeholder="https://instagram.com/yourprofile"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">WhatsApp Number / Link</label>
                          <div className="relative">
                            <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input 
                              disabled={editingSection !== 'social'}
                              value={editingSection === 'social' ? tempContent?.whatsappLink : content.whatsappLink}
                              onChange={(e) => setTempContent({ ...tempContent!, whatsappLink: e.target.value })}
                              className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all pl-12 ${editingSection !== 'social' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                              placeholder="https://wa.me/number"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Google Maps Link</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input 
                              disabled={editingSection !== 'social'}
                              value={editingSection === 'social' ? tempContent?.mapsLink : content.mapsLink}
                              onChange={(e) => setTempContent({ ...tempContent!, mapsLink: e.target.value })}
                              className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all pl-12 ${editingSection !== 'social' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                              placeholder="https://maps.app.goo.gl/..."
                            />
                          </div>
                        </div>
                      </div>
                      <p className="mt-6 text-[10px] text-gray-400 italic px-2">
                        * Merubah link di sini akan merubah semua icon media sosial di seluruh website secara otomatis.
                      </p>
                    </section>

                    <section className="bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <LayoutDashboard className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-brand-dark">Footer Content</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Legal & Branding</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {editingSection === 'footer' ? (
                             <>
                               <button onClick={handleCancelSection} className="px-6 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Identitas Footer')} disabled={isSavingContentToGithub} className="px-8 py-2.5 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('footer')} className="px-8 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all flex items-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Footer About Text</label>
                          <textarea 
                            disabled={editingSection !== 'footer'}
                            value={editingSection === 'footer' ? tempContent?.footerAbout : content.footerAbout}
                            onChange={(e) => setTempContent({ ...tempContent!, footerAbout: e.target.value })}
                            className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all h-24 leading-relaxed ${editingSection !== 'footer' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Copyright Text</label>
                            <input 
                              disabled={editingSection !== 'footer'}
                              value={editingSection === 'footer' ? tempContent?.footerCopyright : content.footerCopyright}
                              onChange={(e) => setTempContent({ ...tempContent!, footerCopyright: e.target.value })}
                              className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all ${editingSection !== 'footer' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Footer Tagline</label>
                            <input 
                              disabled={editingSection !== 'footer'}
                              value={editingSection === 'footer' ? tempContent?.footerTagline : content.footerTagline}
                              onChange={(e) => setTempContent({ ...tempContent!, footerTagline: e.target.value })}
                              className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all ${editingSection !== 'footer' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Quick Links Heading</label>
                            <input 
                              disabled={editingSection !== 'footer'}
                              value={editingSection === 'footer' ? tempContent?.footerQuickLinksTitle : content.footerQuickLinksTitle}
                              onChange={(e) => setTempContent({ ...tempContent!, footerQuickLinksTitle: e.target.value })}
                              className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all ${editingSection !== 'footer' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Service Heading</label>
                            <input 
                              disabled={editingSection !== 'footer'}
                              value={editingSection === 'footer' ? tempContent?.footerServiceTitle : content.footerServiceTitle}
                              onChange={(e) => setTempContent({ ...tempContent!, footerServiceTitle: e.target.value })}
                              className={`w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all ${editingSection !== 'footer' ? 'opacity-50 grayscale cursor-not-allowed' : 'focus:border-brand-gold bg-white'}`}
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tab: History */}
                {activeAdminTab === 'history' && (
                  <motion.div 
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 max-w-4xl mx-auto"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                       <div className="flex items-center gap-2">
                          <History className="w-5 h-5 text-brand-gold" />
                          <h2 className="text-xl font-serif font-black text-brand-dark">Histori Update</h2>
                       </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#F1E9E0] overflow-hidden shadow-sm text-left pb-2">
                      {history.length > 0 ? (
                        <div className="flex flex-col">
                        {history.map((record) => (
                          <div key={record.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex gap-4 items-center min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                record.type === 'restore' ? 'bg-blue-50 text-blue-500' :
                                record.type.includes('product') ? 'bg-orange-50 text-orange-500' :
                                'bg-brand-soft text-brand-gold'
                              }`}>
                                {record.type === 'restore' ? <RotateCcw className="w-4 h-4" /> :
                                 record.type.includes('product') ? <Package className="w-4 h-4" /> :
                                 <FileText className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col justify-center min-w-0">
                                <h3 className="font-bold text-xs text-brand-dark truncate">{record.label}</h3>
                                <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">{record.details}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                               <span className="hidden sm:inline-block text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                 {new Date(record.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                               </span>
                               <button 
                                 onClick={() => handleRestore(record)}
                                 className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-50 hover:text-brand-dark transition-all shadow-sm"
                               >
                                 Pulihkan Data Ini
                               </button>
                            </div>
                          </div>
                        ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-white border border-[#F1E9E0] border-dashed rounded-2xl m-4">
                          <History className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Belum ada aktivitas</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Tab: Settings */}
                {activeAdminTab === 'settings' && (
                  <motion.div 
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="max-w-xl mx-auto"
                  >
                    <div className="bg-white border border-[#F1E9E0] rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_60px_-20px_rgba(156,140,127,0.1)] relative overflow-hidden">
                      <div className="flex items-center gap-6 mb-10">
                        <div className="w-16 h-16 bg-brand-soft/30 text-brand-gold rounded-2xl flex items-center justify-center shrink-0 border border-brand-soft shadow-inner">
                             <Database className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-serif text-3xl font-bold text-brand-dark mb-1">GitHub CMS</h3>
                          <p className="text-[11px] text-gray-400 font-extrabold tracking-[0.25em] uppercase">Cloud Synchronization</p>
                        </div>
                      </div>

                      <div className="space-y-8 relative z-10">
                        <div className="bg-brand-soft/20 border border-brand-gold/10 rounded-2xl p-6 flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                            <Github className="w-5 h-5 text-brand-gold" />
                          </div>
                          <div>
                            <p className="text-xs text-brand-dark/70 font-medium leading-relaxed">
                              Apsari Patisserie menggunakan <span className="text-brand-dark font-black">Git-backed CMS</span>. Setiap perubahan data produk akan disinkronkan langsung ke repository GitHub Anda melalui API.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          <div className="group">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5 block px-1 group-focus-within:text-brand-gold transition-colors">Repository Path</label>
                            <div className="relative">
                              <input 
                                type="text"
                                value={githubRepo}
                                onChange={(e) => setGithubRepo(e.target.value)}
                                className="w-full bg-[#FAF9F6] border-2 border-transparent border-b-[#F1E9E0] rounded-xl px-4 py-4 text-[13px] font-bold text-brand-dark transition-all focus:bg-white focus:border-brand-gold outline-none shadow-sm"
                                placeholder="Owner/Repo"
                              />
                            </div>
                          </div>

                          <div className="group">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5 block px-1 group-focus-within:text-brand-gold transition-colors">Personal Access Token</label>
                            <div className="relative">
                              <input 
                                type="password"
                                value={githubToken}
                                onChange={(e) => setGithubToken(e.target.value)}
                                className="w-full bg-[#FAF9F6] border-2 border-transparent border-b-[#F1E9E0] rounded-xl px-4 py-4 text-[13px] font-bold text-brand-dark transition-all font-mono focus:bg-white focus:border-brand-gold outline-none shadow-sm"
                                placeholder="ghp_••••••••••••"
                              />
                            </div>
                            <div className="mt-3 flex items-start gap-2 px-1">
                              <AlertCircle className="w-3.5 h-3.5 text-brand-gold/40 mt-0.5" />
                              <p className="text-[10px] text-gray-400 font-medium leading-normal">
                                Pastikan token memiliki scope <span className="font-bold text-gray-600">repo</span>. Token disimpan secara lokal di browser Anda.
                              </p>
                            </div>
                          </div>
                        </div>

                        {settingsMessage && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className={`p-5 rounded-2xl text-[12px] font-extrabold flex items-center gap-3 border shadow-sm ${
                              settingsMessage.type === 'success' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              settingsMessage.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {settingsMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            </div>
                            {settingsMessage.text}
                          </motion.div>
                        )}

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                           <button 
                             onClick={handleSaveSettings}
                             disabled={isSavingSettings}
                             className={`group relative overflow-hidden px-10 py-4.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl flex items-center gap-3 ${
                               isSavingSettings 
                               ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                               : 'bg-brand-gold text-white hover:shadow-brand-gold/30 hover:scale-[1.02] active:scale-[0.98]'
                             }`}
                           >
                             <span className="relative z-10 flex items-center gap-2">
                               {isSavingSettings ? (
                                 <>
                                   <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-gold rounded-full animate-spin" />
                                   Sedang Menyimpan...
                                 </>
                               ) : (
                                 <>
                                   <Save className="w-4 h-4" />
                                   Simpan Kredensial
                                 </>
                               )}
                             </span>
                             {!isSavingSettings && (
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                             )}
                           </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeAdminTab === 'products' && (
                  <motion.div 
                    key="products"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col lg:grid lg:grid-cols-12 gap-5 min-h-[500px] lg:h-[calc(100vh-180px)] overflow-visible lg:overflow-hidden"
                  >
                    {/* Left: Product List (Precision Sidebar) */}
                    <div className="lg:col-span-3 flex flex-col gap-3 h-auto lg:h-full">
                      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-[#F1E9E0] shadow-sm flex items-center justify-between shrink-0">
                         <div className="text-left leading-tight">
                            <h3 className="text-[10px] font-black text-brand-dark uppercase tracking-widest opacity-50 mb-1">Katalog</h3>
                            <p className="text-[11px] text-brand-gold font-black flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shadow-sm" />
                               {content.products.length} Menu
                            </p>
                         </div>
                         <button 
                            onClick={() => {
                              addProduct();
                              triggerSave();
                            }}
                            className="w-10 h-10 bg-brand-gold text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-gold/20"
                            title="Tambah Produk"
                         >
                            <Plus className="w-5 h-5 stroke-[2.5px]" />
                         </button>
                      </div>

                      <div 
                        ref={productScrollRef}
                        onScroll={handleProductScroll}
                        className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto lg:pr-1 gap-4 lg:gap-2 py-4 px-[calc(50%-60px)] lg:p-0 scroll-smooth snap-x snap-mandatory hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:pb-6"
                      >
                        {[...(isEditingProduct && tempProduct && !content.products.find(p => p.id === tempProduct.id) ? [tempProduct] : []), ...content.products].map((p) => (
                          <motion.div 
                            layout
                            key={p.id}
                            onClick={() => {
                              if (isEditingProduct && !confirm('Kamu sedang mengedit. Batalkan?')) return;
                              setSelectedProductId(p.id);
                              setIsEditingProduct(false);
                            }}
                            className={`snap-center shrink-0 w-[120px] lg:w-auto p-2 lg:p-2 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col lg:flex-row items-center gap-2 lg:gap-2.5 group relative ${
                              selectedProductId === p.id 
                              ? 'bg-white border-brand-gold shadow-md ring-1 ring-brand-gold/10 scale-[1.02] lg:scale-100 z-10' 
                              : 'bg-white border-[#F1E9E0] lg:border-transparent hover:border-brand-gold/20 hover:bg-white'
                            }`}
                          >
                            <div className="w-12 h-12 lg:w-11 lg:h-11 rounded-lg overflow-hidden bg-brand-soft shrink-0 border border-black/5 shadow-inner">
                              <img 
                                src={processImageUrl(p.image)} 
                                className="w-full h-full object-cover pointer-events-none" 
                                style={{ 
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                  transform: `scale(${p.imageScale || 1}) translate(${50 - parseImagePosition(p.imagePosition).x}%, ${50 - parseImagePosition(p.imagePosition).y}%)`
                                }}
                                alt={p.name} 
                              crossOrigin="anonymous" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-grow min-w-0 text-center lg:text-left">
                              <h4 className={`text-[10px] lg:text-[11px] font-black truncate uppercase tracking-tight ${selectedProductId === p.id ? 'text-brand-gold' : 'text-brand-dark'}`}>{p.name}</h4>
                              <div className="flex items-center justify-center lg:justify-between mt-1">
                                <p className="text-[9px] font-serif font-black text-brand-dark flex items-center gap-0.5">
                                  <span className="text-[7px] opacity-40 font-sans">Rp</span>
                                  {p.price.replace('Rp', '').trim()}
                                </p>
                                <span className="hidden lg:inline-block bg-brand-soft px-1.5 py-0.5 rounded text-[8px] border border-brand-gold/5 font-black text-brand-gold/60">{p.badge}</span>
                              </div>
                            </div>
                            
                            {selectedProductId === p.id && (
                              <motion.div 
                                layoutId="activePill"
                                className="hidden lg:block absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-gold rounded-full" 
                              />
                            )}
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Pagination Dots (Mobile) */}
                      <div className="flex lg:hidden justify-center items-center gap-1.5 mt-0 mb-4">
                        {[...(isEditingProduct && tempProduct && !content.products.find(p => p.id === tempProduct.id) ? [tempProduct] : []), ...content.products].map((_, index) => (
                          <div 
                            key={index} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${productScrollIndex === index ? 'w-4 bg-brand-gold' : 'w-1.5 bg-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Right: Product Editor (Consolidated & Precise) */}
                    <div className="lg:col-span-9 h-auto lg:h-full">
                      {selectedProductId ? (
                        <div className="bg-white rounded-[1.5rem] lg:rounded-2xl border border-[#F1E9E0] shadow-sm h-full flex flex-col overflow-hidden relative">
                          {/* Details Bar */}
                          <div className={`px-4 sm:px-6 py-3.5 lg:py-4 border-b border-[#F1E9E0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 shrink-0 transition-colors duration-500 ${isEditingProduct ? 'bg-orange-50/20' : 'bg-[#FDFDFC]'}`}>
                             <div className="flex items-center gap-4 text-left">
                                <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${isEditingProduct ? 'bg-brand-gold text-white shadow-brand-gold/20' : 'bg-brand-soft text-brand-gold'}`}>
                                   {isEditingProduct ? <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Package className="w-4 h-4 sm:w-5 sm:h-5" />}
                                </div>
                                <div className="leading-tight">
                                   <h3 className="text-[10px] sm:text-xs font-serif font-black text-brand-dark uppercase tracking-wide">
                                     {isEditingProduct ? "Editor Mode" : "Item Preview"}
                                   </h3>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isEditingProduct ? 'bg-brand-gold text-white' : 'bg-brand-soft text-brand-gold'}`}>
                                        {isEditingProduct ? "Updating" : "Synced"}
                                      </span>
                                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest opacity-40">
                                         ID: {selectedProductId.toString().slice(-4)}
                                      </span>
                                   </div>
                                </div>
                             </div>

                             <div className="flex items-center gap-2">
                                {!isEditingProduct ? (
                                  <>
                                    <button 
                                      onClick={() => handleStartEdit(content.products.find(p => p.id === selectedProductId)!)}
                                      className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-brand-gold text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-gold/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Modify</span>
                                    </button>
                                    
                                    <div className="relative flex items-center h-10">
                                      <AnimatePresence mode="wait">
                                        {showDeleteConfirm === selectedProductId ? (
                                          <motion.div 
                                            key="confirm-delete"
                                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, x: 10 }}
                                            className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-100 shadow-sm"
                                          >
                                            <button 
                                              onClick={() => {
                                                if (selectedProductId) {
                                                  removeProduct(selectedProductId);
                                                  setShowDeleteConfirm(null);
                                                }
                                              }}
                                              className="px-3 py-2 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-md hover:bg-red-600 transition-all"
                                            >
                                              Hapus
                                            </button>
                                            <button 
                                              onClick={() => setShowDeleteConfirm(null)}
                                              className="px-3 py-2 bg-white text-gray-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-red-100 transition-all"
                                            >
                                              Batal
                                            </button>
                                          </motion.div>
                                        ) : (
                                          <motion.button 
                                            key="delete-btn"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setShowDeleteConfirm(selectedProductId)}
                                            className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                                            title="Hapus"
                                          >
                                            <Trash2 className="w-4.5 h-4.5" />
                                          </motion.button>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2">
                                     <button 
                                       onClick={handleCancelEdit}
                                       className="px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-gray-100"
                                     >
                                       Discard
                                     </button>
                                     <button 
                                       onClick={handleSaveProductEdits}
                                       disabled={isSavingProductToGithub}
                                       className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 flex items-center justify-center gap-2 ${isSavingProductToGithub ? 'bg-[#FBFBF9] text-gray-400 border border-[#F1E9E0] cursor-not-allowed shadow-none' : 'bg-brand-dark text-white shadow-xl shadow-black/10'}`}
                                     >
                                       {isSavingProductToGithub ? (
                                         <>
                                           <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                                           Menyimpan ke Cloud...
                                         </>
                                       ) : (
                                         'Simpan'
                                       )}
                                     </button>
                                  </div>
                                )}
                             </div>
                          </div>
                          <div className="flex-grow overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                             <AnimatePresence mode="wait">
                               {isEditingProduct && tempProduct ? (
                                 <motion.div 
                                   key="edit"
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, y: -10 }}
                                   className="max-w-3xl mx-auto"
                                 >
                                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-left border-0">
                                      {/* Product Identity */}
                                      <div className="lg:col-span-5 flex flex-col gap-3">
                                        <div className="bg-[#FDFDFC] p-3 rounded-xl border border-[#F1E9E0] space-y-3">
                                            <div>
                                              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Product Name</label>
                                              <input 
                                                value={tempProduct.name}
                                                onChange={(e) => setTempProduct({ ...tempProduct, name: e.target.value })}
                                                className="w-full bg-white border border-[#F1E9E0] rounded-xl px-3 py-2.5 text-[11px] font-black text-brand-dark focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                                placeholder="Nama Produk"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Tagline Profile</label>
                                              <input 
                                                value={tempProduct.tagline}
                                                onChange={(e) => setTempProduct({ ...tempProduct, tagline: e.target.value })}
                                                className="w-full bg-white border border-[#F1E9E0] rounded-xl px-3 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-widest focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                                placeholder="E.g. Premium Selection"
                                              />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Price Display</label>
                                                  <div className="flex items-center gap-2 bg-white border border-[#F1E9E0] rounded-xl px-3 transition-focus-within duration-300 focus-within:border-brand-gold">
                                                    <span className="text-[10px] font-black text-brand-gold opacity-50">Rp</span>
                                                    <input 
                                                      value={tempProduct.price.replace('Rp', '').trim()}
                                                      onChange={(e) => setTempProduct({ ...tempProduct, price: `Rp${e.target.value}` })}
                                                      className="flex-grow w-full py-2.5 text-[11px] font-black text-brand-dark bg-transparent outline-none min-w-0"
                                                      placeholder="25.000"
                                                    />
                                                  </div>
                                                </div>
                                                
                                                <div>
                                                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Badge</label>
                                                  <input 
                                                    value={tempProduct.badge}
                                                    maxLength={5}
                                                    onChange={(e) => setTempProduct({ ...tempProduct, badge: e.target.value })}
                                                    className="w-full bg-[#FBFBF9] border border-[#F1E9E0] rounded-xl py-2.5 text-sm text-center focus:border-brand-gold transition-all shadow-inner"
                                                    placeholder="🤩"
                                                  />
                                                </div>
                                            </div>

                                            <div>
                                              <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Package Specs</label>
                                                <span className="text-[8px] font-bold text-gray-300">{tempProduct.details.length}/30</span>
                                              </div>
                                              <input 
                                                value={tempProduct.details}
                                                maxLength={30}
                                                onChange={(e) => setTempProduct({ ...tempProduct, details: e.target.value })}
                                                className="w-full bg-white border border-[#F1E9E0] rounded-xl px-3 py-2.5 text-[10px] font-bold text-brand-dark italic focus:border-brand-gold transition-all"
                                                placeholder="Toples • 300ml ±200gr"
                                              />
                                            </div>

                                            <div>
                                              <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Product Narrative</label>
                                                <span className="text-[8px] font-bold text-gray-300">{tempProduct.description.length}/120</span>
                                              </div>
                                              <textarea 
                                                value={tempProduct.description}
                                                maxLength={120}
                                                onChange={(e) => setTempProduct({ ...tempProduct, description: e.target.value })}
                                                className="w-full h-16 resize-none bg-white border border-[#F1E9E0] rounded-xl px-3 py-2.5 text-[10px] font-bold text-gray-500 focus:border-brand-gold transition-all"
                                                placeholder="Renyah, cheesy, dan gurih maksimal..."
                                              />
                                            </div>

                                            <div>
                                              <div className="flex justify-between items-center mb-1.5 mt-2">
                                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Pesan WhatsApp Otomatis</label>
                                              </div>
                                              <textarea 
                                                value={tempProduct.whatsappMessage ?? ''}
                                                onChange={(e) => setTempProduct({ ...tempProduct, whatsappMessage: e.target.value })}
                                                className="w-full h-16 resize-none bg-[#FDFDFC] border border-[#F1E9E0] rounded-xl px-3 py-2.5 text-[10px] font-bold text-brand-dark focus:border-brand-gold transition-all shadow-inner"
                                                placeholder={`Halo Apsari Patisserie, saya ingin pesan ${tempProduct.name}!`}
                                              />
                                              <p className="text-[8px] text-gray-400 mt-1 italic">*Teks yang muncul otomatis saat customer klik tombol WhatsApp</p>
                                            </div>
                                        </div>
                                      </div>

                                      {/* Media & Zoom */}
                                      <div className="lg:col-span-7 bg-[#FDFDFC] p-3 rounded-xl border border-[#F1E9E0] flex flex-col gap-3">
                                        <div>
                                          <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Resource Image URL</label>
                                            <button 
                                              onClick={() => {
                                                setImageRefreshKey(prev => prev + 1);
                                                if (tempProduct?.image) {
                                                  setTempProduct({ ...tempProduct, image: processImageUrl(tempProduct.image) });
                                                }
                                              }}
                                              className="flex items-center gap-1.5 px-2 py-1 bg-brand-soft text-brand-gold rounded-lg hover:bg-brand-gold hover:text-white transition-all text-[8px] font-black uppercase tracking-widest border border-brand-gold/5"
                                            >
                                              <RotateCcw className="w-2.5 h-2.5" />
                                              Refresh
                                            </button>
                                          </div>
                                          <div className="relative group">
                                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-brand-gold transition-colors" />
                                            <input 
                                              value={tempProduct.image}
                                              onChange={(e) => {
                                                const url = e.target.value;
                                                const finalUrl = processImageUrl(url);
                                                setTempProduct({ ...tempProduct, image: finalUrl });
                                              }}
                                              className="w-full bg-white border border-[#F1E9E0] rounded-xl pl-10 pr-3 py-2.5 text-[10px] font-bold text-brand-dark focus:border-brand-gold transition-all"
                                              placeholder="URL Gambar (GitHub, Google Drive, dsb)"
                                            />
                                          </div>
                                          {tempProduct.image.includes('github.com') && (
                                            <p className="mt-1 text-[7px] text-brand-gold font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                              <CheckCircle className="w-2.5 h-2.5" />
                                              GitHub raw auto-converted
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex-grow flex flex-col pt-1">
                                          <div className="flex justify-between items-center mb-2">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Visual Framing (Crop & Zoom)</label>
                                            <div className="flex gap-2">
                                              <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">X: {parseImagePosition(tempProduct.imagePosition).x}%</span>
                                              <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">Y: {parseImagePosition(tempProduct.imagePosition).y}%</span>
                                              <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">Z: {tempProduct.imageScale || 1}x</span>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter shrink-0">ZOOM</span>
                                            <input 
                                              type="range" min="1" max="4" step="0.01"
                                              value={tempProduct.imageScale || 1}
                                              onChange={(e) => setTempProduct({ ...tempProduct, imageScale: parseFloat(e.target.value) })}
                                              className="flex-grow accent-brand-gold h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                            />
                                          </div>
                                          
                                          <div 
                                            className="relative overflow-hidden aspect-square max-w-[280px] mx-auto rounded-2xl bg-gray-50/50 border-2 border-brand-gold/20 shadow-inner cursor-move select-none touch-none"
                                            onMouseDown={(e) => handleImageMouseDown(e)}
                                            onMouseMove={(e) => handleImageMouseMove(e)}
                                            onMouseUp={handleImageMouseUp}
                                            onMouseLeave={handleImageMouseUp}
                                            onTouchStart={(e) => handleImageMouseDown(e)}
                                            onTouchMove={(e) => handleImageMouseMove(e)}
                                            onTouchEnd={handleImageMouseUp}
                                          >
                                             <img 
                                               key={`${tempProduct.id}-${imageRefreshKey}`}
                                               src={processImageUrl(tempProduct.image)} 
                                               className="w-full h-full pointer-events-none object-cover"
                                               style={{ 
                                                 objectFit: 'cover',
                                                 objectPosition: 'center',
                                                 transform: `scale(${tempProduct.imageScale || 1}) translate(${50 - parseImagePosition(tempProduct.imagePosition).x}%, ${50 - parseImagePosition(tempProduct.imagePosition).y}%)`
                                               }}
                                               alt="Framing Preview"
                                               onLoad={(e) => e.currentTarget.classList.add('opacity-100')} crossOrigin="anonymous" referrerPolicy="no-referrer"
                                             />
                                             {/* Precision Grid Guides */}
                                             <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50">
                                                <div className="absolute inset-x-0 top-1/3 h-[1px] bg-white text-[6px] text-white/50 pt-0.5 px-1">rule of thirds</div>
                                                <div className="absolute inset-x-0 top-2/3 h-[1px] bg-white"></div>
                                                <div className="absolute inset-y-0 left-1/3 w-[1px] bg-white"></div>
                                                <div className="absolute inset-y-0 left-2/3 w-[1px] bg-white"></div>
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-gold"></div>
                                                <div className="absolute inset-0 border border-white/50"></div>
                                             </div>
                                          </div>
                                          <p className="text-[7px] text-gray-400 mt-2 font-bold uppercase tracking-widest text-center">Tarik gambar (Drag) untuk Frame. Gunakan slider untuk Zoom.</p>
                                        </div>
                                      </div>
                                   </div>
                                 </motion.div>
                               ) : (
                                 <div className="max-w-4xl mx-auto space-y-8">
                                   {/* Preview Visual */}
                                   <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-center md:items-start text-left">
                                     <div className="w-full sm:w-64 md:w-56 lg:w-64 aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-brand-soft shrink-0 relative group">
                                       <img 
                                         key={imageRefreshKey}
                                         src={processImageUrl(content.products.find(p => p.id === selectedProductId)?.image || '')} 
                                         className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-110" 
                                         style={{ 
                                           objectFit: 'cover',
                                           objectPosition: 'center',
                                           transform: `scale(${content.products.find(p => p.id === selectedProductId)?.imageScale || 1}) translate(${50 - parseImagePosition(content.products.find(p => p.id === selectedProductId)?.imagePosition).x}%, ${50 - parseImagePosition(content.products.find(p => p.id === selectedProductId)?.imagePosition).y}%)`
                                         }}
                                         alt="Product" 
                                       />
                                       <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md w-10 h-10 flex items-center justify-center rounded-xl shadow-lg border border-[#F1E9E0] text-xl">
                                         {content.products.find(p => p.id === selectedProductId)?.badge}
                                       </div>
                                     </div>
                                     
                                     <div className="flex-grow pt-2 flex flex-col h-full">
                                        <div className="flex items-center gap-3 mb-4">
                                           <div className="px-3 py-1 bg-brand-soft border border-brand-gold/10 rounded-full">
                                             <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em]">
                                               {content.products.find(p => p.id === selectedProductId)?.tagline}
                                             </span>
                                           </div>
                                        </div>
                                        
                                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-brand-dark mb-2 tracking-tighter leading-none">
                                           {content.products.find(p => p.id === selectedProductId)?.name}
                                        </h2>
                                        
                                        <p className="text-2xl lg:text-3xl font-serif font-bold text-brand-gold mb-6 italic flex items-center gap-3">
                                           {content.products.find(p => p.id === selectedProductId)?.price}
                                           <span className="text-gray-300 text-[10px] font-sans font-black uppercase tracking-widest not-italic border-l border-gray-100 pl-3">Retail Price</span>
                                        </p>

                                        <div className="grid grid-cols-2 gap-6 py-6 border-y border-[#F1E9E0]">
                                           <div className="text-left">
                                              <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold opacity-50 block mb-1">Packaging Info</span>
                                              <span className="text-xs font-bold text-brand-dark italic">{content.products.find(p => p.id === selectedProductId)?.details}</span>
                                           </div>
                                           <div className="text-left">
                                              <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold opacity-50 block mb-1">Stock Status</span>
                                              <div className="flex items-center gap-2">
                                                 <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
                                                 <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Active Inventory</span>
                                              </div>
                                           </div>
                                        </div>

                                        <div className="mt-8">
                                          <div className="flex items-center gap-2 mb-3">
                                             <div className="h-[1px] w-8 bg-brand-gold"></div>
                                             <span className="text-[9px] font-black text-brand-gold uppercase tracking-[0.4em]">Product Story</span>
                                          </div>
                                          <div className="relative bg-[#FBFBF9] p-5 lg:p-6 rounded-2xl border border-[#F1E9E0] shadow-inner italic">
                                             <Quote className="absolute top-4 right-4 w-12 h-12 text-brand-gold/5 rotate-12" />
                                             <p className="text-xs lg:text-sm text-gray-400 font-serif font-light leading-relaxed relative z-10 italic">
                                                "{content.products.find(p => p.id === selectedProductId)?.description}"
                                             </p>
                                          </div>
                                        </div>
                                     </div>
                                   </div>
                                 </div>
                               )}
                             </AnimatePresence>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-3xl border-2 border-dashed border-[#F1E9E0] h-full flex items-center justify-center text-center p-10 group transition-all duration-700">
                          <div className="max-w-[200px] transition-transform duration-700 group-hover:scale-110">
                            <div className="w-14 h-14 bg-brand-soft rounded-2xl flex items-center justify-center text-brand-gold mx-auto mb-6 shadow-sm border border-brand-gold/10">
                               <ShoppingBag className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-serif font-black text-brand-dark mb-2 tracking-tight uppercase">Pilih Menu</h3>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase tracking-widest opacity-60">Buka katalog di bagian kiri untuk meninjau detail produk.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Tab: About (Story) */}
                {activeAdminTab === 'about' && (
                  <motion.div 
                    key="about" 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-6"
                  >
                    <div className="max-w-4xl mx-auto w-full">
                      <div className="flex overflow-x-auto border-b border-[#F1E9E0] mb-6 no-scrollbar">
                        {[
                          { id: 'text', label: 'Narrative Text' },
                          { id: 'media', label: 'Media & Images' },
                          { id: 'stats', label: 'Brand Statistics' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveAboutTab(tab.id as 'text' | 'media' | 'stats')}
                            className={`whitespace-nowrap px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                              activeAboutTab === tab.id 
                              ? 'text-brand-dark border-b-3 border-brand-gold bg-brand-soft/30' 
                              : 'text-gray-400 hover:text-brand-dark hover:bg-gray-50'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-10">
                        {activeAboutTab === 'text' && (
                          <div className="space-y-10">
                     <section className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-black text-brand-dark leading-none">Our Legacy Story</h3>
                            <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Brand Narrative & History</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {editingSection === 'aboutStory' ? (
                             <>
                               <button onClick={handleCancelSection} className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Narasi Brand')} disabled={isSavingContentToGithub} className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('aboutStory')} className="w-full sm:w-auto px-6 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Story Tagline (Mini Header)</label>
                          <input 
                            disabled={editingSection !== 'aboutStory'}
                            value={editingSection === 'aboutStory' ? tempContent?.aboutTagline : content.aboutTagline}
                            onChange={(e) => setTempContent({ ...tempContent!, aboutTagline: e.target.value })}
                            className={`w-full bg-white border border-[#F1E9E0] rounded-xl px-4 py-3 text-xs font-bold text-brand-dark transition-all ${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">About Section Title</label>
                          <textarea 
                            disabled={editingSection !== 'aboutStory'}
                            value={editingSection === 'aboutStory' ? tempContent?.aboutTitle : content.aboutTitle}
                            onChange={(e) => setTempContent({ ...tempContent!, aboutTitle: e.target.value })}
                            className={`w-full bg-white border border-[#F1E9E0] rounded-xl px-4 py-3 text-sm font-serif font-black text-brand-dark leading-tight h-24 resize-none transition-all ${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Paragraph 1 (The Beginning)</label>
                            <textarea 
                              disabled={editingSection !== 'aboutStory'}
                              value={editingSection === 'aboutStory' ? tempContent?.aboutDescription1 : content.aboutDescription1}
                              onChange={(e) => setTempContent({ ...tempContent!, aboutDescription1: e.target.value })}
                              className={`w-full bg-white border border-[#F1E9E0] rounded-2xl px-4 py-4 text-xs font-medium leading-relaxed text-gray-500 italic h-40 resize-none transition-all ${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Paragraph 2 (The Quality)</label>
                            <textarea 
                              disabled={editingSection !== 'aboutStory'}
                              value={editingSection === 'aboutStory' ? tempContent?.aboutDescription2 : content.aboutDescription2}
                              onChange={(e) => setTempContent({ ...tempContent!, aboutDescription2: e.target.value })}
                              className={`w-full bg-white border border-[#F1E9E0] rounded-2xl px-4 py-4 text-xs font-medium leading-relaxed text-gray-500 italic h-40 resize-none transition-all ${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                          </div>
                        )}
                        {activeAboutTab === 'media' && (
                          <div className="space-y-10">
                    <section className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-black text-brand-dark leading-none">Media & Visuals</h3>
                            <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Story Images</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {editingSection === 'aboutStory' ? (
                             <>
                               <button onClick={handleCancelSection} className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Media Story')} disabled={isSavingContentToGithub} className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('aboutStory')} className="w-full sm:w-auto px-6 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Story Image 1 (Toples) URL</label>
                            <div className="relative">
                              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                              <input 
                                disabled={editingSection !== 'aboutStory'}
                                value={editingSection === 'aboutStory' ? tempContent?.storyImage1Url : content.storyImage1Url}
                                onChange={(e) => {
                                  const url = e.target.value;
                                  const finalUrl = processImageUrl(url);
                                  setTempContent({ ...tempContent!, storyImage1Url: finalUrl });
                                }}
                                className={`w-full bg-white border border-[#F1E9E0] rounded-xl pl-12 pr-4 py-3 text-[10px] font-bold text-brand-dark transition-all ${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                                placeholder="https://..."
                              />
                            </div>

                            {editingSection === 'aboutStory' && (
                               <div className="flex-grow flex flex-col pt-1">
                                 <div className="flex justify-between items-center mb-2">
                                   <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Visual Framing (Crop & Zoom)</label>
                                   <div className="flex gap-2">
                                     <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">X: {parseImagePosition(tempContent?.storyImage1Position || content.storyImage1Position).x}%</span>
                                     <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">Y: {parseImagePosition(tempContent?.storyImage1Position || content.storyImage1Position).y}%</span>
                                     <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">Z: {tempContent?.storyImage1Scale || content.storyImage1Scale || 1}x</span>
                                   </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-3 mb-4">
                                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter shrink-0">ZOOM</span>
                                   <input 
                                     type="range" min="1" max="4" step="0.01"
                                     value={tempContent?.storyImage1Scale || content.storyImage1Scale || 1}
                                     onChange={(e) => setTempContent({ ...tempContent!, storyImage1Scale: parseFloat(e.target.value) })}
                                     className="flex-grow accent-brand-gold h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                     disabled={editingSection !== 'aboutStory'}
                                   />
                                 </div>
                               </div>
                             )}

                             <div 
                               className={`relative overflow-hidden w-full aspect-[4/5] rounded-2xl bg-gray-50/50 border-2 border-brand-gold/20 shadow-inner ${editingSection === 'aboutStory' ? 'cursor-move select-none touch-none' : ''}`}
                               onMouseDown={(e) => editingSection === 'aboutStory' && handleImageMouseDown(e, 'story1')}
                               onMouseMove={(e) => editingSection === 'aboutStory' && handleImageMouseMove(e, 'story1')}
                               onMouseUp={handleImageMouseUp}
                               onMouseLeave={handleImageMouseUp}
                               onTouchStart={(e) => editingSection === 'aboutStory' && handleImageMouseDown(e, 'story1')}
                               onTouchMove={(e) => editingSection === 'aboutStory' && handleImageMouseMove(e, 'story1')}
                               onTouchEnd={handleImageMouseUp}
                             >
                                <img 
                                  key={`story1-edit-preview-${imageRefreshKey}`}
                                  src={processImageUrl(editingSection === 'aboutStory' ? tempContent?.storyImage1Url || content.storyImage1Url : content.storyImage1Url)} 
                                  className="w-full h-full pointer-events-none object-cover"
                                  style={{ 
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    transform: `scale(${editingSection === 'aboutStory' ? (tempContent?.storyImage1Scale || 1) : (content.storyImage1Scale || 1)}) translate(${50 - parseImagePosition(editingSection === 'aboutStory' ? tempContent?.storyImage1Position : content.storyImage1Position).x}%, ${50 - parseImagePosition(editingSection === 'aboutStory' ? tempContent?.storyImage1Position : content.storyImage1Position).y}%)`
                                  }}
                                  alt="Story 1 Preview"
                                  onLoad={(e) => e.currentTarget.classList.add('opacity-100')} crossOrigin="anonymous" referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 pointer-events-none border border-white/20"></div>
                             </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Story Image 2 (Cookies) URL</label>
                            <div className="relative">
                              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                              <input 
                                disabled={editingSection !== 'aboutStory'}
                                value={editingSection === 'aboutStory' ? tempContent?.storyImage2Url : content.storyImage2Url}
                                onChange={(e) => {
                                  const url = e.target.value;
                                  const finalUrl = processImageUrl(url);
                                  setTempContent({ ...tempContent!, storyImage2Url: finalUrl });
                                }}
                                className={`w-full bg-white border border-[#F1E9E0] rounded-xl pl-12 pr-4 py-3 text-[10px] font-bold text-brand-dark transition-all ${editingSection !== 'aboutStory' ? 'opacity-50 grayscale bg-[#FBFBF9] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                                placeholder="https://..."
                              />
                            </div>

                            {editingSection === 'aboutStory' && (
                               <div className="flex-grow flex flex-col pt-1">
                                 <div className="flex justify-between items-center mb-2">
                                   <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Visual Framing (Crop & Zoom)</label>
                                   <div className="flex gap-2">
                                     <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">X: {parseImagePosition(tempContent?.storyImage2Position || content.storyImage2Position).x}%</span>
                                     <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">Y: {parseImagePosition(tempContent?.storyImage2Position || content.storyImage2Position).y}%</span>
                                     <span className="text-[7px] font-black text-brand-gold/40 uppercase tracking-widest leading-none">Z: {tempContent?.storyImage2Scale || content.storyImage2Scale || 1}x</span>
                                   </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-3 mb-4">
                                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter shrink-0">ZOOM</span>
                                   <input 
                                     type="range" min="1" max="4" step="0.01"
                                     value={tempContent?.storyImage2Scale || content.storyImage2Scale || 1}
                                     onChange={(e) => setTempContent({ ...tempContent!, storyImage2Scale: parseFloat(e.target.value) })}
                                     className="flex-grow accent-brand-gold h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                     disabled={editingSection !== 'aboutStory'}
                                   />
                                 </div>
                               </div>
                             )}

                             <div 
                               className={`relative overflow-hidden w-full aspect-[4/5] rounded-2xl bg-gray-50/50 border-2 border-brand-gold/20 shadow-inner ${editingSection === 'aboutStory' ? 'cursor-move select-none touch-none' : ''}`}
                               onMouseDown={(e) => editingSection === 'aboutStory' && handleImageMouseDown(e, 'story2')}
                               onMouseMove={(e) => editingSection === 'aboutStory' && handleImageMouseMove(e, 'story2')}
                               onMouseUp={handleImageMouseUp}
                               onMouseLeave={handleImageMouseUp}
                               onTouchStart={(e) => editingSection === 'aboutStory' && handleImageMouseDown(e, 'story2')}
                               onTouchMove={(e) => editingSection === 'aboutStory' && handleImageMouseMove(e, 'story2')}
                               onTouchEnd={handleImageMouseUp}
                             >
                                <img 
                                  key={`story2-edit-preview-${imageRefreshKey}`}
                                  src={processImageUrl(editingSection === 'aboutStory' ? tempContent?.storyImage2Url || content.storyImage2Url : content.storyImage2Url)} 
                                  className="w-full h-full pointer-events-none object-cover"
                                  style={{ 
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    transform: `scale(${editingSection === 'aboutStory' ? (tempContent?.storyImage2Scale || 1) : (content.storyImage2Scale || 1)}) translate(${50 - parseImagePosition(editingSection === 'aboutStory' ? tempContent?.storyImage2Position : content.storyImage2Position).x}%, ${50 - parseImagePosition(editingSection === 'aboutStory' ? tempContent?.storyImage2Position : content.storyImage2Position).y}%)`
                                  }}
                                  alt="Story 2 Preview"
                                  onLoad={(e) => e.currentTarget.classList.add('opacity-100')} crossOrigin="anonymous" referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 pointer-events-none border border-white/20"></div>
                             </div>
                          </div>
                      </div>
                    </section>
                          </div>
                        )}

                        {activeAboutTab === 'stats' && (
                          <div className="space-y-10">
                    {/* Stats Editor */}
                    <section className="bg-white rounded-xl lg:rounded-2xl p-4 sm:p-5 border border-[#F1E9E0] shadow-sm text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[#F1E9E0] pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-soft flex items-center justify-center text-brand-gold shadow-sm">
                            <Star className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-black text-brand-dark leading-none">Brand Statistics</h3>
                            <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Key Performance Indicators</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {editingSection === 'brandStats' ? (
                             <>
                               <button onClick={handleCancelSection} className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-200">Batal</button>
                               <button onClick={() => handleSaveSection('Update Statistik Brand')} disabled={isSavingContentToGithub} className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50">{isSavingContentToGithub ? 'Menyimpan...' : 'Simpan'}</button>
                             </>
                           ) : (
                             <button onClick={() => handleStartEditingSection('brandStats')} className="w-full sm:w-auto px-6 py-2.5 bg-brand-soft text-brand-gold rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                               <Edit3 className="w-3.5 h-3.5" />
                               Update
                             </button>
                           )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-1 max-w-4xl">
                         {(editingSection === 'brandStats' ? tempContent!.stats : content.stats).map((stat, i) => (
                           <div key={i} className="p-5 bg-[#FBFBF9] rounded-2xl border border-[#F1E9E0] space-y-4">
                              <p className="text-[8px] font-black text-brand-gold uppercase tracking-widest">Indicator {i+1}</p>
                              <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Display Value</label>
                                <input 
                                  disabled={editingSection !== 'brandStats'}
                                  value={stat.value}
                                  onChange={(e) => {
                                    const newStats = [...tempContent!.stats];
                                    newStats[i].value = e.target.value;
                                    setTempContent({ ...tempContent!, stats: newStats });
                                  }}
                                  className={`w-full bg-white border border-[#F1E9E0] rounded-xl px-4 py-2.5 text-sm font-serif font-black italic text-brand-dark transition-all ${editingSection !== 'brandStats' ? 'opacity-50 grayscale bg-[#FDFDFD] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Descriptor Label</label>
                                <input 
                                  disabled={editingSection !== 'brandStats'}
                                  value={stat.label}
                                  onChange={(e) => {
                                    const newStats = [...tempContent!.stats];
                                    newStats[i].label = e.target.value;
                                    setTempContent({ ...tempContent!, stats: newStats });
                                  }}
                                  className={`w-full bg-white border border-[#F1E9E0] rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-brand-dark transition-all ${editingSection !== 'brandStats' ? 'opacity-50 grayscale bg-[#FDFDFD] cursor-not-allowed' : 'focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5'}`}
                                />
                              </div>
                           </div>
                         ))}
                      </div>
                    </section>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </main>
        </div>
      )}

      {currentView === 'store' && (
        <>
          <AnimatePresence>
            {showSalesAssistant && (
              <>
                {/* Click-outside listener (Overlay) */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeSalesAssistant}
                  className="fixed inset-0 z-[95] bg-transparent"
                />
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed bottom-28 right-6 left-6 md:left-auto md:right-10 md:w-[340px] z-[100] font-sans"
                >
                  {/* Main Card Container */}
                  <div className="bg-white rounded-[28px] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.18)] border border-gray-100 relative overflow-hidden">
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-brand-soft overflow-hidden border border-brand-gold/20 flex items-center justify-center p-0.5">
                        <img 
                          src="https://raw.githubusercontent.com/Fortotest/Apsari-Patisserie/2cae789c4a1f69a42473b51363d6b872f8d5eade/icon%20logo%20tab.png" 
                          alt="Apsari Admin" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-sans font-extrabold text-gray-800 text-[13px] uppercase tracking-wider leading-none">Admin Apsari</h4>
                    </div>
                    <button 
                      onClick={closeSalesAssistant}
                      className="ml-auto p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Message Content Container */}
                  <div className="bg-gray-50/80 rounded-2xl p-5 mb-5 border border-gray-100">
                    <p className="text-[13px] sm:text-[14px] leading-relaxed text-gray-700 font-medium tracking-tight">
                      Halo, <span className="text-brand-gold font-extrabold">{greeting || getGreeting()}</span>! Senang kamu berkunjung ke Apsari Patisserie. Lagi cari kue kering untuk menemani waktu santai atau untuk hampers? Kalau ada yang ingin ditanyakan langsung kabari ya!
                    </p>
                  </div>

                  {/* Action Button */}
                  <a 
                    href={content.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackLinkClick();
                      closeSalesAssistant();
                    }}
                    className="w-full bg-[#B38E5D] text-white rounded-xl py-3.5 flex items-center justify-center gap-2 group transition-all hover:brightness-105 shadow-md active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4 fill-white/10" />
                    <span className="font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.15em]">Tanya Admin</span>
                  </a>
                </div>
              </motion.div>
            </>
            )}
          </AnimatePresence>

          {/* Floating WhatsApp Action Icon */}
          <AnimatePresence>
            {!showSalesAssistant && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSalesAssistant}
                className="fixed bottom-6 right-6 w-14 h-14 bg-brand-gold text-white rounded-full flex items-center justify-center shadow-2xl z-[90] group hover:brightness-110 transition-colors border-2 border-white/20"
              >
                <div className="relative">
                  <MessageCircle className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white shadow-lg z-[10] ring-1 ring-red-500/20"
                    >
                      1
                    </motion.span>
                  )}
                </div>
                
                {/* Tooltip */}
                <span className="absolute right-full mr-4 bg-brand-gold text-white text-[10px] uppercase font-black tracking-widest px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 hidden md:block">
                  Tanya Admin
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        html { scroll-behavior: smooth; }
        .admin-label { 
          display: block; 
          font-size: 8.5px; 
          font-weight: 900; 
          text-transform: uppercase; 
          letter-spacing: 0.15em; 
          color: #9C8C7F; 
          margin-bottom: 6px;
          text-align: left;
        }
        .w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all {
          width: 100%;
          padding: 10px 14px;
          background: #FDFDFC;
          border: 1px solid #F1E9E0;
          border-radius: 0.5rem;
          font-size: 12px;
          outline: none;
          transition: all 0.2s ease;
          color: #433422;
        }
        .admin-input-full:focus {
          border-color: #B48E56;
          background: white;
          box-shadow: 0 4px 20px rgba(180, 142, 86, 0.05);
        }
        .w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-800 transition-all {
          width: 100%;
          padding: 8px 12px;
          background: #FDFDFC;
          border: 1px solid #F1E9E0;
          border-radius: 0.375rem;
          font-size: 12px;
          outline: none;
          transition: all 0.2s ease;
          color: #433422;
        }
        .admin-input-full-compact:focus {
          border-color: #B48E56;
          background: white;
        }
        .glass-nav {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(180, 142, 86, 0.1);
        }
        .product-card {
          background: white;
          border: 1px solid rgba(180, 142, 86, 0.08);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fdfdfc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1e9e0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b48e56;
        }
        .bg-brand-soft { background-color: #FBFBF9; }
        .bg-brand-gold { background-color: #B48E56; }
        .text-brand-gold { color: #B48E56; }
        .text-brand-dark { color: #433422; }
        .btn-primary {
          background-color: #B48E56;
          color: white;
          transition: all 0.4s ease;
        }
        .btn-primary:hover {
          background-color: #9C7D4B;
          transform: translateY(-2px);
        }
      `}} />

    </div>
  );
}
