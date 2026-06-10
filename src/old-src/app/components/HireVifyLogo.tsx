import hireVifyLogo from 'figma:asset/72df3ccfbe017c123913042081b5bfd9b1099c73.png';

interface HireVifyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function HireVifyLogo({ size = 'md', className = '' }: HireVifyLogoProps) {
  const sizeClasses = {
    sm: 'h-8', // 32px
    md: 'h-10', // 40px
    lg: 'h-12', // 48px
    xl: 'h-16' // 64px
  };

  return (
    <img 
      src={hireVifyLogo}
      alt="HireVify - Skills-first hiring platform"
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );
}

// Alternative compact version for navigation bars
export function HireVifyLogoCompact({ className = '' }: { className?: string }) {
  return (
    <img 
      src={hireVifyLogo}
      alt="HireVify"
      className={`h-8 w-auto ${className}`}
    />
  );
}

// Version with tagline for hero sections
export function HireVifyLogoWithTagline({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <img 
        src={hireVifyLogo}
        alt="HireVify - Skills-first hiring platform"
        className="h-16 w-auto mx-auto mb-3"
      />
      <p className="text-sm text-muted-foreground font-medium tracking-wide">
        Skills-first hiring platform
      </p>
    </div>
  );
}