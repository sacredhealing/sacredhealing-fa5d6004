import React, { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { setNavigator } from "@/utils/navigation";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SHCProvider } from "@/contexts/SHCContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { ConversionProvider } from "@/components/conversion/ConversionSystem";
import { GitaTransitionOverlay } from "@/components/dashboard/GitaTransitionOverlay";
import { AmbientAudioProvider } from "@/contexts/AmbientAudioContext";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AuthOnlyRoute } from "./components/layout/AuthOnlyRoute";
import { DebugBanner } from "./components/DebugBanner";
import { ProfileLanguageSync } from "./components/ProfileLanguageSync";
import { CodexBackfillSentinel } from "./components/CodexBackfillSentinel";
import { useAuth } from "@/hooks/useAuth";
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
const PranaFlow = React.lazy(() => import("./pages/PranaFlow"));
const AkashaInfinity = React.lazy(() => import("./pages/AkashaInfinity"));
const Legal = React.lazy(() => import("./pages/Legal"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Admin = React.lazy(() => import("./pages/Admin"));
const AdminMeditations = React.lazy(() => import("./pages/AdminMeditations"));
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
const SovereignSignalOracle = React.lazy(() => import("./pages/income-streams/PolymarketBotDetail"));
const PolymarketCopyTradingInfo = React.lazy(() => import("./pages/income-streams/PolymarketCopyTradingInfo"));
const FomoCopyBot = React.lazy(() => import("./pages/income-streams/FomoCopyBot"));
const WhaleIntelligence = React.lazy(() => import("./pages/income-streams/WhaleIntelligence"));
const SQISovereignBot = React.lazy(() => import("./pages/income-streams/SQISovereignBot"));
const PredictionMarketBot = React.lazy(() => import("./pages/PredictionMarketBot"));
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
// Eager load meditation tool so it never fails from chunk load (e.g. CDN/base path issues)
import CreativeSoulMeditationTool from "./pages/CreativeSoulMeditationTool";
const CreativeSoulStore = React.lazy(() => import("./pages/CreativeSoulStore"));
const InviteFriends = React.lazy(() => import("./pages/InviteFriends"));
const VedicAstrology = React.lazy(() => import("./pages/VedicAstrology"));
const Ayurveda = React.lazy(() => import("./pages/Ayurveda"));
const AgastyarAcademy = React.lazy(() => import("./pages/AgastyarAcademy"));
const AgastyarModule = React.lazy(() => import("./pages/AgastyarModule"));
const Vastu = React.lazy(() => import("./pages/Vastu"));
const PromptLibrary = React.lazy(() => import("./pages/PromptLibrary"));
const HandAnalyzer = React.lazy(() => import("./pages/HandAnalyzer"));
const AkashicRecords = React.lazy(() => import("./pages/AkashicRecords"));
const AkashicReadingInitiating = React.lazy(() => import("./pages/AkashicReadingInitiating"));
const AkashicReadingFull = React.lazy(() => import("./pages/AkashicReadingFull"));
const AkashicCodex = React.lazy(() => import("./pages/AkashicCodex"));
const LivingPortraitCodex = React.lazy(() => import("./pages/LivingPortraitCodex"));
const Students = React.lazy(() => import("./pages/Students"));
const StudentCodex = React.lazy(() => import("./pages/StudentCodex"));
import { QuantumApothecaryGate } from "@/pages/QuantumApothecaryLanding";
const LifeBook = React.lazy(() => import("./pages/LifeBook"));
const SriYantraShield = React.lazy(() => import("./pages/SriYantraShield"));
const TempleHome = React.lazy(() => import("./pages/TempleHome"));
const DigitalNadi = React.lazy(() => import("./pages/DigitalNadi"));
const NadiScannerPage = React.lazy(() => import("./pages/NadiScannerPage"));
const SoulScan = React.lazy(() => import("./pages/SoulScan"));
const VayuProtocol = React.lazy(() => import("./pages/VayuProtocol"));
const SiddhaPortal = React.lazy(() => import("./pages/SiddhaPortal"));
// WomanCode merged into Shakti Cycle Intelligence
const AdminQuantumApothecary2045 = React.lazy(() => import("./pages/AdminQuantumApothecary2045"));
const SovereignHormonalAlchemy = React.lazy(() => import("./pages/SovereignHormonalAlchemy"));
const SiddhaPhotonicRegeneration = React.lazy(() => import("./pages/SiddhaPhotonicRegeneration"));
const SiddhaHairGrowth = React.lazy(() => import("./pages/SiddhaHairGrowth"));
const AethericHeliostat = React.lazy(() => import("./pages/AethericHeliostat"));
const AtmosphericClearanceEngine = React.lazy(() => import("./pages/AtmosphericClearanceEngine"));
const WealthBeacon = React.lazy(() => import("./pages/WealthBeacon"));
const VajraSkyBreaker = React.lazy(() => import("./pages/VajraSkyBreaker"));
const SiddhaSoundAlchemyOracle = React.lazy(() => import("./pages/SiddhaSoundAlchemyOracle"));
const SiddhaOracleAbout = React.lazy(() => import("./pages/SiddhaOracleAbout"));
const CreativeSoulAbout = React.lazy(() => import("./pages/CreativeSoulAbout"));
const ExploreAkasha = React.lazy(() => import("./pages/ExploreAkasha"));
const AdminDivineTransmissions = React.lazy(() => import("./pages/AdminDivineTransmissions"));
const SQISocialAutomation = React.lazy(() => import("./pages/SQISocialAutomation"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
    <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" aria-hidden />
  </div>
);

/** Wraps meditation tool in ErrorBoundary; shows error details so we can fix the root cause */
function MeditationToolWithBoundary() {
  const [retryKey, setRetryKey] = useState(0);
  const handleRetry = () => setRetryKey((k) => k + 1);
  return (
    <ErrorBoundary
      key={retryKey}
      fallbackRender={(error) => (
        <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "radial-gradient(ellipse at 15% 20%, rgba(30, 27, 75, 0.7) 0%, transparent 50%), #030303" }}>
          <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-4">The meditation tool failed to load. Please try again or return to the dashboard.</p>
          {/* Show error so we can fix it; user can copy/screenshot */}
          <div className="mb-6 w-full max-w-md text-left">
            <details className="rounded-lg bg-black/40 border border-white/10 overflow-hidden">
              <summary className="cursor-pointer px-4 py-2 text-sm text-amber-200/80 hover:text-amber-200">
                Error details
              </summary>
              <pre className="p-4 text-xs text-red-300/90 whitespace-pre-wrap break-words font-mono overflow-auto max-h-40">
                {error.message}
                {error.stack ? `\n\n${error.stack}` : ''}
              </pre>
            </details>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#050505] hover:opacity-90"
            >
              Try again
            </button>
            <a href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-white/5">
              Go to Dashboard
            </a>
          </div>
        </div>
      )}
    >
      <CreativeSoulMeditationTool />
    </ErrorBoundary>
  );
}

// Root route: send signed-in users directly into the app, otherwise show landing
function RootEntry() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <PageLoader />;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Landing />;
}

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
      <Route path="/" element={<RootEntry />} />
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
                  <Route path="/prana-flow" element={<PranaFlow />} />
                  <Route path="/akasha-infinity" element={<AkashaInfinity />} />
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
                  <Route path="/polymarket-bot" element={<Navigate to="/income-streams/polymarket-bot" replace />} />
                  <Route path="/prediction-market-bot" element={<PredictionMarketBot />} />
                  <Route path="/income-streams/polymarket-bot" element={<SovereignSignalOracle />} />
                  <Route path="/income-streams/polymarket-copy-trading" element={<PolymarketCopyTradingInfo />} />
                  <Route path="/income-streams/fomo-copy-bot" element={<FomoCopyBot />} />
                  <Route path="/income-streams/whale-intelligence" element={<WhaleIntelligence />} />
                  <Route path="/income-streams/sqi-sovereign-bot" element={<SQISovereignBot />} />
                  <Route path="/sqi-chat" element={<Navigate to="/quantum-apothecary" replace />} />
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
                  <Route path="/akashic-codex" element={<AkashicCodex />} />
                  <Route path="/living-portrait-codex" element={<LivingPortraitCodex />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/student-codex/:studentId" element={<StudentCodex />} />
                  <Route path="/ayurveda" element={<Ayurveda />} />
                  <Route path="/agastyar-academy" element={<AgastyarAcademy />} />
                  <Route path="/agastyar-academy/module/:id" element={<AgastyarModule />} />
                  <Route path="/vastu" element={<Vastu />} />
                  <Route path="/quantum-apothecary" element={<QuantumApothecaryGate />} />
                  <Route path="/life-book" element={<LifeBook />} />
                  <Route path="/sri-yantra-shield" element={<SriYantraShield />} />
                  <Route path="/temple-home" element={<TempleHome />} />
                  <Route path="/social-automation" element={<SQISocialAutomation />} />
                  <Route path="/digital-nadi" element={<DigitalNadi />} />
                  <Route path="/nadi-scanner" element={<NadiScannerPage />} />
                  <Route path="/soul-scan" element={<SoulScan />} />
                  <Route path="/vayu-protocol" element={<VayuProtocol />} />
                  <Route path="/siddha-portal" element={<SiddhaPortal />} />
                  <Route path="/admin-quantum-apothecary-2045" element={<AdminQuantumApothecary2045 />} />
                  <Route path="/sovereign-hormonal-alchemy" element={<SovereignHormonalAlchemy />} />
                  <Route path="/womancode" element={<Navigate to="/sovereign-hormonal-alchemy" replace />} />
                  <Route path="/siddha-photonic-regeneration" element={<SiddhaPhotonicRegeneration />} />
                  <Route path="/siddha-hair-growth" element={<SiddhaHairGrowth />} />
                  <Route path="/aetheric-heliostat" element={<AethericHeliostat />} />
                  <Route path="/atmospheric-clearance-engine" element={<AtmosphericClearanceEngine />} />
                  <Route path="/wealth-beacon" element={<WealthBeacon />} />
                  <Route path="/vajra-sky-breaker" element={<VajraSkyBreaker />} />
                  <Route path="/prompt-library" element={<PromptLibrary />} />
                  <Route path="/explore-akasha" element={<ExploreAkasha />} />
                  <Route path="/creative-soul" element={<Navigate to="/creative-soul/store" replace />} />
                  <Route path="/creative-soul-hub" element={<CreativeSoulHub />} />
                  {/* ROUTE DEFINITION: /creative-soul/store renders CreativeSoulStore.tsx */}
                  <Route path="/creative-soul/store" element={<CreativeSoulStore />} />
                  <Route path="/creative-soul/tool" element={<CreativeSoulTool />} />
                  <Route path="/creative-soul/meditation" element={<MeditationToolWithBoundary />} />
                  <Route path="/creative-soul/siddha-oracle" element={<SiddhaSoundAlchemyOracle />} />
                  <Route path="/siddha-oracle-about" element={<SiddhaOracleAbout />} />
                  <Route path="/creative-soul-about" element={<CreativeSoulAbout />} />
                  {/* Legacy routes */}
                  <Route path="/creative-soul-tool" element={<CreativeSoulTool />} />
                  <Route path="/creative-soul-meditation-tool" element={<MeditationToolWithBoundary />} />
                </Route>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/social-automation" element={<SQISocialAutomation />} />
                  <Route path="/admin/grant-access" element={<AdminGrantAccess />} />
                  <Route path="/admin/meditations" element={<AdminMeditations />} />
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
                  <Route path="/admin/divine-transmissions" element={<AdminDivineTransmissions />} />
                  <Route path="/admin/books" element={<AdminScripturalBooks />} />
                  <Route path="/admin/books/:id" element={<AdminScripturalBookView />} />
                </Route>
              </Route>
                <Route path="/akashic-codex" element={<AkashicCodex />} />
                <Route path="/living-portrait-codex" element={<LivingPortraitCodex />} />
                <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SHCProvider>
            <BrowserRouter>
              <ConversionProvider>
                <MusicPlayerProvider>
                  <GitaTransitionOverlay />
                  <AmbientAudioProvider>
                    <Toaster />
                    <Sonner />
                    <DebugBanner />
                    <ProfileLanguageSync />
                    <CodexBackfillSentinel />
                    <Suspense
                      fallback={
                        <div className="min-h-screen flex items-center justify-center bg-[#030303]" style={{ background: "radial-gradient(ellipse at 15% 20%, rgba(30, 27, 75, 0.7) 0%, transparent 50%), #030303" }}>
                          <Loader2 className="w-10 h-10 animate-spin text-[#00F2FE]" />
                        </div>
                      }
                    >
                      <AppRoutes />
                    </Suspense>
                  </AmbientAudioProvider>
                </MusicPlayerProvider>
              </ConversionProvider>
            </BrowserRouter>
          </SHCProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
