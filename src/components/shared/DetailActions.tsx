"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function DetailActions({
  editHref,
  deleteUrl,
  redirectHref,
  entityName,
}: {
  editHref: string;
  deleteUrl: string;
  redirectHref: string;
  entityName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(deleteUrl, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to delete.");
      router.push(redirectHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2.5">
        <Link
          href={editHref}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Pencil size={16} />
          Edit
        </Link>
        <button
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Delete "${entityName}"?`}
        message="This permanently deletes the record. This can't be undone."
        error={error}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirming(false);
          setError(null);
        }}
      />
    </>
  );
}
