import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import ProductosPage from "./pages/ProductosPage";
import CombosPage from "./pages/CombosPage";
import InventarioPage from "./pages/InventarioPage";
import DeliveryPage from "./pages/DeliveryPage";
import CajaPage from "./pages/CajaPage";
import TicketsPage from "./pages/TicketsPage";
import ReportesPage from "./pages/ReportesPage";
import UsuariosPage from "./pages/UsuariosPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import LoginPage from "./pages/LoginPage";
 import AjustesPage from "./pages/AjustesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/productos" element={<ProtectedRoute><ProductosPage /></ProtectedRoute>} />
            <Route path="/combos" element={<ProtectedRoute><CombosPage /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
            <Route path="/delivery" element={<ProtectedRoute><DeliveryPage /></ProtectedRoute>} />
            <Route path="/caja" element={<ProtectedRoute><CajaPage /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute><ReportesPage /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute requireAdmin><UsuariosPage /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute requireAdmin><ConfiguracionPage /></ProtectedRoute>} />
             <Route path="/ajustes" element={<ProtectedRoute><AjustesPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;