import PropTypes from "prop-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../UI/dialog";
import { Button } from "../UI/button";
import DetailList from "./DetailList";

// Confirmation with context: say what will happen, show the record's key values, and label the
// confirm button with the action. `destructive` styles it as a consequence, not a primary CTA.
export default function ConfirmDialog({
  open, onClose, title, description, details, confirmLabel, destructive = false, isLoading = false, onConfirm, children,
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {details && <DetailList rows={details} className="rounded-md border bg-muted/30 p-3" />}
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  details: PropTypes.array,
  confirmLabel: PropTypes.string.isRequired,
  destructive: PropTypes.bool,
  isLoading: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  children: PropTypes.node,
};
