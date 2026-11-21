"use client";

import { useEffect, useState } from "react";
import { say } from "@/lib/i18n";
import { useLang } from "@/lib/lang-client";

// Citizens can endorse a contractor for their ward. Stored in this browser only (no shared database in the prototype).
export default function EndorseButton({ id }: { id: string }) {
  const L = say(useLang());
  const [done, setDone] = useState(false);
  useEffect(() => {
    // Deferred so we don't set state synchronously in the effect (post-hydration read).
    const t = window.setTimeout(() => {
      try { setDone(localStorage.getItem(`ftr-endorsed-${id}`) === "1"); } catch { /* storage blocked */ }
    }, 0);
    return () => window.clearTimeout(t);
  }, [id]);
  return (
    <button
      type="button"
      disabled={done}
      onClick={() => { try { localStorage.setItem(`ftr-endorsed-${id}`, "1"); } catch { /* ignore */ } setDone(true); }}
      className="rounded-full bg-[#ee7454] px-4 py-2 font-[family-name:var(--font-bricolage)] text-sm font-semibold text-white hover:bg-[#e0603f] disabled:bg-[#dcfce7] disabled:text-[#166534]"
    >
      {done
        ? L("You endorsed this contractor", "आपने इस ठेकेदार का समर्थन किया", "तुम्ही या कंत्राटदाराला समर्थन दिले")
        : L("Endorse for my ward", "मेरे वार्ड के लिए समर्थन करें", "माझ्या वॉर्डसाठी समर्थन द्या")}
    </button>
  );
}
