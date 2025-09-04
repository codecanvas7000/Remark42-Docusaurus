import React, { useEffect } from 'react';
import BlogPostItem from '@theme-original/BlogPostItem';
import Head from '@docusaurus/Head';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Remark42 from '@site/src/components/Remark42';
import { prefetchRemark42Resources, getRemark42Host } from '@site/src/utils/remark42-utils';

// Prefetch cache for this module
const blogPrefetchCache = new Set();

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
      const host = getRemark42Host(siteConfig);
      if (host) {
        prefetchRemark42Resources(host, blogPrefetchCache);
      }
    }
  }, [isBlogPostPage, siteConfig]);

  return (
    <>
      <BlogPostItem {...props} />
      {isBlogPostPage && (
        <>
          <Head>
            <meta property="og:type" content="article" />
          </Head>
          <Remark42 isBlogPostPage={isBlogPostPage} />
        </>
      )}
    </>
  );
}
