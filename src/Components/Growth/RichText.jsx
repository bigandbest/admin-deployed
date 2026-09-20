import { useMemo } from "react";
import PropTypes from "prop-types";
import DOMPurify from "dompurify";
import { cn } from "../../lib/utils";

// Renders stored HTML (product descriptions, FAQ answers) safely: sanitised first, then styled
// with plain utility classes so lists, links and emphasis look right without a typography plugin.
export default function RichText({ html, className }) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html || "", { USE_PROFILES: { html: true }, ADD_ATTR: ["target"] }),
    [html]
  );
  if (!clean.trim()) return null;
  return (
    <div
      className={cn(
        "text-sm leading-relaxed text-foreground/90 break-words",
        "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded",
        className
      )}
      // eslint-disable-next-line react/no-danger -- sanitised with DOMPurify above
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

RichText.propTypes = { html: PropTypes.string, className: PropTypes.string };
