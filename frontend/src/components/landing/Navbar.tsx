"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reveal } from "./Reveal";
import { ArrowUpRight } from "lucide-react";
import { useSparStore } from "@/lib/store";

interface NavbarProps {
  onOpenAbout?: () => void;
  onOpenArchitecture?: () => void;
  onOpenAuth?: () => void;
  onInitiateDialogue?: () => void;
}

export function Navbar({
  onOpenAuth,
  onInitiateDialogue,
}: NavbarProps) {
  const router = useRouter();
  const storeUser = useSparStore((state) => state.user);
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string; picture?: string } | null>(null);

  // Sync auth state from store or localStorage
  useEffect(() => {
    if (storeUser) {
      setCurrentUser(storeUser);
      return;
    }
    try {
      const stored = localStorage.getItem("elenchus_auth_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch {
      // ignore
    }
  }, [storeUser]);

  const handleSignOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    useSparStore.getState().logout();
    setCurrentUser(null);
  };

  const handleTryDemoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onInitiateDialogue) {
      onInitiateDialogue();
    } else {
      router.push("/studio");
    }
  };

  return (
    <nav aria-label="Primary navigation" className="relative">
      {/* Top Left: Brand Wordmark & Technical Mono Version */}
      <div className="fixed left-5 top-5 sm:left-8 sm:top-7 md:left-12 z-50 flex flex-col items-start select-none">
        <Reveal delay={0}>
          <a
            href="/"
            className="font-mono font-medium tracking-tight text-[#0f0f10] drop-shadow-sm text-lg sm:text-xl md:text-2xl focus:outline-none focus:ring-2 focus:ring-[#0f0f10] px-1 -ml-1 transition-colors hover:text-black"
          >
            (elenchus.ai)
          </a>
        </Reveal>

        <Reveal delay={150}>
          <span className="font-mono text-[10px] sm:text-xs text-[#0f0f10]/55 mt-6 sm:mt-8 tracking-wider block">
            [ v.01_voice ]
          </span>
        </Reveal>
      </div>

      {/* Top Right: Vertical Right-Aligned Links with Diagonal Arrows */}
      <div className="fixed right-5 top-5 sm:right-8 sm:top-7 md:right-12 z-50">
        <ul className="flex flex-col items-end gap-1.5 sm:gap-2">
          {/* 1. About */}
          <li>
            <Reveal delay={100}>
              <Link
                href="/about"
                className="group inline-flex items-center gap-1 font-mono text-xs sm:text-sm text-[#0f0f10]/80 drop-shadow-sm hover:text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#0f0f10] px-1 transition-colors duration-200"
              >
                <span>about</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#b8945c]" />
              </Link>
            </Reveal>
          </li>

          {/* 2. Architecture */}
          <li>
            <Reveal delay={220}>
              <Link
                href="/architecture"
                className="group inline-flex items-center gap-1 font-mono text-xs sm:text-sm text-[#0f0f10]/80 drop-shadow-sm hover:text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#0f0f10] px-1 transition-colors duration-200"
              >
                <span>architecture</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#b8945c]" />
              </Link>
            </Reveal>
          </li>

          {/* 3. Sign In / Sign Up */}
          <li>
            <Reveal delay={340}>
              {currentUser ? (
                <div className="group inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm text-[#0f0f10]/80 drop-shadow-sm">
                  {currentUser.picture && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={currentUser.picture}
                      alt={currentUser.name || "User"}
                      className="w-4 h-4 object-cover inline-block border border-[#0f0f10]/20"
                    />
                  )}
                  <span className="truncate max-w-[120px]">{currentUser.name || currentUser.email}</span>
                  <button
                    onClick={handleSignOut}
                    title="Sign out"
                    className="hover:text-rose-600 transition-colors inline-flex items-center gap-0.5"
                  >
                    <span className="text-[11px] underline">sign out</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth && onOpenAuth()}
                  className="group inline-flex items-center gap-1 font-mono text-xs sm:text-sm text-[#0f0f10]/80 drop-shadow-sm hover:text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#0f0f10] px-1 transition-colors duration-200"
                >
                  <span>sign in</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              )}
            </Reveal>
          </li>

          {/* 4. Try Demo / Enter Studio */}
          <li>
            <Reveal delay={460}>
              <button
                type="button"
                onClick={handleTryDemoClick}
                className="group inline-flex items-center gap-1 font-mono text-xs sm:text-sm text-[#0f0f10]/80 drop-shadow-sm hover:text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#0f0f10] rounded px-1 transition-colors duration-200"
              >
                <span>{currentUser ? "enter studio" : "try demo"}</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </Reveal>
          </li>
        </ul>
      </div>
    </nav>
  );
}
