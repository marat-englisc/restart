"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { flushSync } from "react-dom";
import { useRef } from "react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduced = useReducedMotionPreference();
  const busy = useRef(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Сменить тему"
      className="theme-toggle"
      onClick={(event) => {
        const next = resolvedTheme === "dark" ? "light" : "dark";
        if (reduced || !document.startViewTransition || document.visibilityState !== "visible") {
          setTheme(next); return;
        }
        if (busy.current) return;
        busy.current = true;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        const transition = document.startViewTransition(() => flushSync(() => setTheme(next)));
        void transition.ready.then(() => {
          return document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 600, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)" },
          ).finished;
        }).catch(() => {}).finally(() => { busy.current = false; });
      }}
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  );
}
