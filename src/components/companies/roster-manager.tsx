"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateRoster, useDeleteRoster } from "@/hooks/use-companies";
import type { RosterDTO } from "@/types/company";

export function RosterManager({ companyId, rosters }: { companyId: string; rosters: RosterDTO[] }) {
  const createRoster = useCreateRoster();
  const deleteRoster = useDeleteRoster();
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createRoster.mutate(
      { companyId, name: trimmed },
      {
        onSuccess: () => {
          setName("");
          setAdding(false);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add roster"),
      }
    );
  }

  function handleRemove(id: string, rosterName: string) {
    deleteRoster.mutate(id, {
      onSuccess: () => toast.success(`Removed roster ${rosterName}`),
      onError: () => toast.error("Failed to remove roster"),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {rosters.map((r) => (
        <span
          key={r.id}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs text-neutral-700"
        >
          {r.name}
          <button
            onClick={() => handleRemove(r.id, r.name)}
            className="text-neutral-400 hover:text-red-600"
            title="Remove roster"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      {adding ? (
        <span className="inline-flex items-center gap-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setAdding(false);
                setName("");
              }
            }}
            placeholder="Roster name"
            className="h-7 w-[120px] text-xs"
            autoFocus
          />
          <Button size="sm" className="h-7 px-2" onClick={handleAdd} disabled={createRoster.isPending}>
            Add
          </Button>
        </span>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
        >
          <Plus className="size-3" />
          Roster
        </button>
      )}
    </div>
  );
}
