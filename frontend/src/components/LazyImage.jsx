import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ 
  src, 
  alt = '', 
  className = '', 
  placeholder = null,
  fallback = null,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Default placeholder
  const defaultPlaceholder = (
    <div className={`bg-gray-700 animate-pulse flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 text-gray-500">
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17l2.5-3.21L14 17H9zm4.5-6L16 14h-6l2.5-3.21L13.5 11z"/>
        </svg>
      </div>
    </div>
  );

  // Default fallback
  const defaultFallback = (
    <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 text-gray-500">
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    </div>
  );

  if (!isVisible) {
    return (
      <div ref={imgRef} className={className}>
        {placeholder || defaultPlaceholder}
      </div>
    );
  }

  if (isError) {
    return fallback || defaultFallback;
  }

  return (
    <div ref={imgRef} className={className}>
      {isLoading && (placeholder || defaultPlaceholder)}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setIsError(true);
        }}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${className}`}
        style={{
          display: isLoading ? 'none' : 'block'
        }}
        {...props}
      />
    </div>
  );
};

export default LazyImage; 