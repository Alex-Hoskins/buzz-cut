export interface Sponsor {
  name: string;
  tagline: string;
  subline?: string;
  url: string;
  logoSrc: string;
  cta: string;
}

export const CURRENT_SPONSOR: Sponsor = {
  name: "Leveo",
  tagline: "Your AI-powered job search command center",
  subline: "Track applications, score your resume, and write outreach — right inside Chrome.",
  url: "https://leveo.io",
  logoSrc: "/leveo.png",
  cta: "Add to Chrome — Free",
};
