import { cn } from "@/lib/utils";
import logo from "../../assets/icons/logo.png";

type BrandLogoProps = {
  className?: string;
  title?: string;
  logoUrl?: string;
  collapsed?: boolean;
};

export function BrandLogo({ 
  className, 
  title = "Mango Chase",
  logoUrl = logo,
  collapsed = false,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label={title}>
      <img
        src={logoUrl}
        alt={`${title} logo`}
        className="h-7 w-7 shrink-0"
        width="28"
        height="28"
        role="img"
        aria-hidden="true"
      />
      {!collapsed && (
        <div className="leading-tight transition-opacity duration-200">
          <div className="font-display text-base font-bold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">Admin</div>
        </div>
      )}
    </div>
  );
}