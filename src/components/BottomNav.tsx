import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, ClipboardList, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/menu", label: "Menu", Icon: UtensilsCrossed },
  { to: "/preparazione", label: "Spesa", Icon: ClipboardList },
  { to: "/shopping", label: "In Negozio", Icon: ShoppingCart },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-muted-foreground transition-colors"
              activeProps={{ className: "!text-primary" }}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn("h-6 w-6 transition-all", isActive && "stroke-[2.5]")}
                  />
                  <span className={cn("text-[11px] font-medium", isActive && "font-bold")}>
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
