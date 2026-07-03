"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Upload, LayoutDashboard, FileStack } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileStack },
];

export function NavRail() {
  const pathname = usePathname();

  return (
    <nav className="w-[72px] md:w-[220px] shrink-0 border-r border-hairline bg-panel/60 backdrop-blur-sm flex flex-col">
      <div className="h-16 flex items-center gap-2 px-4 border-b border-hairline">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-md bg-signal/10 border border-signal/30">
          <Activity className="w-4 h-4 text-signal" strokeWidth={2.5} />
        </div>
        <span className="hidden md:block font-display font-semibold tracking-tight text-[15px]">
          Marketplace<span className="text-signal">Pulse</span>
        </span>
      </div>

      <div className="flex-1 py-4 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group",
                active
                  ? "bg-signal/10 text-signal border border-signal/25"
                  : "text-text-muted hover:text-text-primary hover:bg-panel-raised border border-transparent"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span className="hidden md:block mono-label text-[11px]">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="hidden md:block px-4 py-4 border-t border-hairline">
        <p className="mono-label text-[10px] text-text-muted leading-relaxed">
          Portfolio build
          <br />
          v1.0
        </p>
      </div>
    </nav>
  );
}
