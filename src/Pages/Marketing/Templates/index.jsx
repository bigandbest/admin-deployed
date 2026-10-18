import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";

import { listTemplates, saveTemplate, resetTemplate } from "../../../utils/adminNotificationTemplateApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Input } from "../../../Components/UI/input";
import { Label } from "../../../Components/UI/label";
import { Textarea } from "../../../Components/UI/textarea";
import { Badge } from "../../../Components/UI/badge";
import { Skeleton } from "../../../Components/UI/skeleton";
import {
  PageHeader, ConfirmDialog, ErrorState, EmptyState, useUnsavedChangesWarning, notifySuccess, notifyError,
} from "../../../Components/Growth";

const humanize = (s = "") => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// Substitute {{variables}} with readable sample values so admins can see the final copy.
const preview = (text, vars) =>
  (text || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, name) => (vars.includes(name) ? `‹${name}›` : `{{${name}}}`));

export default function NotificationTemplates() {
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState({}); // type -> { title_template, message_template } (only touched templates)
  const [errors, setErrors] = useState({});
  const [savingType, setSavingType] = useState(null);
  const [resetting, setResetting] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["marketing", "templates"], queryFn: () => listTemplates() });
  const templates = useMemo(() => data?.data || [], [data]);

  const valueOf = (t) => edits[t.notification_type] || { title_template: t.title_template, message_template: t.message_template };
  const isDirty = (t) => {
    const e = edits[t.notification_type];
    return !!e && (e.title_template !== t.title_template || e.message_template !== t.message_template);
  };
  const anyDirty = templates.some(isDirty);
  useUnsavedChangesWarning(anyDirty);

  const setField = (t, field, value) =>
    setEdits((d) => ({ ...d, [t.notification_type]: { ...valueOf(t), [field]: value } }));
  const clearEdit = (type) => setEdits((d) => { const n = { ...d }; delete n[type]; return n; });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["marketing", "templates"] });

  const save = useMutation({
    mutationFn: ({ type, payload }) => saveTemplate(type, payload),
    onMutate: ({ type }) => { setSavingType(type); setErrors((e) => ({ ...e, [type]: "" })); },
    onSuccess: (_r, { type }) => { notifySuccess(`${humanize(type)} template saved.`); clearEdit(type); invalidate(); },
    onError: (e, { type }) => setErrors((prev) => ({ ...prev, [type]: e.message })),
    onSettled: () => setSavingType(null),
  });

  const reset = useMutation({
    mutationFn: (type) => resetTemplate(type),
    onSuccess: (_r, type) => { notifySuccess(`${humanize(type)} template reset to default.`); clearEdit(type); setResetting(null); invalidate(); },
    onError: (e) => { notifyError(e.message); setResetting(null); },
  });

  const header = <PageHeader title="Notification templates" description="Edit the copy of in-app notifications. Only the variables listed for each template can be used." />;

  if (isError) return <div>{header}<ErrorState title="Unable to load templates" onRetry={refetch} /></div>;

  return (
    <div>
      {header}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-none">
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-40" /><Skeleton className="h-9 w-full" /><Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : templates.length === 0 ? (
          <Card className="col-span-full shadow-none"><EmptyState title="No templates" description="Notification templates will appear here." /></Card>
        ) : (
          templates.map((t) => {
            const type = t.notification_type;
            const val = valueOf(t);
            const dirty = isDirty(t);
            const busy = savingType === type;
            const vars = t.supported_variables || [];
            return (
              <Card key={type} className="shadow-none">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">{humanize(type)}</CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap items-center gap-1">
                        {vars.length > 0 ? (
                          <>
                            Variables:
                            {vars.map((v) => <code key={v} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{`{{${v}}}`}</code>)}
                          </>
                        ) : "No variables for this template."}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {dirty && <span className="text-xs text-amber-700 dark:text-amber-400">Unsaved</span>}
                      <Badge variant={t.is_customized ? "secondary" : "outline"}>{t.is_customized ? "Customized" : "Default"}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {errors[type] && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{errors[type]}</div>}
                  <div className="space-y-1.5">
                    <Label htmlFor={`${type}-title`}>Title</Label>
                    <Input id={`${type}-title`} value={val.title_template} onChange={(e) => setField(t, "title_template", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${type}-msg`}>Message</Label>
                    <Textarea id={`${type}-msg`} rows={2} value={val.message_template} onChange={(e) => setField(t, "message_template", e.target.value)} />
                  </div>
                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Preview</p>
                    <p className="mt-1 text-sm font-medium">{preview(val.title_template, vars) || "—"}</p>
                    <p className="text-sm text-muted-foreground">{preview(val.message_template, vars) || "—"}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    {t.is_customized && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => setResetting(t)}>
                        <RotateCcw className="size-3.5" /> Reset to default
                      </Button>
                    )}
                    {dirty && <Button variant="ghost" size="sm" disabled={busy} onClick={() => clearEdit(type)}>Discard</Button>}
                    <Button size="sm" disabled={!dirty || busy} onClick={() => save.mutate({ type, payload: val })}>{busy ? "Saving..." : "Save"}</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!resetting}
        onClose={() => setResetting(null)}
        title="Reset to default copy"
        description="Your customised title and message are discarded and the built-in wording is used."
        details={resetting && [{ label: "Template", value: humanize(resetting.notification_type) }]}
        confirmLabel="Reset template"
        destructive
        isLoading={reset.isPending}
        onConfirm={() => reset.mutate(resetting.notification_type)}
      />
    </div>
  );
}
