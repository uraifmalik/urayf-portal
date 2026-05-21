/**
 * Embeds /public/report-sample.html — a fully branded urayf daily
 * report — inside the framed sample slot on the homepage. Iframe so
 * the report's own styling renders untouched; loading="lazy" so it
 * doesn't fetch until the user scrolls near the section.
 */
export default function ReportSample() {
  return (
    <iframe
      src="/report-sample.html"
      title="urayf sample daily report"
      loading="lazy"
      scrolling="no"
      className="home-sample home-sample--iframe"
    />
  );
}
