import React from 'react';
import { useLocation } from '@docusaurus/router';
import BlogPostItem from '@theme-original/BlogPostItem';
import Remark42 from '@site/src/components/Remark42';

export default function BlogPostItemWrapper(props) {
  const location = useLocation();
  
  // Only show comments on individual blog post pages, not on blog list pages
  // Individual blog posts have specific URLs like /blog/post-name or custom slugs
  // Blog list pages are /blog, /blog/, /blog/page/2, /blog/tags/*, etc.
  const isIndividualBlogPost = location.pathname !== '/blog' && 
                              location.pathname !== '/blog/' &&
                              !location.pathname.startsWith('/blog/page/') &&
                              !location.pathname.startsWith('/blog/tags/') &&
                              !location.pathname.startsWith('/blog/authors/');

  return (
    <>
      <BlogPostItem {...props} />
      {isIndividualBlogPost && <Remark42 />}
    </>
  );
}
