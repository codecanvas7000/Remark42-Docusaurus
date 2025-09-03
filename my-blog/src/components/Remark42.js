import React, { useEffect, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// Global script cache and prefetch mechanism
const scriptCache = new Map();
const prefetchedHosts = new Set();

// Prefetch Remark42 resources
const prefetchRemark42Resources = (host) => {
  if (typeof window === 'undefined' || prefetchedHosts.has(host)) return;
  
  prefetchedHosts.add(host);
  
  // DNS prefetch and preconnect
  const link1 = document.createElement('link');
  link1.rel = 'dns-prefetch';
  link1.href = host;
  document.head.appendChild(link1);
  
  const link2 = document.createElement('link');
  link2.rel = 'preconnect';
  link2.href = host;
  link2.crossOrigin = 'anonymous';
  document.head.appendChild(link2);
  
  // Preload the script
  const scriptUrl = host.includes('ngrok') 
    ? `${host}/web/embed.js?ngrok-skip-browser-warning=true`
    : `${host}/web/embed.js`;
    
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'script';
  preloadLink.href = scriptUrl;
  document.head.appendChild(preloadLink);
  
};

// Load script with caching
const loadRemark42Script = (host) => {
  return new Promise((resolve, reject) => {
    const scriptUrl = host.includes('ngrok')
      ? `${host}/web/embed.js?ngrok-skip-browser-warning=true`
      : `${host}/web/embed.js`;
    
    // Check cache first
    if (scriptCache.has(scriptUrl)) {
      const cachedPromise = scriptCache.get(scriptUrl);
      if (cachedPromise.resolved) {
        resolve();
        return;
      }
      return cachedPromise.promise;
    }
    
    // Create and cache the promise
    const promise = new Promise((res, rej) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      
      script.onload = () => {
        scriptCache.set(scriptUrl, { resolved: true, promise });
        res();
      };
      
      script.onerror = (error) => {
        scriptCache.delete(scriptUrl);
        rej(error);
      };
      
      document.head.appendChild(script);
    });
    
    scriptCache.set(scriptUrl, { resolved: false, promise });
    promise.then(resolve).catch(reject);
  });
};

export default function Remark42({ url }) {
  const { siteConfig } = useDocusaurusContext();
  const containerRef = useRef(null);
  const [showNgrokWarning, setShowNgrokWarning] = useState(false);

  const HOST = siteConfig.customFields?.REMARK42_HOST;
  const SITE_ID = siteConfig.customFields?.REMARK42_SITE_ID || 'remark';

  // Build proper Remark42 URL with required parameters
  const currentUrl = typeof window !== 'undefined' ? window.location.href : url || 'http://localhost:3000';
  const pageUrl = url || currentUrl;

  
  // Prefetch resources when component mounts
  useEffect(() => {
    if (HOST) {
      prefetchRemark42Resources(HOST);
    }
  }, [HOST]);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || !HOST) return;
    
    // Route guard: Only initialize on blog post pages
    const currentPath = window.location.pathname;
    const isBlogPostPage = currentPath.startsWith('/blog/') && 
                          currentPath !== '/blog' && 
                          currentPath !== '/blog/' &&
                          !currentPath.includes('/tags') &&
                          !currentPath.includes('/author') &&
                          !currentPath.includes('/page/');
    
    if (!isBlogPostPage) {
      return;
    }
    
    // Show ngrok warning initially for ngrok hosts
    if (HOST.includes('ngrok')) {
      setShowNgrokWarning(true);
    }
    
    // Clear any existing content and set standard container ID
    containerRef.current.innerHTML = '';
    const containerId = 'remark42';
    containerRef.current.id = containerId;
    
    // Set up Remark42 configuration - match current page protocol
    const currentProtocol = window.location.protocol;
    const adjustedPageUrl = pageUrl.replace(/^https?:\/\//, `${currentProtocol}//`);
    
    window.remark_config = {
      host: HOST,
      site_id: SITE_ID,
      url: adjustedPageUrl,
      page_title: document.title,
      theme: 'light',
      locale: 'en',
      show_email_subscription: true,
      show_rss_subscription: true,
      simple_view: false,
      no_footer: false,
      max_shown_comments: 10,
      theme: 'light',
    };
    
    
    // Use the cached script loader
    loadRemark42Script(HOST)
      .then(() => {
        // Hide ngrok warning since script loaded successfully
        if (HOST.includes('ngrok')) {
          setShowNgrokWarning(false);
        }
        
        // Initialize Remark42 in our container
        if (window.REMARK42) {
          try {
            const container = document.getElementById(containerId);
            if (container) {
              window.REMARK42.createInstance(window.remark_config);
            }
          } catch (e) {
            // Silent error handling
          }
        }
      })
      .catch((error) => {
        if (HOST.includes('ngrok')) {
          setShowNgrokWarning(true);
        }
      });
    
    return () => {
      // Comprehensive cleanup to prevent comment bleeding
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      // Destroy Remark42 instance
      if (window.REMARK42) {
        try {
          window.REMARK42.destroy();
        } catch (e) {
          // Silent cleanup
        }
      }
      
      // Clean up any remaining Remark42 elements in the DOM
      const remainingElements = document.querySelectorAll('[id^="remark42"], [class*="remark42"], .remark42-widget');
      remainingElements.forEach(el => {
        try {
          el.remove();
        } catch (e) {
          // Silent cleanup
        }
      });
      
      // Clear any global Remark42 config to prevent cross-page pollution
      if (window.remark_config) {
        delete window.remark_config;
      }
    };
  }, [HOST, SITE_ID, pageUrl]);

  return (
    <div style={{ margin: '40px 0' }}>
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e1e1e1',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ margin: 0, color: '#333' }}>Comments</h4>
          </div>
          <span style={{ fontSize: '12px', color: '#666' }}>Remark42</span>
        </div>

        {showNgrokWarning && HOST.includes('ngrok') && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              Ngrok Setup Required
            </div>
            <div style={{ marginBottom: '10px' }}>
              Before comments can load, you need to accept ngrok's terms:
            </div>
            <div style={{ marginBottom: '10px' }}>
              <a 
                href={HOST} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  background: '#007acc',
                  color: 'white',
                  padding: '8px 16px',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}
              >
                Visit {HOST} & Accept Terms
              </a>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              After accepting, refresh this page and comments will load.
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          style={{
            minHeight: '200px',
            width: '100%',
          }}
        />
      </div>
    </div>
  );
}
