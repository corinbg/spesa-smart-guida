import { Link } from "@tanstack/react-router";
import { ClipboardList, ShoppingCart, History } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/preparazione", label: "Preparazione", Icon: ClipboardList },
  { to: "/shopping", label: "Shopping", Icon: ShoppingCart },
  { to: "/storico", label: "Storico", Icon: History },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-muted-foreground transition-colors"
              activeProps={{ className: "!text-primary" }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-9 w-14 items-center justify-center rounded-full transition-colors",
                      isActive && "bg-primary/10",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                  </span>
                  <span className={cn("text-[11px] font-medium", isActive && "font-semibold")}>
                    {label}
                  </span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
