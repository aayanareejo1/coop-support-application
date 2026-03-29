import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import CoordinatorReports from "./pages/CoordinatorReports";
import CoordinatorEvaluations from "./pages/CoordinatorEvaluations";
import CoordinatorOverview from "./pages/CoordinatorOverview";
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
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/reports"
              element={
                <ProtectedRoute allowedRoles={["coordinator", "admin"]}>
                  <CoordinatorReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/evaluations"
              element={
                <ProtectedRoute allowedRoles={["coordinator", "admin"]}>
                  <CoordinatorEvaluations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/overview"
              element={
                <ProtectedRoute allowedRoles={["coordinator", "admin"]}>
                  <CoordinatorOverview />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
