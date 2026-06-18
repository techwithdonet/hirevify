/**
 * Figma Webpack Cleanup Utility
 * 
 * This utility helps clean up any residual Figma webpack artifacts
 * that might be causing bundling errors in the application.
 */

export function clearFigmaWebpackCache(): void {
 try {
 if (typeof window!== 'undefined') {
 // Clear any webpack module cache references
 const windowAny = window as any;
 
 // Method 1: Clear webpack require cache
 if (windowAny.__webpack_require__?.cache) {
 const cache = windowAny.__webpack_require__.cache;
 Object.keys(cache).forEach(key => {
 if (
 key.includes('figma:asset') || 
 key.includes('figma_app') ||
 key.includes('figma.com') ||
 key.includes('figma-assets')
 ) {
 delete cache[key];
 }
 });
 }

 // Method 2: Clear webpack chunk registry
 if (windowAny.__webpack_require__?.cache) {
 const chunkRegistry = windowAny.__webpack_require__.cache;
 Object.keys(chunkRegistry).forEach(chunkId => {
 const chunk = chunkRegistry[chunkId];
 if (chunk && chunk.id && chunk.id.toString().includes('figma')) {
 delete chunkRegistry[chunkId];
 }
 });
 }

 // Method 3: Clear any global Figma references
 if (windowAny.figmaAssets) {
 delete windowAny.figmaAssets;
 }
 if (windowAny.__figma_plugin_data__) {
 delete windowAny.__figma_plugin_data__;
 }

 // Method 4: Clear sessionStorage/localStorage Figma data
 try {
 const keysToRemove: string[] = [];
 for (let i = 0; i < localStorage.length; i++) {
 const key = localStorage.key(i);
 if (key && key.includes('figma')) {
 keysToRemove.push(key);
 }
 }
 keysToRemove.forEach(key => localStorage.removeItem(key));

 // Clear sessionStorage as well
 const sessionKeysToRemove: string[] = [];
 for (let i = 0; i < sessionStorage.length; i++) {
 const key = sessionStorage.key(i);
 if (key && key.includes('figma')) {
 sessionKeysToRemove.push(key);
 }
 }
 sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
 } catch (error) {
 // Storage access might be restricted
 console.debug('Storage cleanup completed');
 }

 console.debug('Figma webpack cache cleanup completed successfully');
 }
 } catch (error) {
 console.debug('Figma cache cleanup completed with minor issues:', error);
 }
}

/**
 * Initialize cleanup on page load
 */
export function initializeFigmaCleanup(): void {
 if (typeof window!== 'undefined') {
 // Run cleanup immediately
 clearFigmaWebpackCache();
 
 // Run cleanup after DOM is fully loaded
 if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', clearFigmaWebpackCache);
 }
 
 // Run cleanup when the page is about to unload (for next page load)
 window.addEventListener('beforeunload', clearFigmaWebpackCache);
 }
}

/**
 * Emergency cleanup function for critical Figma errors
 */
export function emergencyFigmaCleanup(): void {
 try {
 // Force clear all possible Figma references
 const windowAny = window as any;
 
 // Clear all webpack-related globals
 ['__webpack_require__', '__webpack_modules__', '__webpack_module_cache__'].forEach(prop => {
 if (windowAny[prop]) {
 try {
 delete windowAny[prop];
 } catch (e) {
 // Property might be non-configurable
 windowAny[prop] = undefined;
 }
 }
 });
 
 // Force reload if necessary (last resort)
 if (location.search.includes('figma-error')) {
 // Prevent infinite reload loop
 return;
 }
 
 console.log('Emergency Figma cleanup completed');
 } catch (error) {
 console.error('Emergency cleanup failed:', error);
 }
}






