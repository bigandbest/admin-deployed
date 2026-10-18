import { useEffect, useState } from "react";
import useUnsavedChangesWarning from "./useUnsavedChangesWarning";

// Editable draft of a server config: tracks dirty state, supports discard, and warns on tab close.
// Re-syncs the draft whenever the server copy changes (initial load, or after a successful save).
export default function useConfigDraft(serverConfig) {
  const [draft, setDraft] = useState(null);
  useEffect(() => { if (serverConfig) setDraft(serverConfig); }, [serverConfig]);

  const dirty = !!draft && !!serverConfig && JSON.stringify(draft) !== JSON.stringify(serverConfig);
  useUnsavedChangesWarning(dirty);

  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const discard = () => setDraft(serverConfig);
  return { draft, set, setDraft, dirty, discard };
}
