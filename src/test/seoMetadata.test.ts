import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import robots from "../../public/robots.txt?raw";
import sitemap from "../../public/sitemap.xml?raw";

describe("public SEO metadata", () => {
  it("describes the benchmark and dispute-support product focus", () => {
    expect(html).toContain(
      "<title>Rent Evidence Helper | England rent benchmark and dispute support</title>"
    );
    expect(html).toContain('<meta property="og:title" content="Rent Evidence Helper" />');
    expect(html).toContain("editable dispute-support message templates");
    expect(html).toContain("calm rent-increase response in England");
    expect(html).toContain(
      '<meta property="og:url" content="https://steini.github.io/uk-rent-checker/" />'
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://steini.github.io/uk-rent-checker/" />'
    );
    expect(html).toContain('<meta name="robots" content="index, follow" />');
  });

  it("keeps sitemap and robots aligned with the planned GitHub Pages URL", () => {
    expect(sitemap).toContain("<loc>https://steini.github.io/uk-rent-checker/</loc>");
    expect(sitemap).toContain("<lastmod>2026-05-31</lastmod>");
    expect(robots).toContain(
      "Sitemap: https://steini.github.io/uk-rent-checker/sitemap.xml"
    );
  });
});
