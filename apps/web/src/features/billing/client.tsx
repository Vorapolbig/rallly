"use client";

import type { ButtonProps } from "@rallly/ui/button";
import { Button } from "@rallly/ui/button";
import React from "react";

interface BillingContextType {
  tier: "pro";
  isFree: false;
  showPayWall: () => void;
}

const BillingContext = React.createContext<BillingContextType | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const showPayWall = React.useCallback(() => {
    // No-op: billing is disabled with CF Access - all users are pro
  }, []);

  const contextValue = React.useMemo(
    () => ({
      tier: "pro" as const,
      isFree: false as const,
      showPayWall,
    }),
    [showPayWall],
  );

  return (
    <BillingContext.Provider value={contextValue}>
      {children}
    </BillingContext.Provider>
  );
}

const defaultBillingValue: BillingContextType = {
  tier: "pro",
  isFree: false,
  showPayWall: () => {},
};

export function useBilling() {
  const context = React.useContext(BillingContext);
  // Return default values if not wrapped in BillingProvider (billing is disabled)
  return context ?? defaultBillingValue;
}

export const PayWallButton = ({ onClick, ...forwardedProps }: ButtonProps) => {
  return <Button onClick={onClick} {...forwardedProps} />;
};
