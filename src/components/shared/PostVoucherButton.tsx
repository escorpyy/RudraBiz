"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function PostVoucherButton({ apiUrl, voucherNumber }: { apiUrl: string; voucherNumber: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePost() {
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to post voucher.");
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        <CheckCircle2 size={16} />
        Post Voucher
      </button>

      <ConfirmDialog
        open={confirming}
        title={`Post voucher ${voucherNumber}?`}
        message="Posting locks this voucher permanently — it can no longer be edited or deleted."
        confirmLabel="Post Voucher"
        error={error}
        loading={posting}
        onConfirm={handlePost}
        onCancel={() => {
          setConfirming(false);
          setError(null);
        }}
      />
    </>
  );
}
