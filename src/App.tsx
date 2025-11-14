import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import SignupRole from "./pages/SignupRole";
import SignupPatient from "./pages/SignupPatient";
import SignupHospital from "./pages/SignupHospital";
import PatientDashboard from "./pages/PatientDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import AmbulanceDashboard from "./pages/AmbulanceDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup-role" element={<SignupRole />} />
            <Route path="/signup-patient" element={<SignupPatient />} />
            <Route path="/signup-hospital" element={<SignupHospital />} />
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
            <Route path="/ambulance-dashboard" element={<AmbulanceDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
