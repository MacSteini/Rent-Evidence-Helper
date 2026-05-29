# Market Rent Check

Fixture-first MVP for a public, no-login rent comparison tool for tenants in
England.

## Scripts

- `npm run dev` starts the local Vite server.
- `npm run build` type-checks and builds the static app.
- `npm run test` runs unit tests.
- `npm run typecheck` runs TypeScript checks.
- `npm run lint` currently runs the same TypeScript check until a dedicated
  linter is added.

## Data Mode

The MVP uses fixture comparable-rent data. It must not be presented as live
market evidence and does not scrape property portals.

## Publication

The app is configured for static hosting with relative asset paths. GitHub Pages
deployment is intentionally not configured or run yet.
