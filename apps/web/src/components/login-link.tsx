import type { LinkProps } from "next/link";
import Link from "next/link";
import React from "react";

export const LoginLink = React.forwardRef<
  HTMLAnchorElement,
  React.PropsWithChildren<Omit<LinkProps, "href"> & { className?: string }>
>(function LoginLink({ children, ...props }, ref) {
  return (
    <Link ref={ref} {...props} href="/cdn-cgi/access/login">
      {children}
    </Link>
  );
});
