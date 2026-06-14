import type { LegalContentItem } from "../types/legalContent";

export const legalContent: LegalContentItem[] = [
  {
    id: "general-disclaimer",
    title: "General information, not legal advice",
    body:
      "This tool is intended for rental properties in England. It gives an official area-benchmark indication, optional live asking-rent context and local message templates, not legal advice, and it does not decide the legal market rent. A tribunal or court may take a different view.",
    sourceUrls: [
      "https://www.gov.uk/government/publications/the-renters-rights-act-information-sheet-2026",
      "https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases"
    ],
    sourceTitles: [
      "Renters’ Rights Act information sheet",
      "Assured periodic tenancies: rent increases"
    ],
    lastCheckedAt: "2026-06-14",
    jurisdiction: "england",
    status: "active"
  },
  {
    id: "first-tier-tribunal",
    title: "First-tier Tribunal guidance",
    body:
      "Official guidance explains that tenants may be able to ask the First-tier Tribunal to determine open market rent where the statutory process applies. Use the official open market rent determination guidance to check eligibility, evidence, forms, fees and timing before you act.",
    sourceUrls: [
      "https://www.gov.uk/guidance/apply-for-an-open-market-rent-determination",
      "https://www.gov.uk/guidance/assured-tenancy-forms"
    ],
    sourceTitles: [
      "Apply for an open market rent determination",
      "Assured tenancy forms"
    ],
    lastCheckedAt: "2026-06-14",
    jurisdiction: "england",
    status: "active"
  },
  {
    id: "form-4a-section-13",
    title: "Form 4A and section 13",
    body:
      "Where the statutory rent-increase process applies, GOV.UK says landlords must follow the correct rules and use Form 4A for the section 13 process. Use the official assured tenancy forms page to find current prescribed forms.",
    sourceUrls: [
      "https://www.gov.uk/guidance/assured-tenancy-forms",
      "https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases"
    ],
    sourceTitles: [
      "Assured tenancy forms",
      "Assured periodic tenancies: rent increases"
    ],
    lastCheckedAt: "2026-06-14",
    jurisdiction: "england",
    status: "active"
  },
  {
    id: "evidence-notice",
    title: "Evidence notice",
    body:
      "Use this result as a market-evidence check only. Compare it with evidence you collect and check official guidance before acting or sending any formal challenge. It is not legal advice and does not decide the legal market rent.",
    sourceUrls: [],
    lastCheckedAt: "2026-06-14",
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
