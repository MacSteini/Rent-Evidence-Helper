import type { LegalContentItem } from "../types/legalContent";

type DisclaimerProps = {
  item: LegalContentItem;
  compact?: boolean;
};

export function Disclaimer({ item, compact = false }: DisclaimerProps) {
  return (
    <aside className={compact ? "notice notice-compact" : "notice"} aria-label={item.title}>
      <strong>{item.title}</strong>
      <p>{item.body}</p>
    </aside>
  );
}
