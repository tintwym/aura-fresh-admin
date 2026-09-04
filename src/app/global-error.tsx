"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen grid place-items-center bg-[#f4f7f5] px-6 text-[#1a2e24] antialiased">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Aura Fresh Admin crashed</h1>
          <p className="mt-2 text-sm text-[#5c6f66]">
            A critical error stopped the app. You can try recovering below.
          </p>
          {error?.message && (
            <p className="mt-3 rounded-xl border border-[#c45c26]/20 bg-white px-3 py-2 text-left text-[11px] font-mono text-[#5c6f66] break-words">
              {error.message}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-8 rounded-xl bg-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Reload admin
          </button>
        </div>
      </body>
    </html>
  );
}
