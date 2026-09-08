"use client";

import * as React from "react";
import { toast } from "sonner";
import { Mail, Plus, Trash2, Pause, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useReportSchedules,
  useCreateReportSchedule,
  useToggleReportSchedule,
  useDeleteReportSchedule,
  type CreateScheduleInput,
} from "@/hooks/use-report-schedules";
import type { ReportScheduleFrequency } from "@/types/report-schedule";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describeSchedule(s: { frequency: ReportScheduleFrequency; dayOfWeek: number | null; dayOfMonth: number | null }): string {
  if (s.frequency === "DAILY") return "Every day";
  if (s.frequency === "WEEKLY") return `Every ${WEEKDAYS[s.dayOfWeek ?? 0]}`;
  return `Day ${s.dayOfMonth} of every month`;
}

export function ReportSchedulePanel() {
  const { data: schedules } = useReportSchedules();
  const createSchedule = useCreateReportSchedule();
  const toggleSchedule = useToggleReportSchedule();
  const deleteSchedule = useDeleteReportSchedule();

  const [recipients, setRecipients] = React.useState("");
  const [frequency, setFrequency] = React.useState<ReportScheduleFrequency>("DAILY");
  const [dayOfWeek, setDayOfWeek] = React.useState("1");
  const [dayOfMonth, setDayOfMonth] = React.useState("1");

  function handleAdd() {
    const payload: CreateScheduleInput = { recipients, frequency };
    if (frequency === "WEEKLY") payload.dayOfWeek = Number(dayOfWeek);
    if (frequency === "MONTHLY") payload.dayOfMonth = Number(dayOfMonth);

    createSchedule.mutate(payload, {
      onSuccess: () => {
        toast.success("Schedule added");
        setRecipients("");
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add schedule"),
    });
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
            {schedules.map((s) => (
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
                    title={s.enabled ? "Pause" : "Resume"}
                    onClick={() => toggleSchedule.mutate({ id: s.id, enabled: !s.enabled })}
                  >
                    {s.enabled ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    className="text-neutral-400 hover:text-red-600"
                    onClick={() => deleteSchedule.mutate(s.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label>Recipient email(s)</Label>
            <Input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="ops@company.com, manager@company.com"
            />
          </div>

          <div className="w-[140px] space-y-1.5">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as ReportScheduleFrequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === "WEEKLY" && (
            <div className="w-[150px] space-y-1.5">
              <Label>Day of week</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
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

          {frequency === "MONTHLY" && (
            <div className="w-[110px] space-y-1.5">
              <Label>Day of month</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleAdd} disabled={!recipients.trim() || createSchedule.isPending}>
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
