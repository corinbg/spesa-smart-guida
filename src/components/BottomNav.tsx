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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/90 shadow-[0_-4px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-muted-foreground transition-all duration-300"
              activeProps={{ className: "!text-primary" }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-x-3 top-1 h-8 rounded-2xl bg-primary/15"
                      aria-hidden
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 h-6 w-6 transition-all duration-300",
                      isActive && "scale-110 stroke-[2.5] drop-shadow-[0_0_6px] drop-shadow-primary/50",
                    )}
                  />
                  <span
                    className={cn(
                      "relative z-10 text-[11px] font-medium transition-all duration-300",
                      isActive && "font-extrabold",
                    )}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <span
                      className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary via-promo to-primary"
                      aria-hidden
                    />
                  )}
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
