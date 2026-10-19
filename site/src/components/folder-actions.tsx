"use client";
import { CheckCheckIcon, Undo2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useHydrated } from "@/store/hooks";
import { setCompleted } from "@/store";
import { useCompletion } from "@/hooks/use-progress";
import { toast } from "sonner";

export function FolderActions({ ids }: { ids: string[] }) {
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const { done, total } = useCompletion(ids);
  const allDone = done === total;
  return <Button disabled={!hydrated} variant="outline" size="lg" className="px-4" onClick={() => {
    dispatch(setCompleted({ ids, value: !allDone }));
    toast(allDone ? "Отметки раздела сняты" : "Раздел отмечен изученным");
  }}>{allDone ? <Undo2Icon /> : <CheckCheckIcon />}{allDone ? "Снять отметки раздела" : "Отметить раздел изученным"}</Button>;
}
