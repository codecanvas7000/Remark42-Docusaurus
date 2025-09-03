import React, { useEffect } from 'react';
import BlogPostItem from '@theme-original/BlogPostItem';
import Head from '@docusaurus/Head';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Remark42 from '@site/src/components/Remark42';

// Early prefetch for blog post pages
const prefetchRemark42ForBlog = (host) => {
  if (typeof window === 'undefined' || !host) return;
  
  
  // Ensure DNS and connection are warmed up
  const ensureConnection = (rel, href) => {
    if (!document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (rel === 'preconnect') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  };
  
  ensureConnection('dns-prefetch', host);
  ensureConnection('preconnect', host);
  
  // Ensure script is preloaded
  const scriptUrl = host.includes('ngrok') 
    ? `${host}/web/embed.js?ngrok-skip-browser-warning=true`
    : `${host}/web/embed.js`;
    
  if (!document.querySelector(`link[rel="preload"][href="${scriptUrl}"]`)) {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'script';
    preloadLink.href = scriptUrl;
    document.head.appendChild(preloadLink);
  }
};

export default function BlogPostItemWrapper(props) {
  const location = useLocation();
  const { siteConfig } = useDocusaurusContext();

  // Check if we're on a full blog post page
  const isBlogPostPage =
    location.pathname.startsWith('/blog/') &&
    location.pathname !== '/blog' &&
    location.pathname !== '/blog/' &&
    !location.pathname.includes('/tags') &&
    !location.pathname.includes('/author') &&
    !location.pathname.includes('/page/');

  // Prefetch Remark42 resources when this is a blog post page
  useEffect(() => {
    if (isBlogPostPage) {
      const host = siteConfig.customFields?.REMARK42_HOST;
      prefetchRemark42ForBlog(host);
    }
  }, [isBlogPostPage, siteConfig.customFields?.REMARK42_HOST]);

  return (
    <>
      <BlogPostItem {...props} />
      {isBlogPostPage && (
        <>
          <Head>
            <meta property="og:type" content="article" />
          </Head>
          <Remark42 />
        </>
      )}
    </>
  );
}
