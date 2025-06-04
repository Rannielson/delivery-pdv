
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-white via-purple-50 to-violet-100">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="bg-white/90 backdrop-blur-xl border-b border-purple-200/50 px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg p-2 transition-all" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    AçaíPDV
                  </h1>
                  <p className="text-sm text-gray-500">Sistema de Gestão Premium</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Buscar..." 
                    className="pl-10 w-64 bg-white/70 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>
                <Button variant="ghost" size="icon" className="relative hover:bg-purple-50 rounded-full">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-purple-50 rounded-full">
                  <User className="w-5 h-5 text-purple-600" />
                </Button>
              </div>
            </div>
          </header>
          
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
