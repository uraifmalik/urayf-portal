import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import "./dashboard.css";

/* Loading state for the dashboard — skeleton shapes that mirror the
   real layout (heading, four stat cards, the Latest reports panel)
   so nothing jumps when the data arrives (Part 11). */
export default function DashboardLoading() {
  return (
    <div className="dash">
      <Skeleton width="220px" height="42px" style={{ margin: "0 auto" }} />

      <div className="dash__stats">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="stat">
            <Skeleton width="90px" height="10px" style={{ margin: "0 auto" }} />
            <Skeleton
              width="64px"
              height="40px"
              style={{ margin: "var(--space-2) auto 0" }}
            />
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div className="ledger__head">
          <Skeleton width="120px" height="16px" />
          <Skeleton width="56px" height="16px" />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            padding: "var(--space-4)",
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height="20px" />
          ))}
        </div>
      </Card>
    </div>
  );
}
