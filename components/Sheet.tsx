"use client";

import { useEffect, useRef } from "react";

/** The bottom sheet from the prototype: scrim, slide up, Escape to close. */
export default function Sheet({
  onClose,
  children,
  label,
}: {
  onClose: () => void;
  children: React.ReactNode;
  label: string;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
    document.body.classList.add("locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("locked");
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <>
      <div className="scrim enter" onClick={onClose} />
      <div className="panel enter" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={panel}>
        <div className="grab" />
        {children}
      </div>
    </>
  );
}
