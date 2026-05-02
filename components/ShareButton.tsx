"use client";

import { useState, useRef } from "react";

interface Props {
  text: string;
  label?: string;
}

export default function ShareButton({ text, label = "Share Result" }: Props) {
  const [toastVisible, setToastVisible] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleShare() {
    if (navigator.canShare?.({ text })) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        showToast();
        return;
      } catch {
        // Clipboard blocked — fall through to textarea modal
      }
    }

    setShowFallback(true);
  }

  function showToast() {
    setToastVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToastVisible(false), 2000);
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={handleShare}
          className="w-full py-3 rounded-lg bg-[#ea580c] text-white font-mono uppercase tracking-widest text-sm hover:bg-[#c2410c] transition-colors"
        >
          {label}
        </button>
        {toastVisible && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0f2942] text-[#fef3e7] text-xs font-mono px-3 py-1.5 rounded-lg whitespace-nowrap animate-fadeIn">
            Copied to clipboard ✓
          </div>
        )}
      </div>

      {showFallback && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f2942]/70 p-4">
          <div className="bg-[#fef3e7] rounded-2xl p-6 max-w-sm w-full border-4 border-[#0f2942] text-[#0f2942]">
            <p className="font-mono text-xs uppercase tracking-widest opacity-60 mb-3">
              Copy and share
            </p>
            <textarea
              readOnly
              value={text}
              rows={6}
              className="w-full bg-[#0f2942]/5 rounded-lg p-3 font-mono text-sm resize-none mb-4 focus:outline-none"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={() => setShowFallback(false)}
              className="w-full py-2 rounded-lg border-2 border-[#0f2942] font-mono text-sm uppercase tracking-widest hover:bg-[#0f2942] hover:text-[#fef3e7] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
