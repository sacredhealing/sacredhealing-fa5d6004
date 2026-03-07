import React, { Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { setNavigator } from "@/utils/navigation";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SHCProvider } from "@/contexts/SHCContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { GitaTransitionOverlay } from "@/components/dashboard/GitaTransitionOverlay";
import { AmbientAudioProvider } from "@/contexts/AmbientAudioContext";
import { ResonanceProvider } from '@/components/resonance/UniversalResonanceEngine';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AuthOnlyRoute } from "./components/layout/AuthOnlyRoute";
import { DebugBanner } from "./components/DebugBanner";
import { ProfileLanguageSync } from "./components/ProfileLanguageSync";
import "@/lib/performance"; // Initialize performance monitoring

// Lazy-loaded page components
const Landing = React.lazy(() => import("./pages/Landing"));
const About = React.lazy(() => import("./pages/About"));
const Auth = React.lazy(() => import("./pages/Auth"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const Home = React.lazy(() => import("./pages/Home"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Meditations = React.lazy(() => import("./pages/Meditations"));
const Courses = React.lazy(() => import("./pages/Courses"));
const CourseDetail = React.lazy(() => import("./pages/CourseDetail"));
const Music = React.lazy(() => import("./pages/Music"));
const TrackDetail = React.lazy(() => import("./pages/TrackDetail"));
const ArtistProfile = React.lazy(() => import("./pages/ArtistProfile"));
const Mastering = React.lazy(() => import("./pages/Mastering"));
const Wallet = React.lazy(() => import("./pages/Wallet"));
const Profile = React.lazy(() => import("./pages/Profile"));
const AtmaSeed = React.lazy(() => import("./pages/AtmaSeed"));
const SiddhaQuantum = React.lazy(() => import("./pages/SiddhaQuantum"));
const Legal = React.lazy(() => import("./pages/Legal"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Admin = React.lazy(() => import("./pages/Admin"));
const AdminMeditationEdit = React.lazy(() => import("./pages/AdminMeditationEdit"));
const AdminMusic = React.lazy(() => import("./pages/AdminMusic"));
const AdminHealing = React.lazy(() => import("./pages/AdminHealing"));
const AdminHealingEdit = React.lazy(() => import("./pages/AdminHealingEdit"));
const AdminContent = React.lazy(() => import("./pages/AdminContent"));
const AdminCourses = React.lazy(() => import("./pages/AdminCourses"));
const AdminAnnouncements = React.lazy(() => import("./pages/AdminAnnouncements"));
const AdminIncomeStreams = React.lazy(() => import("./pages/AdminIncomeStreams"));
const AdminYouTube = React.lazy(() => import("./pages/AdminYouTube"));
const Healing = React.lazy(() => import("./pages/Healing"));
const MySacredFlame = React.lazy(() => import("./pages/healing/MySacredFlame"));
const Breathing = React.lazy(() => import("./pages/Breathing"));
const IncomeStreams = React.lazy(() => import("./pages/IncomeStreams"));
const SpiritualEducation = React.lazy(() => import("./pages/SpiritualEducation"));
const Community = React.lazy(() => import("./pages/Community"));
const PrivateSessions = React.lazy(() => import("./pages/PrivateSessions"));
const Membership = React.lazy(() => import("./pages/Membership"));
const Shop = React.lazy(() => import("./pages/Shop"));
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"));
const Transformation = React.lazy(() => import("./pages/Transformation"));
const AdminMantras = React.lazy(() => import("./pages/AdminMantras"));
const AdminShop = React.lazy(() => import("./pages/AdminShop"));
const AdminPrivateSessions = React.lazy(() => import("./pages/AdminPrivateSessions"));
const AdminTransformation = React.lazy(() => import("./pages/AdminTransformation"));
const AdminEmailList = React.lazy(() => import("./pages/AdminEmailList"));
const AdminSendEmail = React.lazy(() => import("./pages/AdminSendEmail"));
const StargateMembership = React.lazy(() => import("./pages/StargateMembership"));
const PractitionerCertification = React.lazy(() => import("./pages/PractitionerCertification"));
const Leaderboard = React.lazy(() => import("./pages/Leaderboard"));
const AffirmationSoundtrack = React.lazy(() => import("./pages/AffirmationSoundtrack"));
const AffirmationSuccess = React.lazy(() => import("./pages/AffirmationSuccess"));
const PregnancyProgram = React.lazy(() => import("./pages/PregnancyProgram"));
const Install = React.lazy(() => import("./pages/Install"));
const SpiritualTransformation = React.lazy(() => import("./pages/SpiritualTransformation"));
const Podcast = React.lazy(() => import("./pages/Podcast"));
const LiveRecordings = React.lazy(() => import("./pages/LiveRecordings"));
const LiveEvents = React.lazy(() => import("./pages/LiveEvents"));
const Challenges = React.lazy(() => import("./pages/Challenges"));
const AIIncomeEngine = React.lazy(() => import("./pages/AIIncomeEngine"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AffiliateDetail = React.lazy(() => import("./pages/income-streams/AffiliateDetail"));
const SHCCoinDetail = React.lazy(() => import("./pages/income-streams/SHCCoinDetail"));
const CopyTradingDetail = React.lazy(() => import("./pages/income-streams/CopyTradingDetail"));
const BitcoinMiningDetail = React.lazy(() => import("./pages/income-streams/BitcoinMiningDetail"));
const AIIncomeDetail = React.lazy(() => import("./pages/income-streams/AIIncomeDetail"));
const EducationDetail = React.lazy(() => import("./pages/income-streams/EducationDetail"));
const PolymarketBotDetail = React.lazy(() => import("./pages/income-streams/PolymarketBotDetail"));
const AdminSystem = React.lazy(() => import("./pages/AdminSystem"));
const AdminGrantAccess = React.lazy(() => import("./pages/AdminGrantAccess"));
const AdminBreathing = React.lazy(() => import("./pages/AdminBreathing"));
const AdminAmbientSounds = React.lazy(() => import("./pages/AdminAmbientSounds"));
const AdminAffirmation = React.lazy(() => import("./pages/AdminAffirmation"));
const AdminMusicAnalytics = React.lazy(() => import("./pages/AdminMusicAnalytics"));
const AdminAnalytics = React.lazy(() => import("./pages/AdminAnalytics"));
const LibraryAbundance = React.lazy(() => import("./pages/LibraryAbundance"));
const Explore = React.lazy(() => import("./pages/Explore"));
const SacredSpace = React.lazy(() => import("./pages/SacredSpace"));
const Mantras = React.lazy(() => import("./pages/Mantras"));
const MantraPage = React.lazy(() => import("./pages/MantraPage"));
const ExplorePage = React.lazy(() => import("./pages/ExplorePage"));
const Onboarding = React.lazy(() => import("./pages/Onboarding"));
const SpiritualPaths = React.lazy(() => import("./pages/SpiritualPaths"));
const PathDetail = React.lazy(() => import("./pages/PathDetail"));
const DailyRitual = React.lazy(() => import("./pages/DailyRitual"));
const Journal = React.lazy(() => import("./pages/Journal"));
const MeditationJournal = React.lazy(() => import("./pages/MeditationJournal"));
const AdminPaths = React.lazy(() => import("./pages/AdminPaths"));
const AdminCircles = React.lazy(() => import("./pages/AdminCircles"));
const AdminContentRoadmap = React.lazy(() => import("./pages/AdminContentRoadmap"));
const AdminVedicTranslation = React.lazy(() => import("./pages/AdminVedicTranslation"));
const AdminScripturalBooks = React.lazy(() => import("./pages/AdminScripturalBooks"));
const AdminScripturalBookView = React.lazy(() => import("./pages/AdminScripturalBookView"));
const PostSession = React.lazy(() => import("./pages/PostSession"));
const CreativeSoulSales = React.lazy(() => import("./pages/CreativeSoulSales"));
const CreativeSoulTool = React.lazy(() => import("./pages/CreativeSoulTool"));
const CreativeSoulLanding = React.lazy(() => import("./pages/CreativeSoulLanding"));
const CreativeSoulHub = React.lazy(() => import("./pages/CreativeSoulHub"));
const CreativeSoulMeditationTool = React.lazy(() => import("./pages/CreativeSoulMeditationTool"));
const CreativeSoulStore = React.lazy(() => import("./pages/CreativeSoulStore"));
const InviteFriends = React.lazy(() => import("./pages/InviteFriends"));
const VedicAstrology = React.lazy(() => import("./pages/VedicAstrology"));
const Ayurveda = React.lazy(() => import("./pages/Ayurveda"));
const Vastu = React.lazy(() => import("./pages/Vastu"));
const PromptLibrary = React.lazy(() => import("./pages/PromptLibrary"));
const HandAnalyzer = React.lazy(() => import("./pages/HandAnalyzer"));
const AkashicRecords = React.lazy(() => import("./pages/AkashicRecords"));
const AkashicReadingInitiating = React.lazy(() => import("./pages/AkashicReadingInitiating"));
const AkashicReadingFull = React.lazy(() => import("./pages/AkashicReadingFull"));
const QuantumApothecary = React.lazy(() => import("./pages/QuantumApothecary"));
const SriYantraShield = React.lazy(() => import("./pages/SriYantraShield"));
const TempleHome = React.lazy(() => import("./pages/TempleHome"));
const DigitalNadi = React.lazy(() => import("./pages/DigitalNadi"));
const VayuProtocol = React.lazy(() => import("./pages/VayuProtocol"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
    <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" aria-hidden />
  </div>
);

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);
  useEffect(() => {
    const ref = new URLSearchParams(location.search).get("ref");
    if (ref) {
      try {
        sessionStorage.setItem("affiliate_ref", ref);
      } catch {}
    }
  }, [location.search]);
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<AuthOnlyRoute />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>
      <Route path="/integrate" element={<PostSession />} />
      <Route element={<ProtectedRoute />}>
                  <Route path="/hand-analyzer" element={<HandAnalyzer />} />
                  <Route path="/sacred-space" element={<SacredSpace />} />
                  <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
                  <Route path="/explore-frequencies" element={<ExplorePage />} />
                  <Route path="/meditations" element={<Meditations />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/:id" element={<CourseDetail />} />
                  <Route path="/music" element={<Music />} />
                  <Route path="/music/track/:trackId" element={<TrackDetail />} />
                  <Route path="/music/artist/:artistId" element={<ArtistProfile />} />
                  <Route path="/mastering" element={<Mastering />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/atma-seed" element={<AtmaSeed />} />
                  <Route path="/siddha-quantum" element={<SiddhaQuantum />} />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/healing" element={<Healing />} />
                  <Route path="/healing/my-sacred-flame" element={<MySacredFlame />} />
                  <Route path="/breathing" element={<Breathing />} />
                  <Route path="/library/abundance" element={<LibraryAbundance />} />
                  <Route path="/income-streams" element={<IncomeStreams />} />
                  <Route path="/income-streams/affiliate" element={<AffiliateDetail />} />
                  <Route path="/income-streams/shc-coin" element={<SHCCoinDetail />} />
                  <Route path="/income-streams/copy-trading" element={<CopyTradingDetail />} />
                  <Route path="/income-streams/bitcoin-mining" element={<BitcoinMiningDetail />} />
                  <Route path="/income-streams/ai-income" element={<AIIncomeDetail />} />
                  <Route path="/income-streams/education" element={<EducationDetail />} />
                  <Route path="/income-streams/polymarket-bot" element={<PolymarketBotDetail />} />
                  <Route path="/spiritual-education" element={<SpiritualEducation />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/private-sessions" element={<PrivateSessions />} />
                  <Route path="/membership" element={<Membership />} />
                  <Route path="/mantras" element={<Mantras />} />
                  <Route path="/mantra-ritual" element={<MantraPage />} />
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
                  <Route path="/live-events" element={<LiveEvents />} />
                  <Route path="/challenges" element={<Challenges />} />
                  <Route path="/ai-income" element={<AIIncomeEngine />} />
                  <Route path="/paths" element={<SpiritualPaths />} />
                  <Route path="/paths/:slug" element={<PathDetail />} />
                  <Route path="/ritual" element={<DailyRitual />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/meditation-journal" element={<MeditationJournal />} />
                  <Route path="/invite-friends" element={<InviteFriends />} />
                  <Route path="/vedic-astrology" element={<VedicAstrology />} />
                  <Route path="/akashic-records" element={<AkashicRecords />} />
                  <Route path="/akashic-reading/initiating" element={<AkashicReadingInitiating />} />
                  <Route path="/akashic-reading/full" element={<AkashicReadingFull />} />
                  <Route path="/ayurveda" element={<Ayurveda />} />
                  <Route path="/vastu" element={<Vastu />} />
                  <Route path="/quantum-apothecary" element={<QuantumApothecary />} />
                  <Route path="/sri-yantra-shield" element={<SriYantraShield />} />
                  <Route path="/temple-home" element={<TempleHome />} />
                  <Route path="/digital-nadi" element={<DigitalNadi />} />
                  <Route path="/vayu-protocol" element={<VayuProtocol />} />
                  <Route path="/prompt-library" element={<PromptLibrary />} />
                  <Route path="/creative-soul" element={<Navigate to="/creative-soul/store" replace />} />
                  <Route path="/creative-soul-hub" element={<CreativeSoulHub />} />
                  {/* ROUTE DEFINITION: /creative-soul/store renders CreativeSoulStore.tsx */}
                  <Route path="/creative-soul/store" element={<CreativeSoulStore />} />
                  <Route path="/creative-soul/tool" element={<CreativeSoulTool />} />
                  <Route path="/creative-soul/meditation" element={<CreativeSoulMeditationTool />} />
                  {/* Legacy routes */}
                  <Route path="/creative-soul-tool" element={<CreativeSoulTool />} />
                  <Route path="/creative-soul-meditation-tool" element={<CreativeSoulMeditationTool />} />
                </Route>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/grant-access" element={<AdminGrantAccess />} />
                  <Route path="/admin/meditations" element={<Admin />} />
                  <Route path="/admin/meditations/:id" element={<AdminMeditationEdit />} />
                  <Route path="/admin/music" element={<AdminMusic />} />
                  <Route path="/admin/healing" element={<AdminHealing />} />
                  <Route path="/admin/healing/:id" element={<AdminHealingEdit />} />
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
                  <Route path="/admin/send-email" element={<AdminSendEmail />} />
                  <Route path="/admin/system" element={<AdminSystem />} />
                  <Route path="/admin/breathing" element={<AdminBreathing />} />
                  <Route path="/admin/ambient-sounds" element={<AdminAmbientSounds />} />
                  <Route path="/admin/affirmation" element={<AdminAffirmation />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/paths" element={<AdminPaths />} />
                  <Route path="/admin/circles" element={<AdminCircles />} />
                  <Route path="/admin/music-analytics" element={<AdminMusicAnalytics />} />
                  <Route path="/admin/content-roadmap" element={<AdminContentRoadmap />} />
                  <Route path="/admin/vedic-translation" element={<AdminVedicTranslation />} />
                  <Route path="/admin/books" element={<AdminScripturalBooks />} />
                  <Route path="/admin/books/:id" element={<AdminScripturalBookView />} />
                </Route>
              </Route>
                <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SHCProvider>
          <MusicPlayerProvider>
            <GitaTransitionOverlay />
            <AmbientAudioProvider>
              <Toaster />
              <Sonner />
              <DebugBanner />
              <ProfileLanguageSync />
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-[#030303]" style={{ background: "radial-gradient(ellipse at 15% 20%, rgba(30, 27, 75, 0.7) 0%, transparent 50%), #030303" }}>
                    <Loader2 className="w-10 h-10 animate-spin text-[#00F2FE]" />
                  </div>
                }
              >
              <ResonanceProvider userEmail="sacredhealingvibe@gmail.com">
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </ResonanceProvider>
              </Suspense>
            </AmbientAudioProvider>
          </MusicPlayerProvider>
        </SHCProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
