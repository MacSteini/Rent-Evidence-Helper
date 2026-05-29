export type LegalContentItem = {
  id: string;
  title: string;
  body: string;
  sourceUrls: string[];
  sourceTitles?: string[];
  lastCheckedAt: string;
  jurisdiction: "england";
  status: "active" | "needs-review" | "deprecated";
};
