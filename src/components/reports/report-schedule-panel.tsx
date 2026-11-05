"use client";

import * as React from "react";
import { toast } from "sonner";
import { Mail, Plus, Trash2, Pause, Play, Send, Loader2, Pencil, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useReportSchedules,
  useCreateReportSchedule,
  useUpdateReportSchedule,
  useToggleReportSchedule,
  useDeleteReportSchedule,
  useSendReportScheduleNow,
  type CreateScheduleInput,
} from "@/hooks/use-report-schedules";
import type { ReportScheduleDTO, ReportScheduleFrequency } from "@/types/report-schedule";
import { trackEvent } from "@/lib/analytics";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const FREQUENCY_LABELS: Record<ReportScheduleFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
};

function describeSchedule(s: { frequency: ReportScheduleFrequency; dayOfWeek: number | null; dayOfMonth: number | null }): string {
  if (s.frequency === "DAILY") return "Every day";
  if (s.frequency === "WEEKLY") return `Every ${WEEKDAYS[s.dayOfWeek ?? 0]}`;
  if (s.frequency === "BIWEEKLY") return `Every other ${WEEKDAYS[s.dayOfWeek ?? 0]}`;
  return `Day ${s.dayOfMonth} of every month`;
}

/** What the add and edit forms hold; the days stay strings while being picked or typed. */
interface ScheduleDraft {
  recipients: string;
  frequency: ReportScheduleFrequency;
  dayOfWeek: string;
  dayOfMonth: string;
}

const NEW_DRAFT: ScheduleDraft = { recipients: "", frequency: "DAILY", dayOfWeek: "1", dayOfMonth: "1" };

function draftOf(s: ReportScheduleDTO): ScheduleDraft {
  return {
    recipients: s.recipients.split(",").join(", "),
    frequency: s.frequency,
    dayOfWeek: String(s.dayOfWeek ?? 1),
    dayOfMonth: String(s.dayOfMonth ?? 1),
  };
}

function toInput(draft: ScheduleDraft): CreateScheduleInput {
  const input: CreateScheduleInput = { recipients: draft.recipients, frequency: draft.frequency };
  if (draft.frequency === "WEEKLY" || draft.frequency === "BIWEEKLY") input.dayOfWeek = Number(draft.dayOfWeek);
  if (draft.frequency === "MONTHLY") input.dayOfMonth = Number(draft.dayOfMonth);
  return input;
}

function ScheduleFields({ draft, onChange }: { draft: ScheduleDraft; onChange: (draft: ScheduleDraft) => void }) {
  const set = (patch: Partial<ScheduleDraft>) => onChange({ ...draft, ...patch });
  return (
    <>
      <div className="min-w-[220px] flex-1 space-y-1.5">
        <Label>Recipient email(s)</Label>
        <Input
          value={draft.recipients}
          onChange={(e) => set({ recipients: e.target.value })}
          placeholder="ops@company.com, manager@company.com"
        />
      </div>

      <div className="w-[140px] space-y-1.5">
        <Label>Frequency</Label>
        <Select value={draft.frequency} onValueChange={(v) => set({ frequency: v as ReportScheduleFrequency })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(draft.frequency === "WEEKLY" || draft.frequency === "BIWEEKLY") && (
        <div className="w-[150px] space-y-1.5">
          <Label>Day of week</Label>
          <Select value={draft.dayOfWeek} onValueChange={(v) => set({ dayOfWeek: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((d, i) => (
                <SelectItem key={d} value={String(i)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {draft.frequency === "MONTHLY" && (
        <div className="w-[110px] space-y-1.5">
          <Label>Day of month</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={draft.dayOfMonth}
            onChange={(e) => set({ dayOfMonth: e.target.value })}
          />
        </div>
      )}
    </>
  );
}

export function ReportSchedulePanel() {
  const { data: schedules } = useReportSchedules();
  const createSchedule = useCreateReportSchedule();
  const updateSchedule = useUpdateReportSchedule();
  const toggleSchedule = useToggleReportSchedule();
  const deleteSchedule = useDeleteReportSchedule();
  const sendNow = useSendReportScheduleNow();

  const [draft, setDraft] = React.useState<ScheduleDraft>(NEW_DRAFT);
  const [editing, setEditing] = React.useState<{ id: string; draft: ScheduleDraft } | null>(null);

  function handleAdd() {
    createSchedule.mutate(toInput(draft), {
      onSuccess: () => {
        trackEvent("report_schedule_created", {
          frequency: draft.frequency,
          recipient_count: draft.recipients.split(",").filter((r) => r.trim()).length,
        });
        toast.success("Schedule added");
        setDraft((d) => ({ ...d, recipients: "" }));
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add schedule"),
    });
  }

  function handleSave() {
    if (!editing) return;
    const { id, draft: edited } = editing;
    updateSchedule.mutate(
      { id, ...toInput(edited) },
      {
        onSuccess: () => {
          trackEvent("report_schedule_updated", { frequency: edited.frequency });
          toast.success("Schedule updated");
          setEditing(null);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update schedule"),
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-neutral-900 flex items-center gap-2">
          <Mail className="size-4" />
          Scheduled Email Reports
        </CardTitle>
        <p className="text-xs text-neutral-400">
          Automatically email this report to a distribution list once a day, on the day(s) you choose.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {schedules && schedules.length > 0 && (
          <ul className="flex flex-col gap-2">
            {schedules.map((s) =>
              editing?.id === s.id ? (
                <li key={s.id} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-300 p-2.5 text-sm">
                  <ScheduleFields draft={editing.draft} onChange={(d) => setEditing({ id: s.id, draft: d })} />
                  <Button onClick={handleSave} disabled={!editing.draft.recipients.trim() || updateSchedule.isPending}>
                    {updateSchedule.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(null)} disabled={updateSchedule.isPending}>
                    Cancel
                  </Button>
                </li>
              ) : (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 p-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900">{s.recipients}</p>
                    <p className="text-xs text-neutral-400">
                      {describeSchedule(s)}
                      {!s.enabled && " · Paused"}
                      {s.lastSentAt && ` · Last sent ${new Date(s.lastSentAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Send now"
                      disabled={sendNow.isPending}
                      onClick={() =>
                        sendNow.mutate(s.id, {
                          onSuccess: () => {
                            trackEvent("report_schedule_sent_now", {});
                            toast.success(`Report sent to ${s.recipients.split(",").join(", ")}`);
                          },
                          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to send report"),
                        })
                      }
                    >
                      {sendNow.isPending && sendNow.variables === s.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing({ id: s.id, draft: draftOf(s) })}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={s.enabled ? "Pause" : "Resume"}
                      onClick={() =>
                        toggleSchedule.mutate(
                          { id: s.id, enabled: !s.enabled },
                          { onSuccess: () => trackEvent("report_schedule_toggled", { enabled: !s.enabled }) }
                        )
                      }
                    >
                      {s.enabled ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      className="text-neutral-400 hover:text-red-600"
                      onClick={() =>
                        deleteSchedule.mutate(s.id, { onSuccess: () => trackEvent("report_schedule_deleted", {}) })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
          <ScheduleFields draft={draft} onChange={setDraft} />
          <Button onClick={handleAdd} disabled={!draft.recipients.trim() || createSchedule.isPending}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        <p className="text-xs text-neutral-400">
          Reports go out once daily, around 9am Eastern, on the day(s) configured above.
        </p>
      </CardContent>
    </Card>
  );
}
