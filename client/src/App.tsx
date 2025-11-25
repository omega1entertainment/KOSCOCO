import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LanguageSelectionModal from "@/components/LanguageSelectionModal";
import { useAuth } from "@/hooks/useAuth";
import TopBar from "@/components/TopBar";
import NavigationHeader from "@/components/NavigationHeader";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Upload from "@/pages/Upload";
import Dashboard from "@/pages/Dashboard";
import AffiliateProgram from "@/pages/AffiliateProgram";
import AffiliateLogin from "@/pages/AffiliateLogin";
import AffiliateDashboard from "@/pages/AffiliateDashboard";
import Categories from "@/pages/Categories";
import CategoryVideos from "@/pages/CategoryVideos";
import VideoPlayer from "@/pages/VideoPlayer";
import AdminDashboard from "@/pages/AdminDashboard";
import Leaderboard from "@/pages/Leaderboard";
import Prizes from "@/pages/Prizes";
import HowItWorks from "@/pages/HowItWorks";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import AffiliateTerms from "@/pages/AffiliateTerms";
import Terms from "@/pages/Terms";
import VerifyEmail from "@/pages/VerifyEmail";
import JudgeDashboard from "@/pages/JudgeDashboard";
import Judges from "@/pages/Judges";
import JudgeProfile from "@/pages/JudgeProfile";
import JudgeLogin from "@/pages/JudgeLogin";
import AdvertiserLogin from "@/pages/AdvertiserLogin";
import AdvertiserSignup from "@/pages/AdvertiserSignup";
import AdvertiserTerms from "@/pages/AdvertiserTerms";
import AdvertiserDashboard from "@/pages/AdvertiserDashboard";
import CreateCampaign from "@/pages/CreateCampaign";
import EditCampaign from "@/pages/EditCampaign";
import CreateAd from "@/pages/CreateAd";
import CreatorDashboard from "@/pages/CreatorDashboard";
import EditProfile from "@/pages/EditProfile";
import ThankYou from "@/pages/ThankYou";
import Contact from "@/pages/Contact";
import CompetitionRules from "@/pages/CompetitionRules";
import Advertise from "@/pages/Advertise";
import FAQ from "@/pages/FAQ";
import Help from "@/pages/Help";
import Feed from "@/pages/Feed";
import GiftPage from "@/pages/GiftPage";
import CreatorWallet from "@/pages/CreatorWallet";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function Router() {
  const { isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  const handleUploadClick = () => {
    setLocation("/upload");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <LanguageSelectionModal />
      <TopBar />
      <NavigationHeader onNavigate={handleNavigate} onUploadClick={handleUploadClick} />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/thank-you" component={ThankYou} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/upload" component={Upload} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/affiliate" component={AffiliateProgram} />
          <Route path="/affiliate/login" component={AffiliateLogin} />
          <Route path="/affiliate/dashboard" component={AffiliateDashboard} />
          <Route path="/categories" component={Categories} />
          <Route path="/category/:id" component={CategoryVideos} />
          <Route path="/video/:permalink" component={VideoPlayer} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/prizes" component={Prizes} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/affiliate-terms" component={AffiliateTerms} />
          <Route path="/contact" component={Contact} />
          <Route path="/faq" component={FAQ} />
          <Route path="/help" component={Help} />
          <Route path="/rules" component={CompetitionRules} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/judge-dashboard" component={JudgeDashboard} />
          <Route path="/judge/login" component={JudgeLogin} />
          <Route path="/judges" component={Judges} />
          <Route path="/judges/:id" component={JudgeProfile} />
          <Route path="/advertise" component={Advertise} />
          <Route path="/advertiser/login" component={AdvertiserLogin} />
          <Route path="/advertiser/signup" component={AdvertiserSignup} />
          <Route path="/advertiser/terms" component={AdvertiserTerms} />
          <Route path="/advertiser/dashboard" component={AdvertiserDashboard} />
          <Route path="/advertiser/campaign/create" component={CreateCampaign} />
          <Route path="/advertiser/campaign/:id/edit" component={EditCampaign} />
          <Route path="/advertiser/campaign/:id/create-ad" component={CreateAd} />
          <Route path="/creator" component={CreatorDashboard} />
          <Route path="/creator/wallet" component={CreatorWallet} />
          <Route path="/edit-profile" component={EditProfile} />
          <Route path="/feed" component={Feed} />
          <Route path="/gift/:videoId" component={GiftPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
