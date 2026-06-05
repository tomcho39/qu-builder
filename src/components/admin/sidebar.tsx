"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, Settings, LogOut, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/admin/tests", label: "테스트 관리", icon: LayoutList },
  { href: "/admin/settings", label: "조직 설정", icon: Settings },
];

type Props = {
  email: string;
};

export function AdminSidebar({ email }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 border-r bg-card flex flex-col">
      {/* 로고 */}
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">qu-builder</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* 유저 정보 + 로그아웃 */}
      <div className="border-t px-4 py-3 space-y-1">
        <p className="text-xs text-muted-foreground truncate">{email}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
