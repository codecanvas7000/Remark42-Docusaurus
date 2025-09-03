// CSP is completely disabled - no CSP enforcement
export default function configureCspForRemark42() {
  if (typeof window !== 'undefined') {
    // Remove any existing CSP meta tags
    const existingMeta = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]'
    );
    if (existingMeta) {
      existingMeta.remove();
    }
  }
}
