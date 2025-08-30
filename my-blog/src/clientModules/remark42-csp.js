// CSP is completely disabled - no CSP enforcement
export default function configureCspForRemark42() {
  if (typeof window !== 'undefined') {
    console.log('[CSP] Content Security Policy is completely disabled');
    console.log('[CSP] No CSP headers will be set or enforced');
    
    // Remove any existing CSP meta tags
    const existingMeta = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]'
    );
    if (existingMeta) {
      console.log('[CSP] Removing existing CSP meta tag:', existingMeta.getAttribute('content'));
      existingMeta.remove();
    }
    
    // Log that CSP is disabled
    console.log('[CSP] All content loading restrictions removed');
    console.log('[CSP] Inline scripts, eval, and external resources are unrestricted');
  }
}
