import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Calendar from "./pages/calendar/index";
import Control from "./pages/Control";
import { Users } from "./pages/Users";
import Matches from "./pages/Matches";
import { Tournaments } from "./pages/Tournaments";
import { ControlQuinielas } from "./pages/ControlQuinielas";
import Plans from "./pages/Plans";
import ViewQuiniela from "./pages/ViewQuiniela";
import Landing from "./pages/Landing";
import CronJobs from "./pages/CronJobs";
import StyleGuide from "./pages/StyleGuide";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/control" element={<Control />} />
            <Route path="/control/users" element={<Users />} />
            <Route path="/control/tournaments" element={<Tournaments />} />
            <Route path="/control/matches" element={<Matches />} />
            <Route path="/control/quinielas" element={<ControlQuinielas />} />
            <Route path="/control/cron" element={<CronJobs />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/quiniela/:id" element={<ViewQuiniela />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/style-guide" element={<StyleGuide />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
