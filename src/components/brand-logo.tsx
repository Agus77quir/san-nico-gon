const logoUrl = "/logo.png";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function BrandLogo({ className, showText = true, size = 36 }: Props) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative shrink-0 rounded-xl bg-gradient-brand p-1.5 shadow-[var(--shadow-glow)]"
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl}
          alt="San Nicolás - Renacimiento"
          className="h-full w-full object-contain"
        />
      </div>
      {showText && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide text-foreground">
            San Nicolás
          </div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Renacimiento
          </div>
        </div>
      )}
    </div>
  );
}
