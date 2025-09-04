// Remark42 utility functions to eliminate code duplication

// Generate the Remark42 embed script URL with ngrok support
export const getRemark42ScriptUrl = (host) => {
  if (!host) return null;
  
  return host.includes('ngrok')
    ? `${host}/web/embed.js?ngrok-skip-browser-warning=true`
    : `${host}/web/embed.js`;
};

// Create a link element with specified attributes
export const createLinkElement = (rel, href, options = {}) => {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  
  if (options.crossOrigin) {
    link.crossOrigin = 'anonymous';
  }
  
  if (options.as) {
    link.as = options.as;
  }
  
  return link;
};

// Check if a link element with specific attributes already exists
export const linkExists = (rel, href) => {
  return document.querySelector(`link[rel="${rel}"][href="${href}"]`) !== null;
};

// Ensure a connection link (dns-prefetch or preconnect) exists
export const ensureConnectionLink = (rel, href, crossOrigin = false) => {
  if (typeof window === 'undefined') return;
  
  if (!linkExists(rel, href)) {
    const link = createLinkElement(rel, href, { crossOrigin });
    document.head.appendChild(link);
  }
};

// Prefetch Remark42 resources (DNS, connection, script)
export const prefetchRemark42Resources = (host, cache = new Set()) => {
  if (typeof window === 'undefined' || !host || cache.has(host)) return;
  
  cache.add(host);
  
  // DNS prefetch
  ensureConnectionLink('dns-prefetch', host);
  
  // Preconnect
  ensureConnectionLink('preconnect', host, true);
  
  // Preload script
  const scriptUrl = getRemark42ScriptUrl(host);
  if (scriptUrl && !linkExists('preload', scriptUrl)) {
    const preloadLink = createLinkElement('preload', scriptUrl, { as: 'script' });
    document.head.appendChild(preloadLink);
  }
};

// Get Remark42 host from Docusaurus context
export const getRemark42Host = (siteConfig) => {
  return siteConfig?.customFields?.REMARK42_HOST;
};

// Get Remark42 host from global window object (for client modules)
export const getRemark42HostFromWindow = () => {
  return window?.docusaurus?.siteConfig?.customFields?.REMARK42_HOST;
};

// Check if host is using ngrok
export const isNgrokHost = (host) => {
  return host && host.includes('ngrok');
};


// Warm up connection with preflight request
export const warmUpConnection = (host) => {
  if (typeof window === 'undefined' || !host || !('fetch' in window)) return;
  
  fetch(host, { 
    mode: 'no-cors',
    method: 'HEAD'
  }).catch(() => {
    // Ignore errors, this is just for warming up the connection
  });
};