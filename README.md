# Market Rent Check

No-login rent comparison tool for rental properties in England.

## What It Does

- Compares an entered rent with local comparable rental evidence.
- Shows an evidence confidence score and explains how that score is calculated.
- Links to official GOV.UK guidance for rent increases, forms and tribunal routes.
- Gives general information only. It is not legal advice and does not decide the
  legal market rent.

## Scope And Privacy

- The current rent-increase and tribunal guidance is for England only.
- The app blocks postcode areas that are clearly outside the supported England
  scope and signposts official sources for Wales and Scotland.
- It does not create accounts, use analytics or send inputs to third-party AI
  services.
- The latest completed check is stored only in the user's browser so a refresh
  can restore the result.

## Scripts

- `npm run dev` starts the local Vite server.
- `npm run build` type-checks and builds the static app.
- `npm run test` runs unit tests.
- `npm run typecheck` runs TypeScript checks.
- `npm run lint` currently runs the same TypeScript check until a dedicated
  linter is added.

## Publication

The app is configured for static hosting with relative asset paths and
launch-ready indexable metadata. GitHub Pages deployment is intentionally not
configured or run yet.
