import { configureStore, createAction, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { normalizeProgress, type ProgressState } from "@/lib/progress-data";

export type { ProgressState } from "@/lib/progress-data";
export interface PersistedState { progress: ProgressState }
export const STORAGE_KEY = "re-1c:progress:v1";
export const hydrate = createAction<Partial<PersistedState> | null>("app/hydrate");
export const resetAll = createAction("app/reset");

const meta = createSlice({
  name: "meta", initialState: { hydrated: false }, reducers: {},
  extraReducers: (b) => b.addCase(hydrate, (s) => void (s.hydrated = true)),
});
const initialProgress: ProgressState = { lessons: {}, last: null };
const progress = createSlice({
  name: "progress", initialState: initialProgress,
  reducers: {
    visit: (s, a: PayloadAction<{ id: string; href: string; title: string }>) => {
      const now = Date.now();
      const p = (s.lessons[a.payload.id] ??= {});
      p.v ??= now;
      s.last = { ...a.payload, at: now };
    },
    setCompleted: (s, a: PayloadAction<{ ids: string[]; value: boolean }>) => {
      const now = Date.now();
      for (const id of a.payload.ids) {
        const p = (s.lessons[id] ??= {});
        if (a.payload.value) { p.c ??= now; p.v ??= now; }
        else delete p.c;
      }
    },
  },
  extraReducers: (b) => b
    .addCase(hydrate, (_, a) => normalizeProgress(a.payload?.progress) ?? initialProgress)
    .addCase(resetAll, () => initialProgress),
});
export const makeStore = () => configureStore({ reducer: { meta: meta.reducer, progress: progress.reducer } });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export const { visit, setCompleted } = progress.actions;
export function selectPersisted(s: RootState): PersistedState { return { progress: s.progress }; }
