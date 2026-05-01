import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Buzz Cut — The Pendulum Barbershop Game",
  description:
    "A pendulum-clipper haircut puzzle. Drop the clippers at the right moment to give the perfect cut in the fewest passes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body bg-[#fef3e7] text-[#0f2942] antialiased">
        {children}
      </body>
    </html>
  );
}
