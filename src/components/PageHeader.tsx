import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
};

export function PageHeader({ title, subtitle, trailing }: PageHeaderProps) {
  return (
    <header className="bg-primary px-5 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] text-primary-foreground shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {subtitle && (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/75">
              {subtitle}
            </p>
          )}
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
        </div>
        {trailing}
      </div>
    </header>
  );
}
