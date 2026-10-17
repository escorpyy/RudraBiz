"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { NAV_ITEMS, isNavNode, type NavNode, type NavLeaf } from "@/lib/constants";

// True if this item, or anything nested under it, matches the current route.
function containsActive(item: NavNode | NavLeaf, pathname: string): boolean {
  if (!isNavNode(item)) return pathname.startsWith(item.href);
  return item.children.some((child) => containsActive(child, pathname));
}

function NavTree({
  items,
  depth,
  pathname,
  openNested,
  toggleNested,
}: {
  items: (NavNode | NavLeaf)[];
  depth: number;
  pathname: string;
  openNested: Set<string>;
  toggleNested: (label: string) => void;
}) {
  return (
    <div className="space-y-0.5" style={{ paddingLeft: 18 + depth * 14 }}>
      {items.map((item) => {
        if (!isNavNode(item)) {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg py-2 pl-2 pr-3 text-[13.5px] transition-colors ${
                active ? "font-medium text-brand" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="truncate">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
            </Link>
          );
        }

        const isOpen = openNested.has(item.label);
        const active = containsActive(item, pathname);

        return (
          <div key={item.label}>
            <button
              type="button"
              onClick={() => toggleNested(item.label)}
              className={`flex w-full items-center justify-between rounded-lg py-2 pl-2 pr-3 text-left text-[13.5px] transition-colors ${
                active || isOpen ? "font-medium text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="truncate">{item.label}</span>
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isOpen && (
              <NavTree
                items={item.children}
                depth={depth + 1}
                pathname={pathname}
                openNested={openNested}
                toggleNested={toggleNested}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  // Only one top-level section (Master, Transactions, Inventory, ...) is open
  // at a time, accordion-style, so the ~10-section tree stays manageable.
  const initialTop = NAV_ITEMS.find((item) => containsActive(item, pathname))?.label;
  const [openTop, setOpenTop] = useState<string | undefined>(initialTop);

  // Nested sub-sections (e.g. "Inventory Reports") toggle independently and
  // can co-exist with whichever top-level section is already open.
  const [openNested, setOpenNested] = useState<Set<string>>(() => {
    const set = new Set<string>();
    const findOpenNodes = (items: (NavNode | NavLeaf)[]) => {
      for (const item of items) {
        if (isNavNode(item) && containsActive(item, pathname)) {
          set.add(item.label);
          findOpenNodes(item.children);
        }
      }
    };
    findOpenNodes(NAV_ITEMS);
    return set;
  });

  function toggleNested(label: string) {
    setOpenNested((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col bg-sidebar text-slate-300">
      {/* Logo / brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">
          M
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-white">NTCAS</div>
          <div className="text-xs text-slate-400">Accounting</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((section) => {
          const Icon = section.icon!;
          const isOpen = openTop === section.label;
          const isSectionActive = containsActive(section, pathname);

          return (
            <div key={section.label}>
              <button
                type="button"
                onClick={() => setOpenTop(isOpen ? undefined : section.label)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold uppercase tracking-wide transition-colors ${
                  isSectionActive || isOpen
                    ? "bg-sidebar-active text-white"
                    : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{section.label}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isOpen && (
                <div className="mt-1">
                  <NavTree
                    items={section.children}
                    depth={0}
                    pathname={pathname}
                    openNested={openNested}
                    toggleNested={toggleNested}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-sidebar-hover">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            S
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13.5px] font-semibold text-white">
              Sajilo Nepal Pvt. Ltd.
            </div>
            <div className="text-xs text-slate-400">Admin</div>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
      </div>
    </aside>
  );
}
