#!/usr/bin/env python3
"""Create a review-only freshness report for official and provider sources."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
import re
import urllib.error
import urllib.request


USER_AGENT = "Rent Evidence Helper source freshness check"


@dataclass(frozen=True)
class Source:
    label: str
    url: str
    expected_pattern: Optional[str] = None


SOURCES: List[Source] = [
    Source(
        "ONS PIPR monthly price statistics",
        "https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics",
        "Price Index of Private Rents",
    ),
    Source(
        "GOV.UK assured periodic tenancy rent increases",
        "https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases",
        "rent increases",
    ),
    Source(
        "GOV.UK assured tenancy forms",
        "https://www.gov.uk/guidance/assured-tenancy-forms",
        "Assured tenancy forms",
    ),
    Source(
        "GOV.UK open market rent determination",
        "https://www.gov.uk/guidance/apply-for-an-open-market-rent-determination",
        "open market rent determination",
    ),
    Source(
        "GOV.UK Renters’ Rights Act information sheet",
        "https://www.gov.uk/government/publications/the-renters-rights-act-information-sheet-2026",
        "Renters’ Rights Act",
    ),
    Source(
        "Property Market Intel API docs",
        "https://www.propertymarketintel.com/api-docs",
        "Property Market Intel",
    ),
    Source(
        "Property Market Intel listings endpoint",
        "https://www.propertymarketintel.com/api-docs/reference/listings",
        "listings",
    ),
    Source(
        "Property Market Intel comparables endpoint",
        "https://www.propertymarketintel.com/api-docs/reference/prices-comparables",
        "comparables",
    ),
]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Write a review-only source freshness report."
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional Markdown output path. Defaults to stdout.",
    )
    args = parser.parse_args()

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    rows = [check_source(source) for source in SOURCES]
    report = render_report(generated_at, rows)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(report, encoding="utf-8")
    else:
        print(report)

    return 1 if any(row["status"] != "ok" for row in rows) else 0


def check_source(source: Source) -> dict[str, str]:
    request = urllib.request.Request(source.url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status_code = response.status
            body = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as error:
        return {
            "label": source.label,
            "url": source.url,
            "status": "error",
            "detail": f"HTTP {error.code}",
        }
    except OSError as error:
        return {
            "label": source.label,
            "url": source.url,
            "status": "error",
            "detail": str(error),
        }

    if status_code >= 400:
        return {
            "label": source.label,
            "url": source.url,
            "status": "error",
            "detail": f"HTTP {status_code}",
        }

    if source.expected_pattern and not re.search(
        re.escape(source.expected_pattern), body, flags=re.IGNORECASE
    ):
        return {
            "label": source.label,
            "url": source.url,
            "status": "review",
            "detail": f"Expected text not found: {source.expected_pattern}",
        }

    return {
        "label": source.label,
        "url": source.url,
        "status": "ok",
        "detail": f"HTTP {status_code}",
    }


def render_report(generated_at: str, rows: List[dict[str, str]]) -> str:
    lines = [
        "# Source Freshness Report",
        "",
        f"Generated: `{generated_at}`",
        "",
        "This report is review-only. It does not update legal copy or product behaviour.",
        "",
        "| Source | Status | Detail | URL |",
        "| --- | --- | --- | --- |",
    ]
    for row in rows:
        lines.append(
            f"| {row['label']} | {row['status']} | {row['detail']} | {row['url']} |"
        )
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    raise SystemExit(main())
