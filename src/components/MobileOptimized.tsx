import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileOptimizedProps {
  children: ReactNode;
  className?: string;
  withSafeArea?: boolean;
  withTouchOptimization?: boolean;
}

const MobileOptimized = ({
  children,
  className,
  withSafeArea = true,
  withTouchOptimization = true
}: MobileOptimizedProps) => {
  return (
    <div
      className={cn(
        'w-full',
        withSafeArea && 'pwa-safe-area',
        withTouchOptimization && 'touch-manipulation pwa-standalone',
        'mobile-scroll',
        className
      )}
    >
      {children}
    </div>
  );
};

export default MobileOptimized;