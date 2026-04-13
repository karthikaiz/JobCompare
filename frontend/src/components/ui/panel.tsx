import { cn } from "@/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

interface PanelHeaderProps {
  label: string;
  children?: React.ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        "bg-card border border-ink/15 overflow-hidden flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({ label, children, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "px-4 py-2.5 border-b border-ink/10 bg-cream flex items-center justify-between flex-shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-terracotta/30" />
          <span className="w-2 h-2 rounded-full bg-terracotta/20" />
          <span className="w-2 h-2 rounded-full bg-terracotta/10" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">{label}</span>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function PanelBody({ children, className }: PanelProps) {
  return (
    <div className={cn("flex-1 p-4", className)}>
      {children}
    </div>
  );
}
