import type { MealType } from "@/lib/domain";

// Line icons in the same weight as the tab bar. Drawn rather than imported
// so they take their colour from the theme and stay crisp at any size.
const PATHS: Record<MealType, string> = {
  // Sunrise: the first meal of the day.
  b: '<path d="M3 19h18"/><path d="M7.5 19a4.5 4.5 0 0 1 9 0"/><path d="M12 4.5v2M5.6 7.1l1.4 1.4M18.4 7.1l-1.4 1.4"/>',
  // A bowl.
  l: '<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M7 20.5h10"/>',
  // Fork and knife.
  d: '<path d="M7 3v7a2 2 0 0 0 4 0V3"/><path d="M9 10v11"/><path d="M17.5 3c-1.6 2-1.6 5.5 0 7.5V21"/>',
  // An apple.
  s: '<path d="M12 8.5c-1-1-2.2-1.5-3.4-1.5C6.2 7 4.5 9 4.5 12c0 4 3 8.5 5 8.5.9 0 1.4-.5 2.5-.5s1.6.5 2.5.5c2 0 5-4.5 5-8.5 0-3-1.7-5-4.1-5-1.2 0-2.4.5-3.4 1.5z"/><path d="M12 8.5V5"/><path d="M12 5c1.5 0 2.5-.8 3-2-1.5-.3-2.6.3-3 2z"/>',
};

export default function MealIcon({ meal, className }: { meal: MealType; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: PATHS[meal] }}
    />
  );
}
