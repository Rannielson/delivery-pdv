
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Orders from "@/pages/Orders";
import Customers from "@/pages/Customers";
import Neighborhoods from "@/pages/Neighborhoods";
import Payments from "@/pages/Payments";
import Items from "@/pages/Items";
import Monitoring from "@/pages/Monitoring";
import OrdersExtract from "@/pages/OrdersExtract";
import Financial from "@/pages/Financial";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/products" element={<DashboardLayout><Products /></DashboardLayout>} />
          <Route path="/orders" element={<DashboardLayout><Orders /></DashboardLayout>} />
          <Route path="/customers" element={<DashboardLayout><Customers /></DashboardLayout>} />
          <Route path="/neighborhoods" element={<DashboardLayout><Neighborhoods /></DashboardLayout>} />
          <Route path="/payments" element={<DashboardLayout><Payments /></DashboardLayout>} />
          <Route path="/items" element={<DashboardLayout><Items /></DashboardLayout>} />
          <Route path="/monitoring" element={<DashboardLayout><Monitoring /></DashboardLayout>} />
          <Route path="/orders-extract" element={<DashboardLayout><OrdersExtract /></DashboardLayout>} />
          <Route path="/financial" element={<DashboardLayout><Financial /></DashboardLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
