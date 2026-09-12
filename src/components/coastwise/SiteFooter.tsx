import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-semibold">CoastWise AI</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Curated Coastal Karnataka trip planning — from Someshwara to Karwar — built on a
            sourced knowledge base, not guesswork.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Explore</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/plan" className="hover:text-foreground">
                Plan a trip
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-foreground">
                My trips
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="hover:text-foreground">
                How it works
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Data honesty</p>
          <p className="mt-3">
            Prices, timings and travel durations are labelled <strong>Approximate</strong> unless a
            live API is connected. Weather, traffic and ticket availability always need an internet
            connection.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CoastWise AI · Less planning. More exploring.
      </div>
    </footer>
  );
}
