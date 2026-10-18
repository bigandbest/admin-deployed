import { useEffect, useState } from "react";

// Debounce a fast-changing value (e.g. a search box) so queries fire once typing pauses.
export default function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
