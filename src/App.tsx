
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
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
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<Index />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout><Dashboard /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <ProtectedRoute>
                  <DashboardLayout><Products /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <DashboardLayout><Orders /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute>
                  <DashboardLayout><Customers /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/neighborhoods" 
              element={
                <ProtectedRoute>
                  <DashboardLayout><Neighborhoods /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payments" 
              element={
                <ProtectedRoute>
                  <DashboardLayout><Payments /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/items" 
              element={
                <ProtectedRoute>
                  <DashboardLayout><Items /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/monitoring" 
              element={
                <ProtectedRoute subscriptionRequired="pro">
                  <DashboardLayout><Monitoring /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders-extract" 
              element={
                <ProtectedRoute>
                  <DashboardLayout><OrdersExtract /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/financial" 
              element={
                <ProtectedRoute>
                  <DashboardLayout><Financial /></DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
