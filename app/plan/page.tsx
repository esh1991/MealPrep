import { redirect } from "next/navigation";

// Planning and cooking are one flow now, under /prep.
export default async function PlanRedirect({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const step = view === "menu" ? "menu" : view === "macros" ? "" : "eating";
  redirect(step ? `/prep?step=${step}` : "/insights");
}
