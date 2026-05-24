import { useAuth } from "@clerk/clerk-expo";
import React, { createContext, useContext } from "react";

export const ClerkActiveContext = createContext(false);

export type SafeAuthValue = {
  isSignedIn: boolean;
  isLoaded: boolean;
  getToken: () => Promise<string | null>;
  signOut: () => void;
};

const SafeAuthContext = createContext<SafeAuthValue>({
  isSignedIn: false,
  isLoaded: true,
  getToken: async () => null,
  signOut: () => {},
});

export function useSafeAuth() {
  return useContext(SafeAuthContext);
}

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
