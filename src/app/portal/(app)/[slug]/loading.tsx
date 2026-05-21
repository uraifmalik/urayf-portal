import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import "./store.css";

const SECTION_COUNT = 3;
const ROWS_PER_SECTION = 3;

export default function StoreReportsLoading() {
  return (
    <div className="store-reports">
      <Skeleton width="280px" height="42px" style={{ margin: "0 auto" }} />

      {Array.from({ length: SECTION_COUNT }).map((_, s) => (
        <Card key={s} style={{ padding: 0 }}>
          <div className="store-reports__section-head">
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
              <Skeleton height="16px" style={{ flex: 1 }} />
              <Skeleton width="72px" height="16px" />
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
