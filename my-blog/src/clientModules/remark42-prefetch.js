// Remark42 prefetch module - loads resources as early as possible
import { 
  prefetchRemark42Resources, 
  getRemark42HostFromWindow, 
  warmUpConnection 
} from '@site/src/utils/remark42-utils';

// Global cache for client module
const clientPrefetchCache = new Set();

export default function prefetchRemark42() {
  if (typeof window !== 'undefined') {
    const host = getRemark42HostFromWindow();
    
    if (!host) {
      return;
    }
    
    // Prefetch all Remark42 resources
    prefetchRemark42Resources(host, clientPrefetchCache);
    
    // Warm up the connection
    warmUpConnection(host);
  }
}