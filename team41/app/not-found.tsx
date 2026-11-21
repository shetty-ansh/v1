import Link from "next/link";

// Shown for any unknown address (e.g. a mistyped ward code).
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#faf3eb] px-6 text-center text-[#2b3033]">
      <p className="font-[family-name:var(--font-bricolage)] text-[13px] font-bold uppercase tracking-[.14em] text-[#ee7454]">Follow the Rupee</p>
      <h1 className="mt-3 font-[family-name:var(--font-bricolage)] text-[clamp(32px,6vw,56px)] font-extrabold leading-tight tracking-[-.04em]">
        This page doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-md text-[16px] text-[#4a4f52]">यह पेज नहीं मिला · हे पान सापडले नाही</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-[#2b3033] px-5 py-2.5 font-semibold text-white hover:bg-[#ee7454]">Go home</Link>
        <Link href="/map" className="rounded-full bg-white px-5 py-2.5 font-semibold shadow-[0_0_0_1px_rgba(43,48,51,.14)] hover:text-[#ee7454]">Open the ward map</Link>
      </div>
    </main>
  );
}
