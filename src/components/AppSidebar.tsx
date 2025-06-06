import { Home, Users, Settings, Plus, Calendar, Map, Package, CreditCard, BarChart3, Sparkles, FileText, Monitor, Calculator } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
const navigationItems = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: BarChart3
}, {
  title: "Pedidos",
  url: "/orders",
  icon: Calendar
}, {
  title: "Monitoramento",
  url: "/monitoring",
  icon: Monitor
}, {
  title: "Extrato de Pedidos",
  url: "/orders-extract",
  icon: FileText
}, {
  title: "Financeiro",
  url: "/financial",
  icon: Calculator
}, {
  title: "Clientes",
  url: "/customers",
  icon: Users
}];
const managementItems = [{
  title: "Itens",
  url: "/items",
  icon: Plus
}, {
  title: "Produtos",
  url: "/products",
  icon: Package
}, {
  title: "Bairros",
  url: "/neighborhoods",
  icon: Map
}, {
  title: "Pagamentos",
  url: "/payments",
  icon: CreditCard
}];
export function AppSidebar() {
  const location = useLocation();
  return <Sidebar className="border-r border-purple-200/50 bg-white/95 backdrop-blur-xl">
      <SidebarHeader className="p-6 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg neon-glow">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">PDelivery</h2>
            <p className="text-sm text-purple-500 font-medium">Sistema Premium</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url} className="w-full mb-2 hover:bg-purple-50 hover:text-purple-700 data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-500 data-[active=true]:to-violet-600 data-[active=true]:text-white data-[active=true]:shadow-lg rounded-xl transition-all duration-300">
                    <Link to={item.url} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Cadastros
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url} className="w-full mb-2 hover:bg-purple-50 hover:text-purple-700 data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-500 data-[active=true]:to-violet-600 data-[active=true]:text-white data-[active=true]:shadow-lg rounded-xl transition-all duration-300">
                    <Link to={item.url} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-purple-100">
        <div className="text-xs text-purple-400 text-center font-medium">
          © 2024 AçaíPDV Premium
        </div>
      </SidebarFooter>
    </Sidebar>;
}