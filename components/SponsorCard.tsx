import type { Sponsor } from "@/lib/sponsors";

interface Props {
  sponsor: Sponsor;
}

export function SponsorTag({ sponsor }: Props) {
  return (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
    >
      <span className="font-mono text-[9px] tracking-[0.25em] uppercase opacity-70">
        Presented by
      </span>
      <img src={sponsor.logoSrc} alt="" className="w-4 h-4 rounded-sm" />
      <span className="font-display text-xs font-bold">{sponsor.name}</span>
    </a>
  );
}

export default function SponsorCard({ sponsor }: Props) {
  return (
    <div className="mb-4 rounded-xl border-2 border-[#0f2942]/15 bg-white/60 p-4">
      <p className="font-mono text-[9px] tracking-[0.3em] uppercase opacity-50 text-center mb-3">
        Today's Cut Sponsored By
      </p>
      <div className="flex items-center gap-3 mb-3">
        <img
          src={sponsor.logoSrc}
          alt={`${sponsor.name} logo`}
          className="w-12 h-12 rounded-lg shrink-0"
        />
        <div className="min-w-0">
          <p className="font-display font-bold text-lg leading-tight">{sponsor.name}</p>
          <p className="font-mono text-xs opacity-70 leading-snug">{sponsor.tagline}</p>
        </div>
      </div>
      {sponsor.subline && (
        <p className="font-mono text-[11px] opacity-60 leading-relaxed mb-3">
          {sponsor.subline}
        </p>
      )}
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full py-2.5 rounded-lg bg-[#0f2942] text-[#fef3e7] font-mono uppercase tracking-widest text-xs text-center hover:bg-[#1a3a5c] transition-colors"
      >
        {sponsor.cta} →
      </a>
    </div>
  );
}
