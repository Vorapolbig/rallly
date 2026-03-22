"use client";

/**
 * PayWallDialog stub - billing is disabled with CF Access.
 * All users have full access, so no paywall is needed.
 */
export function PayWallDialog({
  isOpen: _isOpen,
  onOpenChange: _onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return null;
}
