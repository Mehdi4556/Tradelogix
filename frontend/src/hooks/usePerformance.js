import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce, throttle } from '../utils/debounce';
import apiCache from '../utils/cache';

// Performance optimization hook
export const usePerformance = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const perfRef = useRef({
    renderCount: 0,
    lastRenderTime: Date.now()
  });

  // Track render performance
  useEffect(() => {
    perfRef.current.renderCount += 1;
    const now = Date.now();
    const timeSinceLastRender = now - perfRef.current.lastRenderTime;
    
    // If rendering too frequently, might be causing performance issues
    if (timeSinceLastRender < 16) { // 60fps = 16ms per frame
      console.warn('High frequency renders detected. Consider optimization.');
    }
    
    perfRef.current.lastRenderTime = now;
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Detect low power mode (battery saver)
  useEffect(() => {
    const checkPowerMode = () => {
      // Check if battery API is available
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          setIsLowPowerMode(battery.level < 0.2 && !battery.charging);
        });
      }
    };

    checkPowerMode();
    // Check every 5 minutes
    const interval = setInterval(checkPowerMode, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Optimized API call with caching
  const optimizedApiCall = useCallback(async (url, options = {}) => {
    const cacheKey = apiCache.generateKey(url, options);
    
    // Check cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Check if request is already in progress
    if (apiCache.isInProgress(cacheKey)) {
      return await apiCache.getInProgress(cacheKey);
    }

    // Make the request
    const promise = fetch(url, options).then(res => res.json());
    apiCache.setInProgress(cacheKey, promise);

    try {
      const result = await promise;
      apiCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchTerm, callback) => {
      if (searchTerm.trim().length > 0) {
        callback(searchTerm);
      }
    }, 300),
    []
  );

  // Throttled scroll handler
  const throttledScroll = useCallback(
    throttle((callback) => {
      callback();
    }, 100),
    []
  );

  // Memory usage monitoring
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }, []);

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return {
      renderCount: perfRef.current.renderCount,
      isOnline,
      isLowPowerMode,
      memory: getMemoryUsage(),
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }, [isOnline, isLowPowerMode, getMemoryUsage]);

  return {
    isOnline,
    isLowPowerMode,
    optimizedApiCall,
    debouncedSearch,
    throttledScroll,
    getPerformanceMetrics,
    getMemoryUsage
  };
};

// Hook for memoized expensive calculations
export const useExpensiveCalculation = (calculateFn, dependencies = []) => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = calculateFn();
    const endTime = performance.now();
    
    // Log if calculation is taking too long
    if (endTime - startTime > 100) {
      console.warn(`Expensive calculation took ${endTime - startTime}ms`);
    }
    
    return result;
  }, dependencies);
};

// Hook for tracking component mount/unmount
export const useComponentLifecycle = (componentName) => {
  const mountTime = useRef(Date.now());
  
  useEffect(() => {
    const name = componentName || 'Unknown Component';
    console.log(`${name} mounted`);
    
    return () => {
      const lifetime = Date.now() - mountTime.current;
      console.log(`${name} unmounted after ${lifetime}ms`);
    };
  }, [componentName]);
}; 