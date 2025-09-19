/**
 * Cache Management Utilities
 * Helps prevent and resolve caching issues that can cause persistent errors
 */

export class CacheManager {
  private static readonly CACHE_VERSION_KEY = 'app_cache_version';
  private static readonly CURRENT_VERSION = '3.0.0';

  /**
   * Check if cache needs to be cleared based on version
   */
  static shouldClearCache(): boolean {
    const storedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
    return storedVersion !== this.CURRENT_VERSION;
  }

  /**
   * Clear all application caches
   */
  static async clearAllCaches(): Promise<void> {
    try {
      console.log('CacheManager: Clearing all caches...');

      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }

      // Set new cache version
      localStorage.setItem(this.CACHE_VERSION_KEY, this.CURRENT_VERSION);

      console.log('CacheManager: All caches cleared successfully');
    } catch (error) {
      console.error('CacheManager: Error clearing caches:', error);
      throw error;
    }
  }

  /**
   * Initialize cache management on app startup
   */
  static initialize(): void {
    try {
      console.log('CacheManager: Initializing...');

      // Check if we need to clear cache due to version change
      if (this.shouldClearCache()) {
        console.log('CacheManager: Version mismatch detected, clearing caches...');
        this.clearAllCaches().then(() => {
          console.log('CacheManager: Cache cleared due to version update');
          this.notifyUpdateApplied();
        });
      } else {
        // Just update the version timestamp
        localStorage.setItem(this.CACHE_VERSION_KEY, this.CURRENT_VERSION);
      }

      // Add global error listener for cache-related errors
      window.addEventListener('error', (event) => {
        const errorMessage = event.error?.message || event.message || '';
        
        // Detect cache-related errors
        if (errorMessage.includes('ChunkLoadError') ||
            errorMessage.includes('Loading CSS chunk') ||
            errorMessage.includes('Loading chunk')) {
          console.warn('CacheManager: Cache-related error detected:', errorMessage);
          
          // Store error info for user
          sessionStorage.setItem('cacheError', JSON.stringify({
            message: errorMessage,
            timestamp: new Date().toISOString(),
            suggestion: 'Clear browser cache or try incognito mode'
          }));
          
          // Auto-attempt to fix cache issues
          this.attemptCacheFix();
        }
      });

      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

    } catch (error) {
      console.error('CacheManager: Initialization failed:', error);
    }
  }

  /**
   * Handle coming back online
   */
  private static handleOnline(): void {
    console.log('CacheManager: Back online, checking for updates...');
    
    // Dispatch custom event for update service
    window.dispatchEvent(new CustomEvent('connection-restored'));
    
    // Check for pending updates
    this.checkForPendingUpdates();
  }

  /**
   * Handle going offline
   */
  private static handleOffline(): void {
    console.log('CacheManager: Gone offline');
    
    // Save current state for offline recovery
    sessionStorage.setItem('offlineTimestamp', Date.now().toString());
  }

  /**
   * Attempt to fix cache-related issues automatically
   */
  private static async attemptCacheFix(): Promise<void> {
    try {
      console.log('CacheManager: Attempting automatic cache fix...');
      
      // Clear problematic caches first
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const problematicCaches = cacheNames.filter(name => 
          name.includes('workbox') || name.includes('precache')
        );
        
        await Promise.all(
          problematicCaches.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Force refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('CacheManager: Auto-fix failed:', error);
    }
  }

  /**
   * Check for pending updates when coming back online
   */
  private static checkForPendingUpdates(): void {
    // Dispatch event to trigger update check
    window.dispatchEvent(new CustomEvent('check-for-updates'));
  }

  /**
   * Notify that an update has been applied
   */
  private static notifyUpdateApplied(): void {
    const updateInfo = {
      timestamp: Date.now(),
      version: this.CURRENT_VERSION,
      type: 'cache-cleared'
    };
    
    localStorage.setItem('lastUpdate', JSON.stringify(updateInfo));
    
    // Dispatch event for UI components
    window.dispatchEvent(new CustomEvent('update-applied', { detail: updateInfo }));
  }

  /**
   * Force refresh with cache clearing
   */
  static forceRefresh(): void {
    this.clearAllCaches().then(() => {
      window.location.reload();
    }).catch(() => {
      // Fallback to simple reload
      window.location.reload();
    });
  }

  /**
   * Get cache status information
   */
  static async getCacheStatus(): Promise<{
    version: string;
    cacheNames: string[];
    storageUsed: number;
    serviceWorkerRegistered: boolean;
  }> {
    const cacheNames = 'caches' in window ? await caches.keys() : [];
    const storageUsed = this.estimateStorageUsage();
    const serviceWorkerRegistered = 'serviceWorker' in navigator && 
      !!(await navigator.serviceWorker.getRegistration());

    return {
      version: localStorage.getItem(this.CACHE_VERSION_KEY) || 'unknown',
      cacheNames,
      storageUsed,
      serviceWorkerRegistered
    };
  }

  /**
   * Estimate storage usage in bytes
   */
  private static estimateStorageUsage(): number {
    let total = 0;
    
    // Estimate localStorage usage
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }

    // Estimate sessionStorage usage
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        total += sessionStorage[key].length + key.length;
      }
    }

    return total * 2; // Rough estimate (UTF-16 encoding)
  }
}

// Auto-initialize on module load
CacheManager.initialize();