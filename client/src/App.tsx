import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import VerifyEmail from "@/pages/VerifyEmail";
import NotFound from "@/pages/not-found";

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
      <TopBar />
      <NavigationHeader onNavigate={handleNavigate} onUploadClick={handleUploadClick} />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/upload" component={Upload} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/affiliate" component={AffiliateProgram} />
          <Route path="/affiliate/dashboard" component={AffiliateDashboard} />
          <Route path="/categories" component={Categories} />
          <Route path="/category/:id" component={CategoryVideos} />
          <Route path="/video/:id" component={VideoPlayer} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/prizes" component={Prizes} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/affiliate-terms" component={AffiliateTerms} />
          <Route path="/admin" component={AdminDashboard} />
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
