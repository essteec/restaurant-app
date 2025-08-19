import { Spinner, Container } from 'react-bootstrap';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', fullPage = false, className = '' }) => {
  const spinnerSize = size === 'sm' ? 'sm' : undefined;
  
  const content = (
    <div className={`text-center ${className}`}>
      <Spinner animation="border" variant="primary" size={spinnerSize} />
      {text && <p className="mt-2 mb-0">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <Container className="loading-container">
        {content}
      </Container>
    );
  }

  return content;
};

export default LoadingSpinner;
