# Rent Evidence Helper

[![Licence: AGPL-3.0-only](https://img.shields.io/badge/Licence-AGPL--3.0--only-black)](LICENCE)

Rent Evidence Helper is a browser-based tool for tenants in England who want
to compare a rent or proposed rent increase with the Office for National
Statistics (ONS) private-rent benchmark and prepare a calm written response.

It combines an official area-level benchmark, optional user-owned Property
Market Intel evidence, and editable dispute-support message templates. The app
does not provide legal advice or decide the legal market rent.

This repository contains the source for the GitHub Pages version of the app.

## What it does

- Compares the entered rent with the ONS monthly private-rent estimate for the
  selected Local Authority.
- Shows whether the rent is below, near, above or well above that area
  benchmark.
- Lets you optionally add your own Property Market Intel API key for live
  asking-rent listings.
- Lets you explicitly run a recent rented-record check through Property Market
  Intel when you want that extra context.
- Keeps ONS, live listings and recent rented records separate.
- Provides dispute-support message templates for evidence requests,
  informal negotiation, formal notice questions and tribunal-route preparation.
- Warns when a generated message may weaken your position.
- Links only to official guidance for rent-increase and tribunal routes.

## What it does not do

- It does not provide legal advice.
- It does not calculate tribunal deadlines.
- It does not decide whether a rent is lawful, unlawful, fair or unfair.
- It does not scrape Rightmove, Zoopla, OnTheMarket or other property portals.
- It does not provide a shared Property Market Intel API key.
- It does not send your inputs to third-party AI services.
- It does not create an account or use analytics.

## How to use it

1. Enter the rental property's postcode.
2. Select the Local Authority manually.
3. Enter the current rent or, for rent-increase situations, the proposed new
   rent.
4. Choose the property details that best match the rental property.
5. Select the situation: current rent only, informal proposed increase, or
   Form 4A / section 13 notice.
6. Start the check.
7. Review the ONS benchmark result first.
8. If you have a Property Market Intel API key, add it only if you want live
   asking-rent context.
9. Use the dispute-support section to prepare a message, then edit it before
   sending.

## Evidence sources

### ONS benchmark

The main result uses the ONS Price Index of Private Rents monthly price
statistics. This area-level Local Authority benchmark is not a figure for the
individual postcode or property.

### Property Market Intel

Property Market Intel evidence is optional and requires your own API key.

The app treats live rental listings as asking-rent context. They are not
achieved rents and not a tribunal decision.

Recent rented records are a separate, explicit check. The app uses only records
from the last 12 months and does not include exact addresses, UPRNs or full
postcodes in the result display.

### Official guidance

The app links to official guidance from GOV.UK where users need to check the
current rules, prescribed forms or open-market-rent determination route.

## Privacy

The app runs in the browser.

The full postcode stays in the browser for the normal check. The optional
recent rented-record check sends only the postcode sector to Property Market
Intel.

The Property Market Intel API key stays in the current tab unless you choose to
remember it on this device. You can clear the saved result without clearing the
API key, and you can clear the API key without clearing the result.

The browser generates dispute-support messages from the result and selected
options.

## Contributing

Bug reports, focused fixes and documentation improvements are welcome.

Keep changes narrow, test the flow you changed, and include the checks or
manual verification that match the touched area. Do not include API keys, raw
Property Market Intel responses, full addresses, UPRNs, private tenant notes or
other personal data in issues, commits, fixtures or screenshots.

Please report security or privacy issues privately instead of publishing exploit
details.

## Licence

This project uses the [GNU Affero General Public License version 3 only](LICENCE)
(`AGPL-3.0-only`). You may use, change and distribute it under the licence
terms.

The project name, branding and public presentation are not granted as trade
marks or endorsements by the software licence. See [NOTICE](NOTICE) for project
notices, external-source boundaries and data-source notes.
