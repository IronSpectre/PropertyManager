import { TopNav } from "@/components/layout/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
