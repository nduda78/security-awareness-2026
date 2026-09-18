"use client";

/**
 * "Save to PDF" for the Rules page - deliberately just the browser's own
 * native print pipeline (window.print(), with "Save as PDF" as the print
 * destination) rather than a client-side raster export (html-to-image,
 * as used for badges) or a server-rendered PDF library. Rules is a
 * multi-page text document, not a single fixed-size card - the browser's
 * print engine already handles real pagination, selectable/searchable
 * text, and correct page breaks for free, which a canvas screenshot
 * can't. A dedicated @media print stylesheet (see globals.css) re-themes
 * the page to a clean light/dark-text printable look and hides all site
 * chrome (nav, footer, this button itself) for the actual export.
 */
export function DownloadRulesPdfButton() {
  return (
    <button onClick={() => window.print()} className="btn-secondary print:hidden">
      Save as PDF
    </button>
  );
}
