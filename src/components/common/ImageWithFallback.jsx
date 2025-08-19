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

  const imageUrl = hasError ? fallback : getImageUrl(src, fallback);

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
