import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Admin from "./pages/Admin";
import Partners from "./pages/Partners";
import PremiumCheckout from "./pages/PremiumCheckout";
import PaymentTest from "./pages/PaymentTest";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Messages from "./pages/Messages";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import FreelancerProfile from "./pages/FreelancerProfile";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import JobDetail from "./pages/JobDetail";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import CreateService from "./pages/CreateService";
import Analytics from "./pages/Analytics";
import HelpCenter from "./pages/HelpCenter";
import Disputes from "./pages/Disputes";
import Saved from "./pages/Saved";
import FloatingChatButton from "./components/chat/FloatingChatButton";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/partners" element={<Partners />} />
      <Route path="/search" element={<Search />} />
      <Route path="/freelancer/:id" element={<FreelancerProfile />} />
      <Route path="/job/:id" element={<JobDetail />} />
      <Route path="/services" element={<Services />} />
      <Route path="/services/new" element={<ProtectedRoute><CreateService /></ProtectedRoute>} />
      <Route path="/services/:id" element={<ServiceDetail />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/project/:id" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
      <Route path="/disputes" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
      <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/premium/checkout" element={<ProtectedRoute><PremiumCheckout /></ProtectedRoute>} />
      <Route path="/payment-test" element={<ProtectedRoute><PaymentTest /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider delayDuration={0}>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <AppRoutes />
              <FloatingChatButtonWrapper />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

const FloatingChatButtonWrapper = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading || !user || location.pathname === "/messages") return null;

  return <FloatingChatButton userId={user.id} />;
};

export default App;


