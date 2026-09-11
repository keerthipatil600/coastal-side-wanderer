import { Link } from "@tanstack/react-router";
import { Compass, Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/plan", label: "Plan a trip" },
  { to: "/dashboard", label: "My trips" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/admin", label: "Admin" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Compass className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-tight">
              CoastWise AI
            </span>
            <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Less planning. More exploring.
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
          <Button asChild size="sm" className="ml-2 rounded-full">
            <Link to="/plan">Plan my trip</Link>
          </Button>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      <div className={cn("border-t border-border/60 md:hidden", open ? "block" : "hidden")}>
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
