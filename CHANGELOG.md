# Changelog

All notable user-facing changes to Rent Evidence Helper are documented here.

This project uses semantic versioning for public app updates.

## [1.0.0] - 2026-06-01

### Added

- First public-ready version of Rent Evidence Helper.
- ONS Local Authority rent benchmark comparison for rental properties in
  England.
- Optional user-owned Property Market Intel live asking-rent evidence.
- Optional recent rented-record check using the user's own Property Market
  Intel API key.
- Dispute Support message templates for evidence requests, informal
  negotiation, formal notice questions and tribunal-route preparation.
- Advisor guardrails that warn when a generated message may weaken the user's
  position.
- Local browser storage for the latest result, with separate controls for
  clearing the saved result and the API key.
- Dark mode, responsive layout and accessible dialogs for methodology, privacy
  and scope information.

### Notes

- The app is informational and does not provide legal advice.
- ONS data is an area-level benchmark, not a decision about an individual rent.
- Property Market Intel evidence is optional context and uses the user's own
  API key.
- The app does not scrape property portals and does not include a shared API
  key.
