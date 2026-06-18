import hireVifyLogo from "../../assets/hirevify-logo-transparent.png";

interface HireVifyLogoProps {
 size?: "sm" | "md" | "lg" | "xl";
 className?: string;
}

export function HireVifyLogo({ size = "md", className = "" }: HireVifyLogoProps) {
 const sizeClasses = {
 sm: "h-8",
 md: "h-12",
 lg: "h-16",
 xl: "h-20",
 };

 return (
 <img
 src={(hireVifyLogo as any).src?? hireVifyLogo}
 alt="HireVify - Skills-first hiring platform"
 className={`${sizeClasses[size]} w-auto object-contain ${className}`}
 />
 );
}


