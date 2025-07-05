
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Context, Web3Provider } from "./context/Web3Context";
import React from "react";

// Import pages directly
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Insurance from "./pages/Insurance";
import Liquidity from "./pages/Liquidity";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const AppProviders: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
  <TooltipProvider>
    <Web3Provider>
      {children}
    </Web3Provider>
  </TooltipProvider>
));

const App: React.FC = () => {
  return (
    <AppProviders>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/liquidity" element={<Liquidity />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
