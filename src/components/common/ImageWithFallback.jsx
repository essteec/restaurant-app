import { useState } from 'react';
import { getImageUrl } from '@utils/helpers.js';

const ImageWithFallback = ({ 
  src, 
  alt, 
  fallback = '/images/placeholder.jpg', 
  className = '',
  style = {},
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // If src is an absolute URL (http(s) or data:), don't re-prefix it.
  const isAbsolute = (s) => typeof s === 'string' && (/^data:|^https?:\/\//i.test(s));
  
  // If src starts with /images/ or /qr-codes/, treat it as a relative path from server root
  const isServerRelative = (s) => typeof s === 'string' && (/^\/images\/|^\/qr-codes\//.test(s));

  const imageUrl = hasError
    ? fallback
    : isAbsolute(src)
      ? src  // Use absolute URLs as-is
      : isServerRelative(src)
        ? src  // Use server-relative paths as-is (e.g., /images/foo.jpg)
        : getImageUrl(src, fallback);  // Build URL from raw filename

  return (
    <div className={`position-relative ${className}`} style={style}>
      {isLoading && (
        <div 
          className="position-absolute top-50 start-50 translate-middle"
          style={{ zIndex: 1 }}
        >
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`img-fluid ${isLoading ? 'opacity-50' : ''}`}
        style={{
          transition: 'opacity 0.3s ease',
          ...style,
        }}
        {...props}
      />
    </div>
  );
};

export default ImageWithFallback;
