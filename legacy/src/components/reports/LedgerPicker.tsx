"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Combobox, { type ComboboxOption } from "@/components/shared/Combobox";

type GeneralLedgerOption = { id: number; code: string; name: string; groupPath: string };

export default function LedgerPicker({ selectedId }: { selectedId: number | null }) {
  const router = useRouter();
  const [ledgers, setLedgers] = useState<GeneralLedgerOption[]>([]);

  useEffect(() => {
    fetch("/api/general-ledgers")
      .then((r) => r.json())
      .then((rows: GeneralLedgerOption[]) => setLedgers(Array.isArray(rows) ? rows : []))
      .catch(() => setLedgers([]));
  }, []);

  const options: ComboboxOption[] = useMemo(
    () => ledgers.map((gl) => ({ value: String(gl.id), label: `${gl.code} — ${gl.name}`, description: gl.groupPath })),
    [ledgers]
  );

  return (
    <div className="max-w-md">
      <Combobox
        options={options}
        value={selectedId ? String(selectedId) : ""}
        onChange={(v) => router.push(`/financial-statements/ledgers?generalLedgerId=${v}`)}
        placeholder="Search account..."
        emptyMessage="No ledgers match your search."
      />
    </div>
  );
}
