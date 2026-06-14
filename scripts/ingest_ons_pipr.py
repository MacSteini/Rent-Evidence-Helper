#!/usr/bin/env python3
"""Build the static ONS PIPR benchmark JSON used by Rent Evidence Helper."""

from __future__ import annotations

import argparse
import hashlib
from dataclasses import dataclass
from html.parser import HTMLParser
import json
import re
import sys
import tempfile
import urllib.request
import zipfile
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Iterable, List, Optional
import xml.etree.ElementTree as ET
from urllib.parse import urljoin


DATASET_PAGE_URL = (
    "https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/"
    "priceindexofprivaterentsukmonthlypricestatistics"
)
OUTPUT_PATH = Path("src/data/official-rent-benchmarks.json")
CHANGELOG_PATH = Path("CHANGELOG.md")
SITEMAP_PATH = Path("public/sitemap.xml")
SOURCE_NAME = "ONS Price Index of Private Rents"
USER_AGENT = "Rent Evidence Helper static ONS ingest"
SCHEMA_VERSION = 1
EVIDENCE_KIND = "official-area-benchmark"
TABLE_SHEET_NAME = "Table 1"
ENGLAND_LOCAL_AUTHORITY_PREFIXES = ("E06", "E07", "E08", "E09")
MIN_ENGLAND_LOCAL_AUTHORITIES = 250
SAMPLE_AREAS = {"Lambeth", "Manchester", "Bristol, City of", "Oxford"}
XML_NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
    "officeRel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
REQUIRED_COLUMNS = {
    "Time period": "period",
    "Area code": "areaCode",
    "Area name": "areaName",
    "Region or country name": "regionOrCountryName",
    "Rental price": "monthlyRentAll",
    "Rental price one bed": "monthlyRentOneBed",
    "Rental price two bed": "monthlyRentTwoBed",
    "Rental price three bed": "monthlyRentThreeBed",
    "Rental price four or more bed": "monthlyRentFourOrMoreBed",
    "Rental price flat maisonette": "monthlyRentFlatMaisonette",
}


class IngestError(Exception):
    """Raised when the source file cannot produce a valid benchmark artifact."""


@dataclass(frozen=True)
class OnsSourceMetadata:
    dataset_page_url: str
    source_file_url: str
    release_date: str
    next_release: str


class DatasetPageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.text_parts: List[str] = []
        self.links: List[tuple[str, str]] = []
        self._current_href: Optional[str] = None
        self._current_text: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[tuple[str, Optional[str]]]) -> None:
        if tag != "a":
            return
        attributes = dict(attrs)
        href = attributes.get("href")
        if href:
            self._current_href = href
            self._current_text = []

    def handle_data(self, data: str) -> None:
        self.text_parts.append(data)
        if self._current_href:
            self._current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag != "a" or not self._current_href:
            return
        self.links.append((self._current_href, " ".join(self._current_text)))
        self._current_href = None
        self._current_text = []


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Ingest ONS PIPR monthly price statistics into static JSON."
    )
    parser.add_argument(
        "--input",
        type=Path,
        help="Use a local ONS PIPR XLSX file instead of downloading the default source.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_PATH,
        help=f"Output JSON path. Defaults to {OUTPUT_PATH}.",
    )
    parser.add_argument(
        "--source-url",
        help=(
            "Use a specific ONS PIPR XLSX URL instead of discovering the current "
            "source from the ONS dataset page."
        ),
    )
    parser.add_argument(
        "--dataset-page-url",
        default=DATASET_PAGE_URL,
        help=f"ONS dataset page URL. Defaults to {DATASET_PAGE_URL}.",
    )
    parser.add_argument(
        "--release-date",
        help="Release date in YYYY-MM-DD format. Required only with --input.",
    )
    parser.add_argument(
        "--next-release",
        help="Next release date in YYYY-MM-DD format. Required only with --input.",
    )
    parser.add_argument(
        "--update-release-metadata",
        action="store_true",
        help="Update CHANGELOG.md and sitemap.xml when benchmark data changes.",
    )
    parser.add_argument(
        "--changelog",
        type=Path,
        default=CHANGELOG_PATH,
        help=f"Changelog path. Defaults to {CHANGELOG_PATH}.",
    )
    parser.add_argument(
        "--sitemap",
        type=Path,
        default=SITEMAP_PATH,
        help=f"Sitemap path. Defaults to {SITEMAP_PATH}.",
    )
    args = parser.parse_args()

    try:
        source_metadata = resolve_source_metadata(
            input_path=args.input,
            source_url=args.source_url,
            dataset_page_url=args.dataset_page_url,
            release_date=args.release_date,
            next_release=args.next_release,
        )
        source_path, downloaded = resolve_source(args.input, source_metadata.source_file_url)
        source_bytes = source_path.read_bytes()
        artifact = build_artifact(
            source_path=source_path,
            source_sha256=hashlib.sha256(source_bytes).hexdigest(),
            source_metadata=source_metadata,
            source_file_url=source_metadata.source_file_url if downloaded else None,
            existing_artifact=read_existing_artifact(args.output),
        )
        args.output.parent.mkdir(parents=True, exist_ok=True)
        changed = write_json_if_changed(args.output, artifact)
        if changed and args.update_release_metadata:
            update_changelog(args.changelog, artifact)
            update_sitemap_lastmod(
                args.sitemap, datetime.now(timezone.utc).date().isoformat()
            )
        print(
            ("Wrote " if changed else "No changes for ") +
            f"{len(artifact['benchmarks'])} official rent benchmarks for "
            f"{artifact['period']} to {args.output}"
        )
        return 0
    except (OSError, zipfile.BadZipFile, ET.ParseError, IngestError) as error:
        print(f"ONS PIPR ingest failed: {error}", file=sys.stderr)
        return 1


def resolve_source_metadata(
    input_path: Optional[Path],
    source_url: Optional[str],
    dataset_page_url: str,
    release_date: Optional[str],
    next_release: Optional[str],
) -> OnsSourceMetadata:
    if input_path:
        if not release_date or not next_release:
            raise IngestError("--release-date and --next-release are required with --input")
        validate_iso_date(release_date, "--release-date")
        validate_iso_date(next_release, "--next-release")
        return OnsSourceMetadata(
            dataset_page_url=dataset_page_url,
            source_file_url=source_url or str(input_path),
            release_date=release_date,
            next_release=next_release,
        )

    if source_url:
        page_metadata = discover_current_source(dataset_page_url)
        return OnsSourceMetadata(
            dataset_page_url=dataset_page_url,
            source_file_url=source_url,
            release_date=page_metadata.release_date,
            next_release=page_metadata.next_release,
        )

    return discover_current_source(dataset_page_url)


def discover_current_source(dataset_page_url: str) -> OnsSourceMetadata:
    return parse_dataset_page(fetch_text(dataset_page_url), dataset_page_url)


def parse_dataset_page(html: str, dataset_page_url: str = DATASET_PAGE_URL) -> OnsSourceMetadata:
    parser = DatasetPageParser()
    parser.feed(html)
    page_text = normalise_space(" ".join(parser.text_parts))
    return OnsSourceMetadata(
        dataset_page_url=dataset_page_url,
        source_file_url=first_xlsx_link(parser.links, dataset_page_url),
        release_date=extract_date_after_label(page_text, "Release date"),
        next_release=extract_date_after_label(page_text, "Next release"),
    )


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8", errors="replace")


def extract_date_after_label(page_text: str, label: str) -> str:
    match = re.search(
        rf"{re.escape(label)}\s*:?\s*(\d{{1,2}}\s+[A-Za-z]+\s+\d{{4}})",
        page_text,
    )
    if not match:
        raise IngestError(f"could not find ONS {label.lower()} on dataset page")
    return ons_text_date_to_iso(match.group(1))


def first_xlsx_link(links: List[tuple[str, str]], dataset_page_url: str) -> str:
    for href, text in links:
        candidate = href.lower()
        label = text.lower()
        if ".xlsx" in candidate or ".xlsx" in label or "xlsx" in label:
            return urljoin(dataset_page_url, href)
    raise IngestError("could not find an ONS XLSX download link on dataset page")


def ons_text_date_to_iso(value: str) -> str:
    try:
        return datetime.strptime(value.strip(), "%d %B %Y").date().isoformat()
    except ValueError as error:
        raise IngestError(f"invalid ONS date: {value}") from error


def validate_iso_date(value: str, label: str) -> None:
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError as error:
        raise IngestError(f"{label} must use YYYY-MM-DD: {value}") from error


def normalise_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def resolve_source(input_path: Optional[Path], source_url: str) -> tuple[Path, bool]:
    if input_path:
        if not input_path.exists():
            raise IngestError(f"input file does not exist: {input_path}")
        return input_path, False

    request = urllib.request.Request(
        source_url,
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()

    temporary = tempfile.NamedTemporaryFile(
        prefix="rent-evidence-helper-ons-pipr-", suffix=".xlsx", delete=False
    )
    try:
        temporary.write(data)
        temporary.flush()
    finally:
        temporary.close()
    return Path(temporary.name), True


def build_artifact(
    source_path: Path,
    source_sha256: str,
    source_metadata: OnsSourceMetadata,
    source_file_url: Optional[str],
    existing_artifact: Optional[Dict[str, object]] = None,
) -> Dict[str, object]:
    with zipfile.ZipFile(source_path) as workbook:
        shared_strings = read_shared_strings(workbook)
        sheet_path = resolve_sheet_path(workbook, TABLE_SHEET_NAME)
        rows = list(read_rows(workbook, sheet_path, shared_strings))

    headers = find_header_row(rows)
    column_indexes = map_required_columns(headers)
    data_rows = rows[headers["_row_index"] + 1 :]
    latest_period = find_latest_period(data_rows, column_indexes)
    benchmarks = build_benchmarks(data_rows, column_indexes, latest_period)
    validate_benchmarks(benchmarks, latest_period)

    artifact: Dict[str, object] = {
        "schemaVersion": SCHEMA_VERSION,
        "evidenceKind": EVIDENCE_KIND,
        "sourceName": SOURCE_NAME,
        "sourceUrl": source_metadata.dataset_page_url,
        "releaseDate": source_metadata.release_date,
        "nextRelease": source_metadata.next_release,
        "period": latest_period,
        "lastIngestedAt": current_ingest_timestamp(
            existing_artifact=existing_artifact,
            source_sha256=source_sha256,
            release_date=source_metadata.release_date,
            next_release=source_metadata.next_release,
            period=latest_period,
            source_file_url=source_file_url,
        ),
        "sourceSha256": source_sha256,
        "benchmarks": benchmarks,
    }
    if source_file_url:
        artifact["sourceFileUrl"] = source_file_url
    return artifact


def read_existing_artifact(path: Path) -> Optional[Dict[str, object]]:
    if not path.exists():
        return None
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def current_ingest_timestamp(
    existing_artifact: Optional[Dict[str, object]],
    source_sha256: str,
    release_date: str,
    next_release: str,
    period: str,
    source_file_url: Optional[str],
) -> str:
    if (
        existing_artifact
        and existing_artifact.get("sourceSha256") == source_sha256
        and existing_artifact.get("releaseDate") == release_date
        and existing_artifact.get("nextRelease") == next_release
        and existing_artifact.get("period") == period
        and existing_artifact.get("sourceFileUrl") == source_file_url
        and isinstance(existing_artifact.get("lastIngestedAt"), str)
    ):
        return str(existing_artifact["lastIngestedAt"])

    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def write_json_if_changed(path: Path, artifact: Dict[str, object]) -> bool:
    content = json.dumps(artifact, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return False
    path.write_text(content, encoding="utf-8")
    return True


def update_changelog(path: Path, artifact: Dict[str, object]) -> None:
    if not path.exists():
        raise IngestError(f"changelog not found: {path}")
    content = path.read_text(encoding="utf-8")
    release_date = str(artifact["releaseDate"])
    period = str(artifact["period"])
    entry_date = datetime.now(timezone.utc).date().isoformat()
    bullet = (
        f"- {entry_date}: Refreshed ONS benchmark data to the {release_date} "
        f"ONS PIPR edition (period {period})."
    )
    if bullet in content or f"ONS PIPR edition (period {period})" in content:
        return

    section_heading = "## Data updates"
    if section_heading in content:
        content = content.replace(section_heading, f"{section_heading}\n\n{bullet}", 1)
    else:
        content = content.replace(
            "This project uses semantic versioning for public app updates.\n",
            "This project uses semantic versioning for public app updates.\n\n"
            f"{section_heading}\n\n{bullet}\n",
            1,
        )
    path.write_text(content, encoding="utf-8")


def update_sitemap_lastmod(path: Path, lastmod: str) -> None:
    if not path.exists():
        raise IngestError(f"sitemap not found: {path}")
    validate_iso_date(lastmod, "sitemap lastmod")
    content = path.read_text(encoding="utf-8")
    updated = re.sub(r"<lastmod>\d{4}-\d{2}-\d{2}</lastmod>", f"<lastmod>{lastmod}</lastmod>", content)
    if updated == content:
        raise IngestError("sitemap lastmod element not found")
    path.write_text(updated, encoding="utf-8")


def read_shared_strings(workbook: zipfile.ZipFile) -> List[str]:
    if "xl/sharedStrings.xml" not in workbook.namelist():
        return []

    root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
    strings: List[str] = []
    for item in root.findall("main:si", XML_NS):
        strings.append("".join(text.text or "" for text in item.iterfind(".//main:t", XML_NS)))
    return strings


def resolve_sheet_path(workbook: zipfile.ZipFile, sheet_name: str) -> str:
    workbook_root = ET.fromstring(workbook.read("xl/workbook.xml"))
    relationships_root = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
    relationships = {
        item.attrib["Id"]: item.attrib["Target"]
        for item in relationships_root.findall("rel:Relationship", XML_NS)
    }

    for sheet in workbook_root.findall(".//main:sheet", XML_NS):
        if sheet.attrib.get("name") != sheet_name:
            continue
        relationship_id = sheet.attrib.get(f"{{{XML_NS['officeRel']}}}id")
        target = relationships.get(relationship_id or "")
        if not target:
            break
        return "xl/" + target.lstrip("/")

    raise IngestError(f"worksheet not found: {sheet_name}")


def read_rows(
    workbook: zipfile.ZipFile, sheet_path: str, shared_strings: List[str]
) -> Iterable[Dict[str, object]]:
    with workbook.open(sheet_path) as sheet_file:
        for _event, element in ET.iterparse(sheet_file, events=("end",)):
            if element.tag != f"{{{XML_NS['main']}}}row":
                continue
            row: Dict[str, object] = {"_row_index": int(element.attrib.get("r", "0")) - 1}
            for cell in element.findall("main:c", XML_NS):
                cell_ref = cell.attrib.get("r", "")
                column = column_name(cell_ref)
                value = read_cell_value(cell, shared_strings)
                if value != "":
                    row[column] = value
            element.clear()
            yield row


def read_cell_value(cell: ET.Element, shared_strings: List[str]) -> object:
    value = cell.find("main:v", XML_NS)
    if value is None or value.text is None:
        return ""
    raw_value = value.text
    if cell.attrib.get("t") == "s":
        try:
            return shared_strings[int(raw_value)]
        except (IndexError, ValueError) as error:
            raise IngestError(f"invalid shared string index: {raw_value}") from error
    return raw_value


def column_name(cell_ref: str) -> str:
    match = re.match(r"([A-Z]+)", cell_ref)
    if not match:
        raise IngestError(f"invalid cell reference: {cell_ref}")
    return match.group(1)


def find_header_row(rows: List[Dict[str, object]]) -> Dict[str, object]:
    for row in rows:
        values = {value for value in row.values() if isinstance(value, str)}
        if {"Time period", "Area code", "Area name"}.issubset(values):
            return row
    raise IngestError("header row not found in Table 1")


def map_required_columns(header_row: Dict[str, object]) -> Dict[str, str]:
    indexes: Dict[str, str] = {}
    for column, label in header_row.items():
        if not isinstance(label, str):
            continue
        if label in REQUIRED_COLUMNS:
            indexes[REQUIRED_COLUMNS[label]] = column

    missing = sorted(set(REQUIRED_COLUMNS.values()) - set(indexes.keys()))
    if missing:
        raise IngestError(f"required columns missing: {', '.join(missing)}")
    return indexes


def find_latest_period(
    rows: List[Dict[str, object]], column_indexes: Dict[str, str]
) -> str:
    periods = [
        excel_serial_to_iso(row[column_indexes["period"]])
        for row in rows
        if column_indexes["period"] in row
    ]
    if not periods:
        raise IngestError("no period values found")
    return max(periods)


def build_benchmarks(
    rows: List[Dict[str, object]], column_indexes: Dict[str, str], latest_period: str
) -> List[Dict[str, object]]:
    benchmarks: List[Dict[str, object]] = []
    for row in rows:
        if column_indexes["period"] not in row:
            continue
        period = excel_serial_to_iso(row[column_indexes["period"]])
        area_code = str(row.get(column_indexes["areaCode"], ""))
        if period != latest_period or not area_code.startswith(ENGLAND_LOCAL_AUTHORITY_PREFIXES):
            continue

        benchmarks.append(
            {
                "areaCode": area_code,
                "areaName": required_text(row, column_indexes, "areaName"),
                "period": period,
                "regionOrCountryName": required_text(
                    row, column_indexes, "regionOrCountryName"
                ),
                "monthlyRentAll": required_int(row, column_indexes, "monthlyRentAll"),
                "monthlyRentFlatMaisonette": required_int(
                    row, column_indexes, "monthlyRentFlatMaisonette"
                ),
                "monthlyRentFourOrMoreBed": required_int(
                    row, column_indexes, "monthlyRentFourOrMoreBed"
                ),
                "monthlyRentOneBed": required_int(
                    row, column_indexes, "monthlyRentOneBed"
                ),
                "monthlyRentThreeBed": required_int(
                    row, column_indexes, "monthlyRentThreeBed"
                ),
                "monthlyRentTwoBed": required_int(
                    row, column_indexes, "monthlyRentTwoBed"
                ),
            }
        )

    return sorted(benchmarks, key=lambda item: (str(item["areaName"]), str(item["areaCode"])))


def validate_benchmarks(benchmarks: List[Dict[str, object]], latest_period: str) -> None:
    if len(benchmarks) < MIN_ENGLAND_LOCAL_AUTHORITIES:
        raise IngestError(
            "too few England Local Authority rows exported: "
            f"{len(benchmarks)} for {latest_period}"
        )

    found_areas = {str(item["areaName"]) for item in benchmarks}
    missing_samples = sorted(SAMPLE_AREAS - found_areas)
    if missing_samples:
        raise IngestError(f"sample areas missing: {', '.join(missing_samples)}")

    for item in benchmarks:
        for key, value in item.items():
            if key.startswith("monthlyRent") and (not isinstance(value, int) or value <= 0):
                raise IngestError(
                    f"invalid benchmark rent for {item['areaName']} {key}: {value}"
                )


def required_text(
    row: Dict[str, object], column_indexes: Dict[str, str], key: str
) -> str:
    value = str(row.get(column_indexes[key], "")).strip()
    if not value:
        raise IngestError(f"missing text value for {key}")
    return value


def required_int(
    row: Dict[str, object], column_indexes: Dict[str, str], key: str
) -> int:
    raw_value = row.get(column_indexes[key])
    try:
        value = float(str(raw_value))
    except (TypeError, ValueError) as error:
        raise IngestError(f"non-numeric value for {key}: {raw_value}") from error

    if not value > 0:
        raise IngestError(f"non-positive value for {key}: {raw_value}")
    return int(round(value))


def excel_serial_to_iso(value: object) -> str:
    if isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return value
    try:
        serial = int(float(str(value)))
    except (TypeError, ValueError) as error:
        raise IngestError(f"invalid Excel date serial: {value}") from error
    return (datetime(1899, 12, 30) + timedelta(days=serial)).date().isoformat()


if __name__ == "__main__":
    raise SystemExit(main())
