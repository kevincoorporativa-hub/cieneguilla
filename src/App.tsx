import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/combos" element={<CombosPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/caja" element={<CajaPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;