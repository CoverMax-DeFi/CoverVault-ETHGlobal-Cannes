
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";

// Import pages directly
import Index from "./pages/Index";


const AppProviders: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
  <TooltipProvider>
      {children}
  </TooltipProvider>
));

const App: React.FC = () => {
  return (
    <AppProviders>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
