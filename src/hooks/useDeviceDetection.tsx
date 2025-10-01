import { useState, useEffect } from 'react';

export type DeviceType = 'ios' | 'android' | 'web';
export type DeviceOrientation = 'portrait' | 'landscape';

interface DeviceInfo {
  type: DeviceType;
  isStandalone: boolean;
  isMobile: boolean;
  isTablet: boolean;
  orientation: DeviceOrientation;
  hasNotch: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        type: 'web',
        isStandalone: false,
        isMobile: false,
        isTablet: false,
        orientation: 'portrait',
        hasNotch: false,
        screenWidth: 0,
        screenHeight: 0,
      };
    }

    return getDeviceInfo();
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(() => {
        setDeviceInfo(getDeviceInfo());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
}

function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  
  // Check if running as PWA
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://');

  // Detect orientation
  const orientation: DeviceOrientation = 
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

  // Detect notch (simplified check)
  const hasNotch = 
    isIOS && 
    isStandalone &&
    (
      window.screen.width === 390 || // iPhone 12/13/14
      window.screen.width === 393 || // iPhone 14 Pro
      window.screen.width === 428 || // iPhone 12/13/14 Pro Max
      window.screen.width === 430    // iPhone 14 Pro Max
    );

  let type: DeviceType = 'web';
  if (isIOS) type = 'ios';
  else if (isAndroid) type = 'android';

  return {
    type,
    isStandalone,
    isMobile,
    isTablet,
    orientation,
    hasNotch,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  };
}
