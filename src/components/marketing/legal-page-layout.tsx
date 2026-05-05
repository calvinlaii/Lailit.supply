import type { ReactNode } from "react";

type LegalPageLayoutProps = {
  children: ReactNode;
};

export function LegalPageLayout({ children }: LegalPageLayoutProps) {
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
      <div className="max-w-[720px] mx-auto">
        {children}
      </div>
    </div>
  );
}
