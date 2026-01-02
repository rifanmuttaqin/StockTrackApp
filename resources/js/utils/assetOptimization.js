// Font optimization utilities
export const loadGoogleFont = (fontFamily, weights = [400, 500, 600, 700]) => {
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weights.join(';')}&display=swap`;

  // Create link element for font loading
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontUrl;
  link.crossOrigin = 'anonymous';

  // Add to document head
  document.head.appendChild(link);

  // Return promise for font loading completion
  return new Promise((resolve) => {
    link.onload = () => resolve(fontFamily);
  });
};

// Preload critical fonts
export const preloadCriticalFonts = () => {
  const criticalFonts = [
    { family: 'Poppins', weights: [400, 500, 600, 700] }
  ];

  criticalFonts.forEach(font => {
    loadGoogleFont(font.family, font.weights);
  });
};

// Optimize font display
export const optimizeFontDisplay = () => {
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
};

// Image optimization utilities
export const optimizeImageSrc = (src, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options;

  // If it's already an optimized URL, return as is
  if (src.includes('?')) {
    return src;
  }

  // Build optimized URL (this would integrate with your image optimization service)
  const params = new URLSearchParams();
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  if (quality !== 80) params.append('q', quality);
  if (format !== 'webp') params.append('f', format);

  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
};

// Lazy load images with intersection observer
export const createLazyImageObserver = (callback) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });

  return observer;
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/fonts/poppins-v20-latin-regular.woff2', as: 'font', type: 'font/woff2' },
    { href: '/fonts/poppins-v20-latin-500.woff2', as: 'font', type: 'font/woff2' },
    { href: '/fonts/poppins-v20-latin-600.woff2', as: 'font', type: 'font/woff2' },
    { href: '/fonts/poppins-v20-latin-700.woff2', as: 'font', type: 'font/woff2' },
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) {
      link.type = resource.type;
    }
    if (resource.as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
};

// Compress and optimize CSS
export const optimizeCSS = (css) => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
    .trim();
};

// Optimize JavaScript bundle
export const optimizeJS = (js) => {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\/\/.*$/gm, '') // Remove single line comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};

// Service worker for caching
export const createServiceWorker = () => {
  const swCode = `
    const CACHE_NAME = 'stocktrack-v1';
    const urlsToCache = [
      '/',
      '/css/app.css',
      '/js/app.js',
      '/fonts/poppins-v20-latin-regular.woff2',
      '/fonts/poppins-v20-latin-500.woff2',
      '/fonts/poppins-v20-latin-600.woff2',
      '/fonts/poppins-v20-latin-700.woff2'
    ];

    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => cache.addAll(urlsToCache))
      );
    });

    self.addEventListener('fetch', event => {
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            return response || fetch(event.request);
          })
      );
    });
  `;

  const blob = new Blob([swCode], { type: 'application/javascript' });
  const swUrl = URL.createObjectURL(blob);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(swUrl);
  }
};

// Critical CSS extraction
export const extractCriticalCSS = () => {
  const criticalCSS = `
    /* Critical CSS for above-the-fold content */
    body { font-family: 'Poppins', sans-serif; }
    .loading { display: flex; justify-content: center; align-items: center; }
    .spinner { border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  style.id = 'critical-css';
  document.head.appendChild(style);

  return criticalCSS;
};

// Resource hints for better loading
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'preconnect', href: '//fonts.googleapis.com', crossorigin: 'anonymous' },
    { rel: 'preconnect', href: '//fonts.gstatic.com', crossorigin: 'anonymous' }
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    Object.keys(hint).forEach(key => {
      link.setAttribute(key, hint[key]);
    });
    document.head.appendChild(link);
  });
};

// Initialize all optimizations
export const initializeAssetOptimizations = () => {
  // Add resource hints
  addResourceHints();

  // Preload critical fonts
  preloadCriticalFonts();

  // Preload critical resources
  preloadCriticalResources();

  // Extract critical CSS
  extractCriticalCSS();

  // Optimize font display
  optimizeFontDisplay();

  // Create service worker for caching
  if (process.env.NODE_ENV === 'production') {
    createServiceWorker();
  }
};
