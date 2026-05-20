import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import "./reports.css";

/* Loading state for the reports list — mirrors the real layout
   exactly (page heading + three sections, each a header + ledger
   rows) so nothing jumps when the data arrives (Part 11). */

const SECTION_COUNT = 3;
const ROWS_PER_SECTION = 3;

export default function ReportsLoading() {
  return (
    <div className="reports">
      <Skeleton width="180px" height="42px" style={{ margin: "0 auto" }} />

      {Array.from({ length: SECTION_COUNT }).map((_, s) => (
        <Card key={s} style={{ padding: 0 }}>
          <div className="reports__section-head">
            <Skeleton
              width="200px"
              height="26px"
              style={{ margin: "0 auto" }}
            />
          </div>
          {Array.from({ length: ROWS_PER_SECTION }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-4)",
                borderTop: i
                  ? "1px solid var(--color-line-soft)"
                  : undefined,
              }}
            >
              <Skeleton
                width="52px"
                height="22px"
                radius="var(--radius-sm)"
              />
              <Skeleton height="16px" style={{ flex: 1 }} />
              <Skeleton width="72px" height="16px" />
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
