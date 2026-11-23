import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Instagram, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";

export function Wordmark({ className, subtle = false }: { className?: string; subtle?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 font-display text-[1.35rem] font-semibold tracking-[-0.05em]", className)}>
      <span className={subtle ? "text-foreground" : "text-foreground"}>cardlify</span>
      <span className="h-2 w-2 translate-y-[-1px] rounded-full bg-lime ring-1 ring-foreground/20" />
      <span className="mono-label mb-1 text-[9px] text-foreground/40">®</span>
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("mono-label inline-flex items-center gap-2 text-foreground/50", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-lime ring-1 ring-foreground/25" />
      {children}
    </span>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-foreground/10 bg-foreground py-4 text-paper">
      <div className="marquee-track items-center gap-10 pr-10">
        {row.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-10">
            <span className="mono-label whitespace-nowrap text-[11px] text-paper/80">{item}</span>
            <span className="text-lime">✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function StudioFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-foreground text-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-20">
        <div className="grid gap-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-6">
            <Wordmark className="text-paper" />
            <p className="max-w-xs text-sm leading-relaxed text-paper/55">
              A bulk card studio for organisers. Design one template, share one link, let
              everyone else do the typing.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: "https://www.instagram.com/cardlify26", label: "Instagram" },
                { icon: Twitter, href: "#", label: "Twitter" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-paper/15 text-paper/70 transition hover:border-lime hover:bg-lime hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Product",
              links: [
                { label: "Studio", to: "/" },
                { label: "Templates", to: "/templates" },
                { label: "Pricing", to: "/pricing" },
                { label: "Dashboard", to: "/dashboard" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "Lovely people", to: "/lovelypeoples" },
                { label: "Profile", to: "/profile" },
                { label: "Sign in", to: "/auth" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Terms", to: "#" },
                { label: "Privacy", to: "#" },
              ],
            },
          ].map((col) => (
            <div key={col.title} className="space-y-5">
              <h4 className="mono-label text-paper/40">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1 text-sm text-paper/70 transition hover:text-paper"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-paper/10 pt-8 text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono-label text-[10px]">© 2026 Cardlify. Every card, considered.</p>
          <p className="mono-label text-[10px]">Made for organisers · Dhaka → everywhere</p>
        </div>
      </div>
    </footer>
  );
}
