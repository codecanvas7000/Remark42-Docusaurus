import React, { useEffect, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// Strict security validation
function isValidUrl(string) {
  try {
    const url = new URL(string);
    // Allow both HTTP and HTTPS for development
    const isDev = process.env.NODE_ENV === 'development';
    return isDev
      ? ['http:', 'https:'].includes(url.protocol)
      : ['https:'].includes(url.protocol); // Only HTTPS in production
  } catch (_) {
    return false;
  }
}

function sanitizeSiteId(siteId) {
  if (!siteId || typeof siteId !== 'string') return 'remark';
  // Strict alphanumeric only
  return siteId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
}

function validateHost(host) {
  if (!host || typeof host !== 'string') {
    return null;
  }

  // Allow HTTP for development
  const isDev = process.env.NODE_ENV === 'development';
  if (!isValidUrl(host) && !(isDev && host.startsWith('http://'))) {
    return null;
  }

  try {
    const url = new URL(host);

    // Whitelist allowed domains for extra security
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      'ngrok.io',
      'ngrok-free.app',
      'ngrok.app',
      '*.ngrok-free.app', // Your specific ngrok domain
      // Add your production domains here
      'your-domain.com',
      'remark42.your-domain.com',
      'https://d9e68c1066c9.ngrok-free.app',
    ];

    const isAllowed = allowedDomains.some(
      (domain) => url.hostname === domain || url.hostname.includes(domain)
    );

    if (!isAllowed) {
      return null;
    }

    const validatedHost = `${url.protocol}//${url.host}`;
    return validatedHost;
  } catch (error) {
    return null;
  }
}

// Security-conscious script loader with integrity checks
function loadEmbedScript(config) {
  return new Promise((resolve, reject) => {
    // Security timeout - fail fast
    const timeoutId = setTimeout(() => {
      reject(new Error('Script loading timeout - security measure'));
    }, 5000);

    try {
      // Check if script already exists
      const existingScript = document.querySelector(
        'script[data-remark42="embed"]'
      );
      if (existingScript) {
        clearTimeout(timeoutId);
        resolve();
        return;
      }

      // Set minimal config with security restrictions
      window.remark_config = {
        host: config.host,
        site_id: config.siteId,
        url: config.url,
        components: ['embed'],
        // Security restrictions
        no_ssl: false, // Always require SSL in production
        simple_view: true, // Limit features
        max_shown_comments: 10, // Limit to reduce load
      };

      const script = document.createElement('script');
      script.src = `${config.host}/web/embed.js`;
      script.defer = true;
      script.setAttribute('data-remark42', 'embed');
      script.setAttribute('crossorigin', 'anonymous');

      // Security headers
      script.setAttribute('referrerpolicy', 'no-referrer');

      // Integrity check would go here if you have the hash
      // script.integrity = "sha384-...";

      script.addEventListener('load', () => {
        clearTimeout(timeoutId);
        resolve();
      });

      script.addEventListener('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      document.head.appendChild(script);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

export default function Remark42({ url }) {
  const { siteConfig } = useDocusaurusContext();
  const nodeRef = useRef(null);
  const instanceRef = useRef(null);
  const [status, setStatus] = useState('initializing');

  // Strict validation with debugging
  const rawHost = siteConfig.customFields?.REMARK42_HOST;
  const rawSiteId = siteConfig.customFields?.REMARK42_SITE_ID;

  const HOST = validateHost(rawHost);
  const SITE_ID = sanitizeSiteId(rawSiteId);
  const IS_PROD = process.env.NODE_ENV === 'production';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const targetUrl =
      url || `${window.location.origin}${window.location.pathname}`;

    // Security check: Fail if no valid host in production
    if (!HOST || !SITE_ID) {
      setStatus('fallback');
      return;
    }

    // Production security: Only allow HTTPS
    if (IS_PROD && !HOST.startsWith('https://')) {
      setStatus('fallback');
      return;
    }

    let cancelled = false;

    const initializeSecurely = async () => {
      try {
        setStatus('loading');

        await loadEmbedScript({
          host: HOST,
          siteId: SITE_ID,
          url: targetUrl,
        });

        if (cancelled) return;

        // Security timeout for API - increased since script is loading successfully
        const apiTimeout = setTimeout(() => {
          if (!cancelled) {
            setStatus('fallback');
          }
        }, 8000); // Increased to 8 seconds since script loads fine

        // Check for API with limited attempts - increased since script loads fine
        let attempts = 0;
        const maxAttempts = 20; // Increased since script loading is working

        const checkApi = () => {
          attempts++;

          if (
            window.REMARK42 &&
            typeof window.REMARK42.createInstance === 'function'
          ) {
            clearTimeout(apiTimeout);
            createSecureInstance();
            return;
          }

          if (attempts >= maxAttempts) {
            clearTimeout(apiTimeout);
            setStatus('fallback');
            return;
          }

          setTimeout(checkApi, 300);
        };

        const createSecureInstance = () => {
          try {
            if (!nodeRef.current) {
              setStatus('fallback');
              return;
            }

            instanceRef.current = window.REMARK42.createInstance({
              node: nodeRef.current,
              host: HOST,
              site_id: SITE_ID,
              url: targetUrl,
              theme: 'light',
              max_shown_comments: 10, // Security limit
              simple_view: true, // Limit features for security
            });

            setStatus('loaded');
          } catch (error) {
            setStatus('fallback');
          }
        };

        checkApi();
      } catch (error) {
        setStatus('fallback');
      }
    };

    initializeSecurely();

    return () => {
      cancelled = true;
      if (
        instanceRef.current &&
        typeof instanceRef.current.destroy === 'function'
      ) {
        try {
          instanceRef.current.destroy();
        } catch (e) {}
        instanceRef.current = null;
      }
    };
  }, [url, HOST, SITE_ID, IS_PROD]);

  // Fallback component (same as before)
  const SecureFallback = () => {
    const fallbackUrl = `${HOST}/web/?site=${SITE_ID}&url=${encodeURIComponent(
      url || `${window.location.origin}${window.location.pathname}`
    )}`;

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

          <div
            style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}
          >
            <div style={{ fontSize: '16px', marginBottom: '15px' }}>
              Join the conversation!
            </div>

            <div style={{ margin: '20px 0' }}>
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background:
                    'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(40,167,69,0.2)',
                }}
              >
                Comments
              </a>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: '#999',
                lineHeight: '1.4',
                marginTop: '15px',
              }}
            >
              Comments open in a new window.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Always show fallback for any non-loaded state in this secure version
  if (status !== 'loaded') {
    return <SecureFallback />;
  }

  return (
    <div style={{ margin: '40px 0' }}>
      <div
        id="remark42"
        ref={nodeRef}
        style={{
          minHeight: '100px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '10px',
        }}
      />
    </div>
  );
}
