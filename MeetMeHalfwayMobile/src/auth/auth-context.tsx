import React, { createContext, useContext } from "react";

export const ClerkActiveContext = createContext(false);

export type SafeAuthValue = {
  isSignedIn: boolean;
  isLoaded: boolean;
  getToken: () => Promise<string | null>;
  signOut: () => void;
};

export const SafeAuthContext = createContext<SafeAuthValue>({
  isSignedIn: false,
  isLoaded: true,
  getToken: async () => null,
  signOut: () => {},
});

export function useSafeAuth() {
  return useContext(SafeAuthContext);
}
