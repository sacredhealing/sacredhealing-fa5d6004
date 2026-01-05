import { Toaster } from "@/components/ui/toaster";
import About from "./pages/About";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SHCProvider } from "@/contexts/SHCContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AuthOnlyRoute } from "./components/layout/AuthOnlyRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Meditations from "./pages/Meditations";
import Courses from "./pages/Courses";
import Music from "./pages/Music";
import TrackDetail from "./pages/TrackDetail";
import ArtistProfile from "./pages/ArtistProfile";
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
import Breathing from "./pages/Breathing";
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
import AIIncomeEngine from "./pages/AIIncomeEngine";
import NotFound from "./pages/NotFound";
import AffiliateDetail from "./pages/income-streams/AffiliateDetail";
import SHCCoinDetail from "./pages/income-streams/SHCCoinDetail";
import CopyTradingDetail from "./pages/income-streams/CopyTradingDetail";
import BitcoinMiningDetail from "./pages/income-streams/BitcoinMiningDetail";
import AIIncomeDetail from "./pages/income-streams/AIIncomeDetail";
import EducationDetail from "./pages/income-streams/EducationDetail";
import AdminSystem from "./pages/AdminSystem";
import AdminBreathing from "./pages/AdminBreathing";
import AdminAffirmation from "./pages/AdminAffirmation";
import AdminMusicAnalytics from "./pages/AdminMusicAnalytics";
import AdminAnalytics from "./pages/AdminAnalytics";
import Explore from "./pages/Explore";
import Onboarding from "./pages/Onboarding";
import SpiritualPaths from "./pages/SpiritualPaths";
import PathDetail from "./pages/PathDetail";
import DailyRitual from "./pages/DailyRitual";
import Journal from "./pages/Journal";
import AdminPaths from "./pages/AdminPaths";
import AdminCircles from "./pages/AdminCircles";
import "@/lib/performance"; // Initialize performance monitoring

const App = () => (
  <ErrorBoundary>
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
              <Route element={<AuthOnlyRoute />}>
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/meditations" element={<Meditations />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/music" element={<Music />} />
                  <Route path="/music/track/:trackId" element={<TrackDetail />} />
                  <Route path="/music/artist/:artistId" element={<ArtistProfile />} />
                  <Route path="/mastering" element={<Mastering />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/healing" element={<Healing />} />
                  <Route path="/breathing" element={<Breathing />} />
                  <Route path="/income-streams" element={<IncomeStreams />} />
                  <Route path="/income-streams/affiliate" element={<AffiliateDetail />} />
                  <Route path="/income-streams/shc-coin" element={<SHCCoinDetail />} />
                  <Route path="/income-streams/copy-trading" element={<CopyTradingDetail />} />
                  <Route path="/income-streams/bitcoin-mining" element={<BitcoinMiningDetail />} />
                  <Route path="/income-streams/ai-income" element={<AIIncomeDetail />} />
                  <Route path="/income-streams/education" element={<EducationDetail />} />
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
                  <Route path="/ai-income" element={<AIIncomeEngine />} />
                  <Route path="/paths" element={<SpiritualPaths />} />
                  <Route path="/paths/:slug" element={<PathDetail />} />
                  <Route path="/ritual" element={<DailyRitual />} />
                  <Route path="/journal" element={<Journal />} />
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
                <Route path="/admin/system" element={<AdminSystem />} />
                <Route path="/admin/breathing" element={<AdminBreathing />} />
                <Route path="/admin/affirmation" element={<AdminAffirmation />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/paths" element={<AdminPaths />} />
                <Route path="/admin/circles" element={<AdminCircles />} />
                <Route path="/admin/music-analytics" element={<AdminMusicAnalytics />} />
              </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </MusicPlayerProvider>
        </SHCProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
