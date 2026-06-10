/**
 * Performance utilities to prevent timeouts and improve app responsiveness
 */

/**
 * Wraps a function with a timeout to prevent long-running operations
 */
export function withTimeout<T>(
  fn: () => Promise<T> | T,
  timeoutMs: number = 5000,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    try {
      const result = fn();
      
      if (result instanceof Promise) {
        result
          .then((value) => {
            clearTimeout(timer);
            resolve(value);
          })
          .catch((error) => {
            clearTimeout(timer);
            reject(error);
          });
      } else {
        clearTimeout(timer);
        resolve(result);
      }
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

/**
 * Debounces a function to prevent excessive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttles a function to limit how often it can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Creates a safe async function that won't throw unhandled errors
 */
export function safeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  fallback?: any
): (...args: Parameters<T>) => Promise<ReturnType<T> | typeof fallback> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Safe async function error:', error);
      return fallback;
    }
  };
}

/**
 * Monitors component render performance
 */
export function measurePerformance(name: string, fn: () => void): void {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  
  if (duration > 100) { // Log if slower than 100ms
    console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
  }
}

/**
 * Creates a performance-monitored version of a function
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    const duration = end - start;
    
    if (duration > 50) { // Log if slower than 50ms
      console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
}




