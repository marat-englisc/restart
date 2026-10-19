import { dayKey } from "./date";
import type { ProgressState } from "@/store";

/** Number of lessons completed on each day. */
export function activityByDay(progress: ProgressState) {
  const map = new Map<string, number>();
  for (const p of Object.values(progress.lessons)) if (p.c) {
    const key = dayKey(p.c);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}
export function streak(activity: Map<string, number>) {
  const d = new Date();
  if (!activity.get(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (activity.get(dayKey(d.getTime()))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
