import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Enhanced Skeleton component that matches boneyard-js API.
 * This ensures the app works even without the external package.
 */
const Skeleton = ({ className, loading = true, children, name, ...props }) => {
  // If not loading, just show children
  if (!loading) return <>{children}</>;

  // If loading and has children, we wrap the children area
  if (children) {
    return (
      <div className="relative w-full h-full">
        <div className="opacity-0 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className={cn("w-full h-full animate-pulse bg-slate-200/80 rounded-2xl", className)} />
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    );
  }

  // Simple placeholder
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/60", className)}
      {...props}
    />
  );
};

export { Skeleton };
export default Skeleton;
