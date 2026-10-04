import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex">
      {/* Desktop left sidebar */}
      <DesktopSidebar />

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-16 md:pb-0 md:max-w-2xl md:mx-auto lg:max-w-xl xl:max-w-2xl">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
