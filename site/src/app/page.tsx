import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { getContent, lessonIdsOf } from "@/lib/content";
import {
  CompletionBar,
  CompletionPct,
  CompletionText,
} from "@/components/progress-bits";
import { HomeStats, ContinueCard } from "@/components/home-client";
import { HeroScene, Reveal, SectionCard } from "@/components/visual-effects";

const descriptions: Record<string, string> = {
  "01": "Объекты конфигурации и первые настройки.",
  "02": "Встроенный язык, коллекции и отладка.",
  "03": "Запросы к данным и создание отчётов.",
  "04": "События, команды и клиент-сервер.",
  "05": "Интеграции и прикладные задачи.",
  "06": "Термины, синтаксис и горячие клавиши.",
};

export default function HomePage() {
  const { root, lessons } = getContent();
  const sections = root.filter((n) => n.kind === "folder");
  const extras = root.filter((n) => n.kind === "lesson");
  const allIds = lessons.map((l) => l.id);

  return (
    <main className="flex-1">
      <HeroScene>
        <div className="hero-content relative mx-auto max-w-[1440px] px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 animate-rise">
            <span className="hero-badge">
              <span className="status-spark" aria-hidden="true" />
              1С:Предприятие
            </span>
            <span className="label">
              {lessons.length} заметок ·{" "}
              {sections.filter((s) => s.num !== "99").length} разделов и
              шпаргалки
            </span>
          </div>
          <h1 className="hero-title mt-7 text-[clamp(3.1rem,8.6vw,8rem)] font-semibold leading-[0.94] tracking-[-0.055em] animate-rise [animation-delay:80ms]">
            <span className="hero-prefix">re:</span>
            <span className="hero-1c">start</span>
            <br />
            <span className="hero-muted">от основ</span>{" "}
            <span className="hero-underline">до&nbsp;разработки</span>
          </h1>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end animate-rise [animation-delay:160ms]">
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Изучайте 1С:Предприятие шаг за шагом: от первого справочника до
              запросов, управляемых форм и интеграций. Читайте конспект,
              пробуйте код и отмечайте пройденное.
            </p>
            <HomeStats allIds={allIds} />
          </div>
          <div className="mt-10 animate-rise [animation-delay:240ms]">
            <ContinueCard />
          </div>
        </div>
      </HeroScene>

      <section
        id="sections"
        className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 sm:py-20"
      >
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="label mb-3 flex items-center gap-2">
              <span className="accent-dash" />
              Ваш маршрут
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Разделы
            </h2>
          </div>
          <span className="label">
            Пройдено <CompletionPct ids={allIds} className="text-brand-text" />
          </span>
        </Reveal>
        <div className="section-grid grid border-l border-t sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s, i) => {
            const ids = lessonIdsOf(s);
            return (
              <Reveal key={s.id} className="h-full" delay={(i % 3) * 0.06}>
                <SectionCard href={s.href}>
                  <div className="flex items-start justify-between">
                    <span className="section-number font-mono text-5xl font-light tracking-tighter">
                      {s.num}
                    </span>
                    <span className="section-arrow">
                      <ArrowUpRightIcon className="size-4" />
                    </span>
                  </div>
                  <h3 className="mt-auto pt-8 text-xl font-medium leading-tight tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {descriptions[s.num ?? ""]}
                  </p>
                  <div className="mt-5 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span>{ids.length} ур.</span>
                    <CompletionText ids={ids} />
                  </div>
                  <CompletionBar ids={ids} className="mt-3" />
                </SectionCard>
              </Reveal>
            );
          })}
        </div>
        {extras.length > 0 && (
          <Reveal className="mt-14">
            <div className="label mb-4">Дополнительно</div>
            <div className="grid border-l border-t sm:grid-cols-3">
              {extras.map((e) => (
                <Link
                  key={e.id}
                  href={e.href}
                  className="extra-link group flex items-center gap-4 border-b border-r px-6 py-5"
                >
                  <span className="font-mono text-sm text-brand-text">
                    {e.num}
                  </span>
                  <span className="font-medium">{e.title}</span>
                  <ArrowUpRightIcon className="ml-auto size-4 opacity-40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </main>
  );
}
