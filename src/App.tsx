import { Toaster } from "@/components/ui/toaster";
import About from "./pages/About";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SHCProvider } from "@/contexts/SHCContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Meditations from "./pages/Meditations";
import Courses from "./pages/Courses";
import Music from "./pages/Music";
import Mastering from "./pages/Mastering";
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
import AdminYouTube from "./pages/AdminYouTube";
import Healing from "./pages/Healing";
import Promote from "./pages/Promote";
import IncomeStreams from "./pages/IncomeStreams";
import SpiritualEducation from "./pages/SpiritualEducation";
import Community from "./pages/Community";
import PrivateSessions from "./pages/PrivateSessions";
import Membership from "./pages/Membership";
import Mantras from "./pages/Mantras";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Transformation from "./pages/Transformation";
import AdminMantras from "./pages/AdminMantras";
import AdminShop from "./pages/AdminShop";
import AdminPrivateSessions from "./pages/AdminPrivateSessions";
import AdminTransformation from "./pages/AdminTransformation";
import AdminEmailList from "./pages/AdminEmailList";
import StargateMembership from "./pages/StargateMembership";
import PractitionerCertification from "./pages/PractitionerCertification";
import Leaderboard from "./pages/Leaderboard";
import AffirmationSoundtrack from "./pages/AffirmationSoundtrack";
import AffirmationSuccess from "./pages/AffirmationSuccess";
import PregnancyProgram from "./pages/PregnancyProgram";
import Install from "./pages/Install";
import SpiritualTransformation from "./pages/SpiritualTransformation";
import Podcast from "./pages/Podcast";
import LiveRecordings from "./pages/LiveRecordings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SHCProvider>
        <MusicPlayerProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/meditations" element={<Meditations />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/music" element={<Music />} />
                <Route path="/mastering" element={<Mastering />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/healing" element={<Healing />} />
                <Route path="/promote" element={<Promote />} />
                <Route path="/income-streams" element={<IncomeStreams />} />
                <Route path="/spiritual-education" element={<SpiritualEducation />} />
                <Route path="/community" element={<Community />} />
                <Route path="/private-sessions" element={<PrivateSessions />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/mantras" element={<Mantras />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:id" element={<ProductDetail />} />
                <Route path="/transformation" element={<Transformation />} />
                <Route path="/stargate" element={<StargateMembership />} />
                <Route path="/certification" element={<PractitionerCertification />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/affirmation-soundtrack" element={<AffirmationSoundtrack />} />
                <Route path="/affirmation-success" element={<AffirmationSuccess />} />
                <Route path="/pregnancy-program" element={<PregnancyProgram />} />
                <Route path="/install" element={<Install />} />
                <Route path="/spiritual-transformation" element={<SpiritualTransformation />} />
                <Route path="/podcast" element={<Podcast />} />
                <Route path="/live-recordings" element={<LiveRecordings />} />
              </Route>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/meditations" element={<Admin />} />
              <Route path="/admin/music" element={<AdminMusic />} />
              <Route path="/admin/healing" element={<AdminHealing />} />
              <Route path="/admin/content" element={<AdminContent />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/income-streams" element={<AdminIncomeStreams />} />
              <Route path="/admin/youtube" element={<AdminYouTube />} />
              <Route path="/admin/mantras" element={<AdminMantras />} />
              <Route path="/admin/shop" element={<AdminShop />} />
              <Route path="/admin/private-sessions" element={<AdminPrivateSessions />} />
              <Route path="/admin/transformation" element={<AdminTransformation />} />
              <Route path="/admin/email-list" element={<AdminEmailList />} />
            </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </MusicPlayerProvider>
      </SHCProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
