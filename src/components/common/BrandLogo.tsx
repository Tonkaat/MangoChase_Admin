import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  title?: string;
  logoUrl?: string;
};

export function BrandLogo({ 
  className, 
  title = "Mango 主任",
  logoUrl = "/src/assets/icons/logo.png" // Default path to your logo
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label={title}>
      <img
        src={logoUrl}
        alt={`${title} logo`}
        className="h-7 w-7" // Matches original 28x28px size
        width="28"
        height="28"
        role="img"
        aria-hidden="true"
      />
      <div className="leading-tight">
        <div className="font-display text-base font-bold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">Admin</div>
      </div>
    </div>
  );
}