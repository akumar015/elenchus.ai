"use client";

import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useSparStore } from "@/lib/store";
import { LogOut, User } from "lucide-react";

interface GoogleJwtPayload {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

export function GoogleAuthButton() {
  const { user, setUser, logout } = useSparStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  if (!clientId) return null;

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-1 pr-2.5 border border-[#0f0f10]/15 bg-white/70 backdrop-blur-sm hover:border-[#0f0f10]/30 transition-all font-mono text-xs text-[#0f0f10]"
          title={user.email}
        >
          {user.picture ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.picture}
              alt={user.name}
              className="w-5 h-5 object-cover border border-[#0f0f10]/20"
            />
          ) : (
            <div className="w-5 h-5 bg-[#0f0f10]/10 flex items-center justify-center border border-[#0f0f10]/20">
              <User className="w-3 h-3 text-[#0f0f10]" />
            </div>
          )}
          <span className="font-medium text-[11px] truncate max-w-[90px]">
            {user.name.split(" ")[0]}
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 border border-[#0f0f10]/15 bg-white shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-1 font-mono">
            <div className="px-2 py-1.5 border-b border-[#0f0f10]/10 mb-1">
              <p className="font-sans font-medium text-xs text-[#0f0f10] truncate">
                {user.name}
              </p>
              <p className="font-mono text-[10px] text-[#0f0f10]/50 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors font-mono"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="google-auth-wrapper">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            try {
              const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
              setUser({
                name: decoded.name || "Guest",
                email: decoded.email || "",
                picture: decoded.picture || "",
                sub: decoded.sub || "",
                idToken: credentialResponse.credential,
              });
            } catch {
              // invalid token
            }
          }
        }}
        onError={() => {
          console.error("Google sign-in failed");
        }}
        type="standard"
        theme="outline"
        size="small"
        text="signin"
        shape="rectangular"
      />
    </div>
  );
}
