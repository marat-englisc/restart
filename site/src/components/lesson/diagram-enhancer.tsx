"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

let sequence = 0;
export function DiagramEnhancer({ targetId }: { targetId: string }) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const root = document.getElementById(targetId);
    const diagrams = root?.querySelectorAll<HTMLElement>("pre.mermaid-source");
    if (!diagrams?.length || !resolvedTheme) return;
    let cancelled = false;
    void (async () => {
      const { default: mermaid } = await import("mermaid");
      if (cancelled) return;
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: resolvedTheme === "dark" ? "dark" : "neutral", fontFamily: "Segoe UI, sans-serif", suppressErrorRendering: true });
      for (const element of diagrams) {
        const source = element.dataset.source ?? element.textContent ?? "";
        element.dataset.source = source;
        try {
          const { svg } = await mermaid.render(`diagram-${++sequence}`, source);
          if (cancelled) return;
          element.innerHTML = svg;
          element.classList.add("diagram-rendered");
          element.setAttribute("role", "img");
          element.setAttribute("aria-label", "Схема из конспекта");
        } catch {
          if (!cancelled) { element.textContent = source; element.setAttribute("aria-label", "Исходный текст схемы"); }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, resolvedTheme, targetId]);
  return null;
}
