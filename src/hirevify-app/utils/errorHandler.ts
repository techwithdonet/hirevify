/**
 * Global error handler for runtime errors
 */

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {
    this.setupGlobalErrorHandling();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.logError(new Error(`Unhandled promise rejection: ${event.reason}`), 'promise-rejection');
      
      // Prevent the error from being logged in the console again
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Uncaught error:', event.error);
      this.logError(event.error, 'uncaught-error');
    });

    // Handle React errors (for development)
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Check if this is a React error
        if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
          this.logError(new Error(args.join(' ')), 'react-error');
        }
        originalConsoleError.apply(console, args);
      };
    }
  }

  private logError(error: Error, context: string) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Details');
      console.error('Context:', context);
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      console.error('URL:', window.location.href);
      console.groupEnd();
    }

    // In production, you could send this to an error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error monitoring service
      // this.sendToMonitoringService(errorData);
    }
  }

  public handleComponentError(error: Error, componentName: string, additionalContext?: any) {
    console.error(`Error in ${componentName}:`, error);
    
    const errorData = {
      component: componentName,
      error: error.message,
      stack: error.stack,
      context: additionalContext,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 Component Error: ${componentName}`);
      console.error('Error:', error);
      console.error('Additional Context:', additionalContext);
      console.groupEnd();
    }

    return errorData;
  }

  // Utility method for safe function execution
  public safeFunctionCall<T>(fn: () => T, fallback: T, context?: string): T {
    try {
      return fn();
    } catch (error) {
      console.error(`Safe function call failed${context ? ` in ${context}` : ''}:`, error);
      this.logError(error as Error, context || 'safe-function-call');
      return fallback;
    }
  }

  // Utility method for safe async function execution
  public async safeAsyncFunctionCall<T>(
    fn: () => Promise<T>, 
    fallback: T, 
    context?: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`Safe async function call failed${context ? ` in ${context}` : ''}:`, error);
      this.logError(error as Error, context || 'safe-async-function-call');
      return fallback;
    }
  }
}

// Initialize the error handler
export const errorHandler = ErrorHandler.getInstance();

// Export for global access
declare global {
  interface Window {
    errorHandler: ErrorHandler;
  }
}

window.errorHandler = errorHandler;




