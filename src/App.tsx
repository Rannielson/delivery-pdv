
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import OrdersExtract from "./pages/OrdersExtract";
import Customers from "./pages/Customers";
import Neighborhoods from "./pages/Neighborhoods";
import Payments from "./pages/Payments";
import Monitoring from "./pages/Monitoring";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/items" element={<Items />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders-extract" element={<OrdersExtract />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/neighborhoods" element={<Neighborhoods />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
