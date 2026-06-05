import Link from "next/link";
import { Zap } from "lucide-react";
import { headers } from "next/headers";

/** slug "brand-a" → "Brand A" */
function formatOrgName(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const orgSlug = headersList.get("x-org-slug");
  const displayName = orgSlug ? formatOrgName(orgSlug) : "qu-builder";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-3 flex items-center">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-semibold"
        >
          <Zap className="h-4 w-4" />
          {displayName}
        </Link>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
