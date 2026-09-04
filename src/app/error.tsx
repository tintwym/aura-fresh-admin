"use client";

import { AdminStatusView } from "@/components/AdminStatusView";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <AdminStatusView kind="500" detail={error?.message} />
      <div className="fixed bottom-6 inset-x-0 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-[#2d6a4f]/25 bg-white px-4 py-2 text-sm font-semibold text-[#1a2e24] shadow-sm"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-xl bg-[#2d6a4f] px-4 py-2 text-sm font-semibold text-white"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
