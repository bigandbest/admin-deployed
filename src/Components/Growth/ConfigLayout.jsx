import PropTypes from "prop-types";
import { Card } from "../UI/card";
import { Input } from "../UI/input";
import { Button } from "../UI/button";
import { Label } from "../UI/label";
import { cn } from "../../lib/utils";

// Settings-style building blocks: titled groups of label + help text + control rows.
export function ConfigSection({ title, description, children, className }) {
  return (
    <Card className={cn("gap-0 overflow-hidden p-0 shadow-none", className)}>
      <div className="border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="divide-y">{children}</div>
    </Card>
  );
}

export function ConfigRow({ label, hint, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:max-w-[60%]">
        <Label htmlFor={htmlFor} className="text-sm font-medium">{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function NumberField({ id, value, onChange, min, max, step = 1, className = "w-32" }) {
  return (
    <Input
      id={id}
      type="number"
      value={value ?? ""}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      className={`${className} text-right tabular-nums`}
    />
  );
}

// Save / Discard controls for the page header. Save is disabled until something changed.
export function SaveActions({ dirty, isSaving, onSave, onDiscard }) {
  return (
    <>
      {dirty && <span className="text-xs text-amber-700 dark:text-amber-400">Unsaved changes</span>}
      <Button variant="outline" onClick={onDiscard} disabled={!dirty || isSaving}>Discard</Button>
      <Button onClick={onSave} disabled={!dirty || isSaving}>{isSaving ? "Saving..." : "Save changes"}</Button>
    </>
  );
}

ConfigSection.propTypes = { title: PropTypes.string.isRequired, description: PropTypes.node, children: PropTypes.node, className: PropTypes.string };
ConfigRow.propTypes = { label: PropTypes.string.isRequired, hint: PropTypes.node, htmlFor: PropTypes.string, children: PropTypes.node };
NumberField.propTypes = {
  id: PropTypes.string, value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), onChange: PropTypes.func.isRequired,
  min: PropTypes.number, max: PropTypes.number, step: PropTypes.number, className: PropTypes.string,
};
SaveActions.propTypes = { dirty: PropTypes.bool, isSaving: PropTypes.bool, onSave: PropTypes.func.isRequired, onDiscard: PropTypes.func.isRequired };
