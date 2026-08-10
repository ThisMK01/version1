"use client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark text-[#dee2f3] bg-[#0e131f] min-h-screen flex flex-col">
      {children}
    </div>
  );
}
