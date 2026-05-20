import Link from "next/link";
import { TypePill } from "./Pill";
import "./ledger.css";

export interface LedgerRow {
  id: string;
  /** Destination — the whole row links here. */
  href: string;
  /** Type-pill word, e.g. "Daily". */
  pill: string;
  title: string;
  /** Optional muted sub-line, e.g. a store name. */
  subtitle?: string;
  /** Pre-formatted date string. */
  date: string;
}

export interface LedgerProps {
  rows: LedgerRow[];
  /** Headline shown when there are no rows. */
  emptyTitle?: string;
  /** Muted guidance line below the headline. */
  emptyHint?: string;
}

/* Voice spec (Part 13) — the approved empty-list wording. */
const DEFAULT_EMPTY_TITLE = "No reports yet.";
const DEFAULT_EMPTY_HINT = "The first one will appear here once it's ready.";

/**
 * urayf ledger (Part 10) — reports as a vertical list, chronological,
 * each row a type pill + title + date with the whole row clickable.
 * Empty state is a calm, editorial pair: a Fraunces line + muted
 * guidance (Part 11).
 */
export function Ledger({
  rows,
  emptyTitle = DEFAULT_EMPTY_TITLE,
  emptyHint = DEFAULT_EMPTY_HINT,
}: LedgerProps) {
  if (rows.length === 0) {
    return (
      <div className="ledger__empty">
        <p className="ledger__empty-title">{emptyTitle}</p>
        <p className="ledger__empty-hint">{emptyHint}</p>
      </div>
    );
  }

  return (
    <ul className="ledger__list">
      {rows.map((row) => (
        <li key={row.id}>
          <Link href={row.href} className="ledger__row">
            <TypePill>{row.pill}</TypePill>
            <span className="ledger__row-main">
              <span className="ledger__row-title">{row.title}</span>
              {row.subtitle && (
                <span className="ledger__row-sub">{row.subtitle}</span>
              )}
            </span>
            <span className="ledger__row-date">{row.date}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
