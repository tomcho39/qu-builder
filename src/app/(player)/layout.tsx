import Link from "next/link";
import { Zap } from "lucide-react";

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-3 flex items-center">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold">
          <Zap className="h-4 w-4" />
          qu-builder
        </Link>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
