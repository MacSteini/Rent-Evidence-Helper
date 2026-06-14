import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import ingest_ons_pipr as ingest
import check_source_freshness as freshness


DATASET_URL = "https://www.ons.gov.uk/example/dataset"


class IngestOnsPiprTests(unittest.TestCase):
    def test_ons_refresh_workflow_has_required_permissions_and_deploy_path(self) -> None:
        workflow = (
            Path(__file__).resolve().parents[1]
            / ".github/workflows/ons-data-refresh.yml"
        ).read_text(encoding="utf-8")

        self.assertIn("contents: write", workflow)
        self.assertIn("pages: write", workflow)
        self.assertIn("id-token: write", workflow)
        self.assertIn("git push origin HEAD:${{ github.ref_name }}", workflow)
        self.assertIn("actions/configure-pages@v5", workflow)
        self.assertIn("actions/upload-pages-artifact@v3", workflow)
        self.assertIn("actions/deploy-pages@v4", workflow)

    def test_ons_refresh_workflow_limits_automated_file_scope(self) -> None:
        workflow = (
            Path(__file__).resolve().parents[1]
            / ".github/workflows/ons-data-refresh.yml"
        ).read_text(encoding="utf-8")

        self.assertIn("Enforce allowed data-refresh diff scope", workflow)
        self.assertIn("CHANGELOG.md|public/sitemap.xml|src/data/official-rent-benchmarks.json", workflow)
        self.assertIn("Unexpected data-refresh files changed", workflow)

    def test_parse_dataset_page_discovers_current_source_metadata(self) -> None:
        html = """
        <html>
          <body>
            <p>Release date: 20 May 2026</p>
            <p>Next release: 17 June 2026</p>
            <a href="/file?uri=/economy/data/22april2026/old.xlsx">xlsx</a>
            <a href="/file?uri=/economy/data/current.xlsx">Download xlsx</a>
            <a href="/file?uri=/economy/data/20may2026/current.xlsx">Download xlsx</a>
          </body>
        </html>
        """

        metadata = ingest.parse_dataset_page(html, DATASET_URL)

        self.assertEqual(metadata.release_date, "2026-05-20")
        self.assertEqual(metadata.next_release, "2026-06-17")
        self.assertEqual(
            metadata.source_file_url,
            "https://www.ons.gov.uk/file?uri=/economy/data/20may2026/current.xlsx",
        )

    def test_parse_dataset_page_fails_when_required_metadata_is_missing(self) -> None:
        with self.assertRaises(ingest.IngestError):
            ingest.parse_dataset_page("<html><body>No useful metadata</body></html>")

    def test_parse_dataset_page_fails_without_matching_release_xlsx(self) -> None:
        html = """
        <html>
          <body>
            <p>Release date: 20 May 2026</p>
            <p>Next release: 17 June 2026</p>
            <a href="/file?uri=/economy/data/22april2026/old.xlsx">xlsx</a>
          </body>
        </html>
        """

        with self.assertRaises(ingest.IngestError):
            ingest.parse_dataset_page(html, DATASET_URL)

    def test_source_url_override_must_match_current_release(self) -> None:
        with self.assertRaises(ingest.IngestError):
            ingest.assert_source_url_matches_release(
                "https://www.ons.gov.uk/file?uri=/dataset/22april2026/source.xlsx",
                "2026-05-20",
            )

    def test_source_url_release_match_requires_slug_boundary(self) -> None:
        with self.assertRaises(ingest.IngestError):
            ingest.assert_source_url_matches_release(
                "https://www.ons.gov.uk/file?uri=/dataset/12june2026/source.xlsx",
                "2026-06-02",
            )

        ingest.assert_source_url_matches_release(
            "https://www.ons.gov.uk/file?uri=/dataset/2june2026/source.xlsx",
            "2026-06-02",
        )

    def test_release_date_slug_uses_english_month_names(self) -> None:
        self.assertEqual(ingest.release_date_to_ons_slug("2026-03-03"), "3march2026")

    def test_write_json_if_changed_avoids_unnecessary_diff(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "artifact.json"
            artifact = {"a": 1, "b": ["c"]}

            self.assertTrue(ingest.write_json_if_changed(output, artifact))
            first_content = output.read_text(encoding="utf-8")
            self.assertFalse(ingest.write_json_if_changed(output, artifact))
            self.assertEqual(output.read_text(encoding="utf-8"), first_content)

    def test_current_ingest_timestamp_preserves_existing_timestamp_for_same_source(self) -> None:
        existing = {
            "sourceSha256": "abc",
            "releaseDate": "2026-05-20",
            "nextRelease": "2026-06-17",
            "period": "2026-04-01",
            "sourceFileUrl": "https://example.test/current.xlsx",
            "lastIngestedAt": "2026-05-29T19:38:51Z",
        }

        self.assertEqual(
            ingest.current_ingest_timestamp(
                existing_artifact=existing,
                source_sha256="abc",
                release_date="2026-05-20",
                next_release="2026-06-17",
                period="2026-04-01",
                source_file_url="https://example.test/current.xlsx",
            ),
            "2026-05-29T19:38:51Z",
        )

    def test_metadata_updates_add_data_update_and_sitemap_lastmod(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            changelog = root / "CHANGELOG.md"
            sitemap = root / "sitemap.xml"
            changelog.write_text(
                "# Changelog\n\n"
                "This project uses semantic versioning for public app updates.\n\n"
                "## [1.0.1] – 2026-06-02\n",
                encoding="utf-8",
            )
            sitemap.write_text(
                "<urlset><url><lastmod>2026-06-01</lastmod></url></urlset>",
                encoding="utf-8",
            )

            ingest.update_changelog(
                changelog,
                {
                    "releaseDate": "2026-06-17",
                    "period": "2026-05-01",
                },
            )
            ingest.update_sitemap_lastmod(sitemap, "2026-06-18")

            self.assertIn("## Data updates", changelog.read_text(encoding="utf-8"))
            self.assertIn("ONS PIPR edition (period 2026-05-01)", changelog.read_text(encoding="utf-8"))
            self.assertIn("<lastmod>2026-06-18</lastmod>", sitemap.read_text(encoding="utf-8"))

    def test_changelog_update_fails_when_insert_anchor_is_missing(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            changelog = Path(directory) / "CHANGELOG.md"
            changelog.write_text("# Changelog\n", encoding="utf-8")

            with self.assertRaises(ingest.IngestError):
                ingest.update_changelog(
                    changelog,
                    {
                        "releaseDate": "2026-06-17",
                        "period": "2026-05-01",
                    },
                )

    def test_source_freshness_report_contains_ons_metadata(self) -> None:
        report = freshness.render_report(
            "2026-06-14T12:00:00+00:00",
            [
                {
                    "label": "ONS PIPR monthly price statistics",
                    "url": DATASET_URL,
                    "status": "ok",
                    "detail": (
                        "release 2026-05-20; next 2026-06-17; "
                        "xlsx https://www.ons.gov.uk/file?uri=/current.xlsx"
                    ),
                }
            ],
        )

        self.assertIn("release 2026-05-20", report)
        self.assertIn("next 2026-06-17", report)
        self.assertIn("xlsx https://www.ons.gov.uk/file?uri=/current.xlsx", report)


if __name__ == "__main__":
    unittest.main()
