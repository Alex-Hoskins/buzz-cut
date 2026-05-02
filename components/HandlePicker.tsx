"use client";

import { useState } from "react";

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,12}$/;

interface Props {
  onSubmit: (handle: string) => void;
  initialError?: string;
}

export default function HandlePicker({ onSubmit, initialError }: Props) {
  const [value, setValue] = useState("");
  // initialError comes from a 409 response — shown when the picker re-opens
  const [error, setError] = useState(initialError ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!HANDLE_RE.test(value)) {
      setError("3–12 characters: letters, numbers, _ or -");
      return;
    }
    // Don't persist locally here — ResultModal saves it only after the server accepts it.
    onSubmit(value);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f2942]/80 backdrop-blur-sm p-4">
      <div className="bg-[#fef3e7] rounded-3xl p-6 max-w-sm w-full border-4 border-[#0f2942] shadow-2xl text-[#0f2942]">
        <p className="text-xs uppercase tracking-[0.3em] opacity-60 font-mono text-center mb-1">
          First cut!
        </p>
        <h2 className="font-display text-2xl font-bold text-center mb-2">
          Pick a handle
        </h2>
        <p className="text-sm opacity-70 text-center mb-6">
          Your name on the leaderboard — make it count.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            placeholder="e.g. ClipperKing"
            maxLength={12}
            autoFocus
            className="w-full border-2 border-[#0f2942] rounded-lg px-4 py-3 font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
          />
          {error && (
            <p className="text-xs text-[#ea580c] font-mono">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#ea580c] text-white font-mono uppercase tracking-widest text-sm hover:bg-[#c2410c] transition-colors"
          >
            Claim It →
          </button>
        </form>
      </div>
    </div>
  );
}
