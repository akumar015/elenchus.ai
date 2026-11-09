"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useSparStore } from "@/lib/store";

interface GoogleJwtPayload {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { email: string; name?: string }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setError(null);
      setSubmitted(false);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign In with Google"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#0f0f10]/40 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-[#fbfbf9] border border-[#0f0f10]/15 shadow-2xl p-6 sm:p-8 text-[#0f0f10] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#0f0f10]/10 pb-4">
          <div className="space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#0f0f10]/60 block">
              [ elenchus.ai · account ]
            </span>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#0f0f10]">
              Sign In to Spar
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-[#0f0f10]/50 hover:text-[#0f0f10] hover:scale-110 transition-all rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
            <div className="font-serif text-xl font-medium text-[#0f0f10]">
              Welcome to elenchus.ai
            </div>
            <p className="font-mono text-xs text-[#0f0f10]/60">
              Account connected · Synchronizing arena...
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-[#0f0f10]/75 leading-relaxed font-normal">
              Sign in with your Google account to synchronize your dialectic sparring history, preserve atomic thought cards, and track cognitive growth across devices.
            </p>

            {error && (
              <p className="font-mono text-xs text-rose-600 tracking-wide text-center">
                {error}
              </p>
            )}

            {/* Google OAuth One-Click Sign In */}
            <div className="w-full flex justify-center py-2">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
                      const authedUser = {
                        email: decoded.email || "",
                        name: decoded.name || decoded.email?.split("@")[0] || "Thinker",
                        picture: decoded.picture,
                        sub: decoded.sub,
                        idToken: credentialResponse.credential,
                      };
                      try {
                        localStorage.setItem("elenchus_auth_user", JSON.stringify(authedUser));
                      } catch {
                        // ignore
                      }
                      useSparStore.getState().setUser(authedUser);
                      setSubmitted(true);
                      setTimeout(() => {
                        if (onSuccess) onSuccess(authedUser);
                        onClose();
                        router.push("/studio");
                      }, 500);
                    } catch {
                      setError("Failed to process Google sign-in response.");
                    }
                  }
                }}
                onError={() => {
                  setError("Google sign-in was cancelled or failed.");
                }}
                theme="outline"
                shape="pill"
                size="large"
                width="100%"
                text="continue_with"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
