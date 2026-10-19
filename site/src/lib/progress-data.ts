export interface LessonProgress { v?: number; c?: number }
export interface ProgressState {
  lessons: Record<string, LessonProgress>;
  last: { id: string; href: string; title: string; at: number } | null;
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const timestamp = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;

/** Validate browser storage and imported backups before they enter the store. */
export function normalizeProgress(value: unknown): ProgressState | null {
  if (!record(value) || !record(value.lessons)) return null;
  const lessons: Record<string, LessonProgress> = {};
  for (const [id, item] of Object.entries(value.lessons)) {
    if (!/^[a-z0-9]+$/.test(id) || !record(item)) return null;
    if ((item.v !== undefined && !timestamp(item.v)) || (item.c !== undefined && !timestamp(item.c))) return null;
    lessons[id] = { ...(timestamp(item.v) ? { v: item.v } : {}), ...(timestamp(item.c) ? { c: item.c } : {}) };
  }
  let last: ProgressState["last"] = null;
  if (value.last != null) {
    const l = value.last;
    if (!record(l) || typeof l.id !== "string" || typeof l.title !== "string" || typeof l.href !== "string" || !/^\/l\/[\p{L}\p{N}/%-]+\/$/u.test(l.href) || !timestamp(l.at)) return null;
    last = { id: l.id, title: l.title, href: l.href, at: l.at };
  }
  return { lessons, last };
}
export function parseBackup(value: unknown): ProgressState {
  if (!record(value) || value.app !== "re-1c" || value.version !== 1) throw new Error("Это не резервная копия re:1c");
  const progress = normalizeProgress(value.progress);
  if (!progress) throw new Error("Некорректные данные прогресса");
  return progress;
}
