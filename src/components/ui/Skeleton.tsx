import type { CSSProperties } from "react";
import "./skeleton.css";

export interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * A skeleton placeholder block (Part 11). Carries the slow shimmer
 * sweep; size it to mirror the real element it stands in for.
 */
export function Skeleton({
  width,
  height,
  radius,
  className,
  style,
}: SkeletonProps) {
  return (
    <div
      className={["skeleton", className].filter(Boolean).join(" ")}
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
