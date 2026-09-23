"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsNewTheme } from "@/frontend/context/UiThemeContext";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const isNewTheme = useIsNewTheme();

  if (isNewTheme) {
    return (
      <nav aria-label="Навигация" className={cn("flex items-center gap-2 text-[13px] min-w-0", className)}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={index} className="flex items-center gap-2 min-w-0">
              {index > 0 && <span className="text-white/20 select-none">/</span>}
              {isLast ? (
                <span className="text-white font-semibold truncate max-w-[280px]">{item.label}</span>
              ) : (
                <Link
                  href={item.href || "#"}
                  className="text-white/45 hover:text-white transition-colors truncate max-w-[200px]"
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Навигация" className={cn("flex items-center gap-2 text-[15px] min-w-0", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2 min-w-0 max-w-[200px]">
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            )}
            {isLast ? (
              <span className="text-white font-semibold truncate block" title={item.label}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href || "#"}
                className="text-white/60 hover:text-white/80 transition-colors truncate block min-w-0"
                title={item.label}
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

