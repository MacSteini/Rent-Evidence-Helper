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

from ingest_ons_pipr import DATASET_PAGE_URL, IngestError, parse_dataset_page


USER_AGENT = "Rent Evidence Helper source freshness check"


@dataclass(frozen=True)
class Source:
    label: str
    url: str
    required_markers: tuple[str, ...] = ()


SOURCES: List[Source] = [
    Source(
        "GOV.UK assured periodic tenancy rent increases",
        "https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases",
        ("Rent increases", "form 4A", "First-tier Tribunal"),
    ),
    Source(
        "GOV.UK assured tenancy forms",
        "https://www.gov.uk/guidance/assured-tenancy-forms",
        ("Assured tenancy forms", "Form 4A", "Applies to England"),
    ),
    Source(
        "GOV.UK open market rent determination",
        "https://www.gov.uk/guidance/apply-for-an-open-market-rent-determination",
        ("open market rent determination", "First-tier Tribunal", "England"),
    ),
    Source(
        "GOV.UK Renters’ Rights Act information sheet",
        "https://www.gov.uk/government/publications/the-renters-rights-act-information-sheet-2026",
        ("Renters’ Rights Act", "Information Sheet"),
    ),
    Source(
        "Property Market Intel API docs",
        "https://www.propertymarketintel.com/api-docs",
        ("Property Market Intel", "API"),
    ),
    Source(
        "Property Market Intel listings endpoint",
        "https://www.propertymarketintel.com/api-docs/reference/listings",
        ("listings", "type"),
    ),
    Source(
        "Property Market Intel comparables endpoint",
        "https://www.propertymarketintel.com/api-docs/reference/prices-comparables",
        ("comparables", "prices"),
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
    rows = [check_ons_source(), *[check_source(source) for source in SOURCES]]
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

    missing = [
        marker
        for marker in source.required_markers
        if not re.search(re.escape(marker), body, flags=re.IGNORECASE)
    ]
    if missing:
        return {
            "label": source.label,
            "url": source.url,
            "status": "review",
            "detail": f"Expected text not found: {', '.join(missing)}",
        }

    return {
        "label": source.label,
        "url": source.url,
        "status": "ok",
        "detail": f"HTTP {status_code}",
    }


def check_ons_source() -> dict[str, str]:
    request = urllib.request.Request(DATASET_PAGE_URL, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8", errors="replace")
        metadata = parse_dataset_page(body, DATASET_PAGE_URL)
    except urllib.error.HTTPError as error:
        return {
            "label": "ONS PIPR monthly price statistics",
            "url": DATASET_PAGE_URL,
            "status": "error",
            "detail": f"HTTP {error.code}",
        }
    except (OSError, IngestError) as error:
        return {
            "label": "ONS PIPR monthly price statistics",
            "url": DATASET_PAGE_URL,
            "status": "review",
            "detail": str(error),
        }

    return {
        "label": "ONS PIPR monthly price statistics",
        "url": DATASET_PAGE_URL,
        "status": "ok",
        "detail": (
            f"release {metadata.release_date}; next {metadata.next_release}; "
            f"xlsx {metadata.source_file_url}"
        ),
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
