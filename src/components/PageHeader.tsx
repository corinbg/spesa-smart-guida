import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
};

export function PageHeader({ title, subtitle, trailing }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 px-5 pb-4 pt-[calc(0.875rem+env(safe-area-inset-top))] backdrop-blur-2xl backdrop-saturate-150">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          {subtitle && (
            <p className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground">
              {subtitle}
            </p>
          )}
          <h1 className="truncate text-[1.625rem] font-bold leading-tight tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {trailing}
      </div>
    </header>
  );
}
