"use client";

import type { DialogProps } from "@rallly/ui/dialog";
import { Dialog } from "@rallly/ui/dialog";

interface ManageSeatsButtonProps {
  currentSeats: number;
  usedSeats: number;
}

/**
 * Manage seats dialog stub - billing is disabled in CF Access deployment.
 */
export function ManageSeatsDialog({
  onOpenChange,
  open,
  children,
}: DialogProps & ManageSeatsButtonProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}
