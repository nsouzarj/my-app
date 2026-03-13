import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({ 
  fullPage = false, 
  size = 'md', 
  label,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div 
        className={cn(
          "rounded-full animate-spin",
          "border-app-soft",
          "border-t-app-accent",
          sizeClasses[size]
        )}
      />
      {label && (
        <span className="text-sm font-bold text-app-text-dim animate-pulse">
          {label}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-app-bg/80 backdrop-blur-md">
        {spinner}
      </div>
    );
  }

  return spinner;
}
