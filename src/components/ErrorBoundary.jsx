import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="mt-5">
          <Alert variant="danger" className="text-center">
            <Alert.Heading>Oops! Something went wrong</Alert.Heading>
            <p>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <hr />
            <div className="d-flex justify-content-center">
              <Button onClick={this.handleReload} variant="outline-danger">
                Refresh Page
              </Button>
            </div>
            {import.meta.env.MODE === 'development' && (
              <details className="mt-3 text-start">
                <summary>Error Details (Development Only)</summary>
                <pre className="mt-2 p-3 bg-light border rounded">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
