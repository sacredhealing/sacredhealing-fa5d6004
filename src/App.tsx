import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Meditations from "./pages/Meditations";
import Courses from "./pages/Courses";
import Music from "./pages/Music";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Admin from "./pages/Admin";
import AdminMusic from "./pages/AdminMusic";
import AdminHealing from "./pages/AdminHealing";
import AdminContent from "./pages/AdminContent";
import AdminCourses from "./pages/AdminCourses";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminIncomeStreams from "./pages/AdminIncomeStreams";
import Healing from "./pages/Healing";
import Promote from "./pages/Promote";
import IncomeStreams from "./pages/IncomeStreams";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/meditations" element={<Meditations />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/music" element={<Music />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/healing" element={<Healing />} />
              <Route path="/promote" element={<Promote />} />
              <Route path="/income-streams" element={<IncomeStreams />} />
            </Route>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/meditations" element={<Admin />} />
            <Route path="/admin/music" element={<AdminMusic />} />
            <Route path="/admin/healing" element={<AdminHealing />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/income-streams" element={<AdminIncomeStreams />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
