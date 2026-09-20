import PropTypes from "prop-types";
import { ImageIcon } from "lucide-react";

export default function TaxonomyThumb({ src, name, size = "size-10" }) {
  return src ? (
    <img src={src} alt={name} loading="lazy" className={`${size} shrink-0 rounded-md border object-cover`} />
  ) : (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground`} aria-hidden="true">
      <ImageIcon className="size-4" />
    </div>
  );
}

TaxonomyThumb.propTypes = { src: PropTypes.string, name: PropTypes.string, size: PropTypes.string };
