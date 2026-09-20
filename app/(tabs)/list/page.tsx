import { Suspense } from "react";
import ListScreen from "./ListScreen";

export const metadata = { title: "List" };

export default function ListPage() {
  return (
    <Suspense fallback={<p className="empty">Loading the list…</p>}>
      <ListScreen />
    </Suspense>
  );
}
