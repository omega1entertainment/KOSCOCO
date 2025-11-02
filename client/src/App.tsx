import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/Home";
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
import NotFound from "@/pages/not-found";

function Router() {
  const { isLoading } = useAuth();

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

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/upload" component={Upload} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/affiliate" component={AffiliateProgram} />
      <Route path="/affiliate/dashboard" component={AffiliateDashboard} />
      <Route path="/categories" component={Categories} />
      <Route path="/category/:id" component={CategoryVideos} />
      <Route path="/video/:id" component={VideoPlayer} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
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
