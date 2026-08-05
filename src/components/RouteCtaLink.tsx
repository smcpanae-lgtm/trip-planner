"use client";

import { trackEvent } from "@/lib/analytics";

export default function RouteCtaLink({
  href,
  from,
  to,
  className,
  children,
}: {
  href: string;
  from: string;
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackEvent("route_page_cta", { from, to })}
    >
      {children}
    </a>
  );
}
