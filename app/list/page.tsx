import { redirect } from "next/navigation";

// The shopping list is the third step of the prep flow now.
export default function ListRedirect() {
  redirect("/prep?step=shop");
}
