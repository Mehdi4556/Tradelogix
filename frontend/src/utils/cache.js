// Cache utility for API optimization
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.inProgress = new Map();
    this.expiry = 5 * 60 * 1000; // 5 minutes default
  }

  // Generate cache key from URL and params
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    return `${url}?${JSON.stringify(sortedParams)}`;
  }

  // Check if cache entry is valid
  isValid(entry) {
    return entry && (Date.now() - entry.timestamp) < this.expiry;
  }

  // Get from cache
  get(key) {
    const entry = this.cache.get(key);
    if (this.isValid(entry)) {
      return entry.data;
    }
    // Remove expired entry
    this.cache.delete(key);
    return null;
  }

  // Set cache entry
  set(key, data, customExpiry = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: customExpiry || this.expiry
    });
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.inProgress.clear();
  }

  // Check if request is in progress
  isInProgress(key) {
    return this.inProgress.has(key);
  }

  // Set request as in progress
  setInProgress(key, promise) {
    this.inProgress.set(key, promise);
    // Clean up when done
    promise.finally(() => {
      this.inProgress.delete(key);
    });
  }

  // Get in-progress request
  getInProgress(key) {
    return this.inProgress.get(key);
  }

  // Remove from cache
  remove(key) {
    this.cache.delete(key);
  }

  // Clear expired entries
  clearExpired() {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const apiCache = new ApiCache();

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  apiCache.clearExpired();
}, 5 * 60 * 1000);

export default apiCache; 