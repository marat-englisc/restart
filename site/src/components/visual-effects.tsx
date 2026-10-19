"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { motion, MotionConfig, useInView, useMotionTemplate, useSpring, useTransform } from "motion/react";
import { PauseIcon, PlayIcon } from "lucide-react";
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion";

const MotionLink = motion.create(Link);

export function MotionPreferences({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Decorative animations stop offscreen, in background tabs and on request. */
export function HeroScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: "100px 0px" });
  const reduced = useReducedMotionPreference();
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const active = inView && visible && !paused && !reduced;
  const x = useSpring(900, { stiffness: 65, damping: 30 });
  const y = useSpring(200, { stiffness: 65, damping: 30 });
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, var(--hero-spot), transparent 75%)`;

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  function move(event: PointerEvent<HTMLElement>) {
    if (!active || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - bounds.left);
    y.set(event.clientY - bounds.top);
  }

  return <section ref={ref} className="hero-scene relative isolate overflow-hidden border-b" data-animate={active} onPointerMove={move}>
    <div className="hero-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="hero-aurora hero-aurora-one" />
      <div className="hero-aurora hero-aurora-two" />
      <div className="hero-grid-field">
        <AnimatedGridPattern width={64} height={64} numSquares={32} maxOpacity={0.22} duration={3.8} repeatDelay={0.8} active={active} className="hero-grid" />
      </div>
      <div className="hero-orbits">
        <div className="hero-orbit orbit-one"><i /></div>
        <div className="hero-orbit orbit-two"><i /></div>
        <div className="hero-orbit orbit-three" />
        <span className="hero-star star-one" /><span className="hero-star star-two" />
      </div>
      <div className="hero-beam beam-one" /><div className="hero-beam beam-two" />
      <motion.div className="absolute inset-0" style={{ background: spotlight }} />
      <div className="hero-vignette absolute inset-0" />
    </div>
    {children}
    <button type="button" className="hero-motion-control" onClick={() => setPaused((p) => !p)}
      aria-label={paused ? "Возобновить анимацию фона" : "Приостановить анимацию фона"}
      title={paused ? "Возобновить анимацию фона" : "Приостановить анимацию фона"}>
      {paused ? <PlayIcon className="size-3" /> : <PauseIcon className="size-3" />}
    </button>
  </section>;
}

/** Keyframes start on entry; exported HTML stays visible without JavaScript. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotionPreference();
  return <motion.div className={className} initial={false}
    whileInView={reduced ? { opacity: 1 } : { opacity: [0, 1], y: [22, 0], filter: ["blur(5px)", "blur(0px)"] }}
    viewport={{ once: true, amount: 0.08 }}
    transition={{ duration: reduced ? 0 : 0.65, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}>
    {children}
  </motion.div>;
}

export function SectionCard({ href, children }: { href: string; children: ReactNode }) {
  const reduced = useReducedMotionPreference();
  const x = useSpring(150, { stiffness: 140, damping: 25 });
  const y = useSpring(100, { stiffness: 140, damping: 25 });
  const rotateX = useSpring(0, { stiffness: 180, damping: 22 });
  const rotateY = useSpring(0, { stiffness: 180, damping: 22 });
  const background = useMotionTemplate`radial-gradient(360px circle at ${x}px ${y}px, var(--card-spot), transparent 72%)`;
  function move(event: PointerEvent<HTMLAnchorElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    x.set(px); y.set(py);
    rotateX.set((0.5 - py / rect.height) * 4);
    rotateY.set((px / rect.width - 0.5) * 4);
  }
  return <MotionLink href={href} className="section-card group relative isolate flex min-h-60 flex-col overflow-hidden border-b border-r p-6 sm:p-7"
    onPointerMove={move} onPointerLeave={() => { rotateX.set(0); rotateY.set(0); }}
    style={{ rotateX, rotateY, transformPerspective: 900 }}
    whileHover={reduced ? undefined : { y: -4 }} whileTap={reduced ? undefined : { scale: 0.99 }}
    transition={{ type: "spring", stiffness: 240, damping: 24 }}>
    <motion.span aria-hidden="true" className="card-spotlight pointer-events-none absolute inset-0 -z-10" style={{ background }} />
    <span className="card-accent-line" aria-hidden="true" />
    {children}
  </MotionLink>;
}

export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const reduced = useReducedMotionPreference();
  const current = useSpring(0, { stiffness: 65, damping: 24 });
  const display = useTransform(current, (n) => Math.round(n).toString() + suffix);
  useEffect(() => {
    if (reduced) current.jump(value); else current.set(value);
  }, [value, suffix, current, reduced]);
  return <span className="tabular-nums" aria-label={value + suffix}><motion.span aria-hidden="true">{display}</motion.span></span>;
}
