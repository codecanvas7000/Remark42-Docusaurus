import React, { useEffect, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Remark42({ url }) {
  const { siteConfig } = useDocusaurusContext();
  const containerRef = useRef(null);
  const [showNgrokWarning, setShowNgrokWarning] = useState(false);

  const HOST = siteConfig.customFields?.REMARK42_HOST;
  const SITE_ID = siteConfig.customFields?.REMARK42_SITE_ID || 'remark';

  // Build proper Remark42 URL with required parameters
  const currentUrl = typeof window !== 'undefined' ? window.location.href : url || 'http://localhost:3000';
  const pageUrl = url || currentUrl;

  console.log('=== REMARK42 COMPONENT DEBUG ===');
  console.log('Component props:', { url });
  console.log('Site config custom fields:', siteConfig.customFields);
  console.log('HOST:', HOST);
  console.log('SITE_ID:', SITE_ID);
  console.log('Page URL:', pageUrl);
  console.log('Current page URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  console.log('User agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR');
  console.log('Document ready state:', typeof document !== 'undefined' ? document.readyState : 'SSR');
  
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    
    console.log('=== REMARK42 USEEFFECT ===');
    console.log('Loading Remark42 with JavaScript embedding');
    
    // Show ngrok warning initially for ngrok hosts
    if (HOST && HOST.includes('ngrok')) {
      setShowNgrokWarning(true);
    }
    
    // Clear any existing content
    containerRef.current.innerHTML = '';
    
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
    
    console.log('Remark42 config:', window.remark_config);
    
    // Load Remark42 script dynamically  
    const script = document.createElement('script');
    
    // For ngrok URLs, add the bypass parameter to avoid browser warning
    if (HOST.includes('ngrok')) {
      script.src = `${HOST}/web/embed.js?ngrok-skip-browser-warning=true`;
      console.log('Loading Remark42 script with ngrok bypass parameter');
    } else {
      script.src = `${HOST}/web/embed.js`;
    }
    
    script.async = true;
    script.onload = () => {
      console.log('Remark42 script loaded successfully');
      
      // Hide ngrok warning since script loaded successfully
      if (HOST && HOST.includes('ngrok')) {
        setShowNgrokWarning(false);
      }
      
      // Initialize Remark42 in our container
      if (window.REMARK42) {
        try {
          window.REMARK42.createInstance(window.remark_config);
          console.log('Remark42 instance created');
        } catch (e) {
          console.error('Error creating Remark42 instance:', e);
        }
      }
    };
    script.onerror = (error) => {
      console.error('Failed to load Remark42 script:', error);
      if (HOST.includes('ngrok')) {
        setShowNgrokWarning(true);
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup
      document.head.removeChild(script);
      if (window.REMARK42) {
        try {
          window.REMARK42.destroy();
          console.log('Remark42 instance destroyed');
        } catch (e) {
          console.log('Error destroying Remark42 instance:', e);
        }
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
              🚀 Ngrok Setup Required
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
          id="remark42"
          style={{
            minHeight: '200px',
            width: '100%',
          }}
        />
      </div>
    </div>
  );
}
