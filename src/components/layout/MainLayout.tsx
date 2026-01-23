import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export function MainLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        {/* Signature moment: a gentle brand field behind the app */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-mango-field bg-[length:200%_200%] opacity-70 motion-reduce:animate-none md:animate-mango-pan" />

        <div className="flex min-h-screen w-full">
          <Sidebar />

          <div className="flex min-h-screen w-full flex-1 flex-col">
            <Header />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
