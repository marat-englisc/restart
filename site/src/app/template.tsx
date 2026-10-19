"use client";

import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Opacity keeps fixed and sticky elements in their original coordinate space.
  return <div key={pathname} className="page-enter flex min-w-0 flex-1 flex-col">
    {children}
  </div>;
}
