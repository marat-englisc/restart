"use client";
import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";

export function useCompletion(ids: string[]) {
  const lessons = useAppSelector((s) => s.progress.lessons);
  return useMemo(() => {
    const done = ids.filter((id) => lessons[id]?.c).length;
    return { done, total: ids.length, pct: ids.length ? done / ids.length : 0 };
  }, [lessons, ids]);
}
export const OPEN_SEARCH_EVENT = "re-1c:open-search";
export const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
