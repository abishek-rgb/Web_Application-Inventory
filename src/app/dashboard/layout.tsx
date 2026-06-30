import Sidebar from "@/components/layout/Sidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const isSuperAdmin = session.user?.role === "SUPER_ADMIN";

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-bg relative">
      {/* Subtle global background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] animate-pulse-slow pointer-events-none" />
      
      <Sidebar />
      <MobileSidebar isSuperAdmin={isSuperAdmin} user={session.user} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in relative z-10 w-full">
        <div className="max-w-7xl mx-auto h-full animate-slide-up">
          {children}
        </div>
      </main>
    </div>
  );
}
