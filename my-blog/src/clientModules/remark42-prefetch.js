// Remark42 prefetch module - loads resources as early as possible
export default function prefetchRemark42() {
  if (typeof window !== 'undefined') {
    // Get Remark42 host from global config
    const host = window?.docusaurus?.siteConfig?.customFields?.REMARK42_HOST;
    
    if (!host) {
        return;
    }
    
    
    // Early DNS prefetch and preconnect
    const createLink = (rel, href, crossOrigin = false) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (crossOrigin) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      return link;
    };
    
    // DNS prefetch (highest priority)
    createLink('dns-prefetch', host);
    
    // Preconnect (establishes connection)
    createLink('preconnect', host, true);
    
    // Preload script (downloads the resource)
    const scriptUrl = host.includes('ngrok') 
      ? `${host}/web/embed.js?ngrok-skip-browser-warning=true`
      : `${host}/web/embed.js`;
      
    const preloadLink = createLink('preload', scriptUrl);
    preloadLink.as = 'script';
    
    
    // Optional: Warm up the connection by making a preflight request
    // This helps establish the connection even earlier
    if ('fetch' in window) {
      fetch(host, { 
        mode: 'no-cors',
        method: 'HEAD'
      }).catch(() => {
        // Ignore errors, this is just for warming up the connection
      });
    }
  }
}