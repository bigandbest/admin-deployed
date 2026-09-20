import PropTypes from "prop-types";
import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "../UI/button";

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Inbox className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = "Unable to load data", description = "Please try again.", onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
        <AlertTriangle className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

EmptyState.propTypes = { title: PropTypes.string.isRequired, description: PropTypes.node, action: PropTypes.node };
ErrorState.propTypes = { title: PropTypes.string, description: PropTypes.node, onRetry: PropTypes.func };
