import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// List of Figma-related errors to suppress
const FIGMA_ERROR_SIGNATURES = [
  // OLD signatures
  'figma_app-f9dcdc049c75bad1.min.js.br',
  'f9dcdc049c75bad1',
  '291:663890',
  '291:664713',
  // NEW signatures (December 2024)
  'figma_app-1eef8b3f8ed4f28d.min.js.br',
  '1eef8b3f8ed4f28d',
  '291:662046',
  '291:662869',
  // Generic patterns
  'webpack-artifacts',
  'figma.com',
  'figma_app-',
  '.min.js.br:291:'
];

function isFigmaError(error: Error): boolean {
  const errorString = error.toString().toLowerCase();
  const stackString = error.stack?.toLowerCase() || '';
  
  return FIGMA_ERROR_SIGNATURES.some(signature => 
    errorString.includes(signature.toLowerCase()) || 
    stackString.includes(signature.toLowerCase())
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // If it's a Figma error, don't trigger error boundary
    if (isFigmaError(error)) {
      console.debug('ÃƒÆ’Ã‚°Ãƒâ€¦Ã‚¸Ãƒâ€¦Ã‚¡Ãƒâ€šÃ‚« ErrorBoundary: Suppressed Figma error', error.message);
      return { hasError: false };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // If it's a Figma error, just log and continue
    if (isFigmaError(error)) {
      console.debug('ÃƒÆ’Ã‚°Ãƒâ€¦Ã‚¸Ãƒâ€¦Ã‚¡Ãƒâ€šÃ‚« ErrorBoundary: Figma error caught and suppressed', { error, errorInfo });
      this.setState({ hasError: false });
      return;
    }
    
    // For real errors, log them
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError && this.state.error && !isFigmaError(this.state.error)) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              HireVify encountered an unexpected error. Please try refreshing the page.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom hook for handling errors in functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('hirevify-user-id') || 'anonymous',
    };

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in component:', errorData);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(console.error);
    }
  };

  return { handleError };
};

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};








