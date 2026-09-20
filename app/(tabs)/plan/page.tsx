import { Suspense } from "react";
import PlanScreen from "./PlanScreen";

export const metadata = { title: "Plan" };

export default function PlanPage() {
  return (
    <Suspense fallback={<p className="empty">Loading next week…</p>}>
      <PlanScreen />
    </Suspense>
  );
}
