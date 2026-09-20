"use client";

import { useState } from "react";
import Sheet from "./Sheet";

/**
 * A confirmation for something that cannot be undone. The caller spells out
 * what will be lost and what will not, because "are you sure" on its own
 * asks a question the reader has no way to answer.
 */
export default function ConfirmSheet({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Try again.");
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} label={title}>
      <h2>{title}</h2>
      {body}
      {error ? <p className="err">{error}</p> : null}
      <div className="actions">
        <button className="btn danger" onClick={() => void run()} disabled={busy}>
          {busy ? "Working…" : confirmLabel}
        </button>
        <button className="link" onClick={onClose} disabled={busy}>
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
