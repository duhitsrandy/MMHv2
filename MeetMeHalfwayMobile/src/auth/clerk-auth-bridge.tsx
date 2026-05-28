import { useAuth } from "@clerk/clerk-expo";
import React from "react";

import { SafeAuthContext, type SafeAuthValue } from "./auth-context";

export function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const value: SafeAuthValue = {
    isSignedIn: !!isSignedIn,
    isLoaded: !!isLoaded,
    getToken: getToken ?? (async () => null),
    signOut: signOut ?? (() => {}),
  };
  return <SafeAuthContext.Provider value={value}>{children}</SafeAuthContext.Provider>;
}
