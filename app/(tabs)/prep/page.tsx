import { Suspense } from "react";
import PrepFlow from "./PrepFlow";

export const metadata = { title: "Prep" };

export default function PrepPage() {
  return (
    <Suspense fallback={<p className="empty">Loading the week…</p>}>
      <PrepFlow />
    </Suspense>
  );
}
