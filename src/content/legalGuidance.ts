import type { LegalContentItem } from "../types/legalContent";

export const legalContent: LegalContentItem[] = [
  {
    id: "general-disclaimer",
    title: "General information, not legal advice",
    body:
      "This tool gives general information based on available rental evidence. It is not legal advice and it does not decide the legal market rent. A tribunal or court may take a different view.",
    sourceUrls: [
      "https://www.gov.uk/guidance/renters-rights-act-overview-for-tenants",
      "https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases"
    ],
    sourceTitles: [
      "Renters' Rights Act overview for tenants",
      "Assured periodic tenancies: rent increases"
    ],
    lastCheckedAt: "2026-05-29",
    jurisdiction: "england",
    status: "active"
  },
  {
    id: "first-tier-tribunal",
    title: "First-tier Tribunal guidance",
    body:
      "Official guidance explains that tenants may be able to ask the First-tier Tribunal to determine open market rent where the statutory process applies. Deadlines matter, so check the latest GOV.UK guidance and consider independent housing advice.",
    sourceUrls: [
      "https://www.gov.uk/guidance/apply-for-a-market-rent-determination",
      "https://www.gov.uk/guidance/assured-tenancy-forms"
    ],
    sourceTitles: [
      "Apply for a market rent determination",
      "Assured tenancy forms"
    ],
    lastCheckedAt: "2026-05-29",
    jurisdiction: "england",
    status: "active"
  },
  {
    id: "form-4a-section-13",
    title: "Form 4A and section 13",
    body:
      "Where the statutory rent-increase process applies, official guidance says landlords should use the correct notice process. Check whether the notice says Form 4A or section 13 and keep a copy before deciding what to do next.",
    sourceUrls: [
      "https://www.gov.uk/guidance/assured-tenancy-forms",
      "https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases"
    ],
    sourceTitles: [
      "Assured tenancy forms",
      "Assured periodic tenancies: rent increases"
    ],
    lastCheckedAt: "2026-05-29",
    jurisdiction: "england",
    status: "active"
  },
  {
    id: "fixture-data",
    title: "Fixture data notice",
    body:
      "This prototype is using sample data, not live rental listings. The result shows how the tool works and should not be used as evidence.",
    sourceUrls: [],
    lastCheckedAt: "2026-05-29",
    jurisdiction: "england",
    status: "active"
  }
];

export function getLegalContent(id: string): LegalContentItem {
  const item = legalContent.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Missing legal content item: ${id}`);
  }
  return item;
}
