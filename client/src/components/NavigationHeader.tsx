import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X, ChevronDown, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@assets/kOSCOCO_1762050897989.png";

interface NavigationHeaderProps {
  currentPhase?: string;
  onUploadClick?: () => void;
  onNavigate?: (path: string) => void;
}

export default function NavigationHeader({ 
  currentPhase = "PHASE 2: TOP 50 ACTIVE",
  onUploadClick,
  onNavigate
}: NavigationHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/logout", "POST");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t('nav.logoutSuccess'),
        description: t('nav.logoutSuccessDesc'),
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: t('nav.logoutFailed'),
        description: t('nav.logoutFailedDesc'),
        variant: "destructive",
      });
    },
  });
  
  const navItems = [
    { label: t('nav.categories'), path: '/categories' },
    { label: t('nav.howItWorks'), path: '/how-it-works' },
  ];

  const judgeMenuItems = [
    { label: t('nav.viewJudges'), path: '/judges' },
    { label: 'Judge Login', path: '/judge/login' },
  ];
  
  const leaderboardMenuItems = [
    { label: t('nav.viewLeaderboard'), path: '/leaderboard' },
    { label: t('nav.prizes'), path: '/prizes' },
  ];
  
  const affiliateMenuItems = [
    { label: t('nav.joinAffiliate'), path: '/affiliate' },
    { label: 'Affiliate Login', path: '/affiliate/login' },
    { label: t('nav.affiliateDashboard'), path: '/affiliate/dashboard' },
  ];
  
  const advertiserMenuItems = [
    { label: 'Advertiser Login', path: '/advertiser/login' },
    { label: 'Advertiser Sign Up', path: '/advertiser/signup' },
  ];
  
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <button 
            onClick={() => setLocation("/")}
            className="flex items-center hover-elevate active-elevate-2 rounded-md p-2 -ml-2"
            data-testid="button-logo-home"
          >
            <img src={logo} alt="KOSCOCO" className="h-8" data-testid="img-logo" />
          </button>
          
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="min-h-11"
                onClick={() => onNavigate?.(item.path)}
                data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </Button>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  data-testid="link-judges"
                >
                  {t('nav.judges')}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {judgeMenuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={() => onNavigate?.(item.path)}
                    data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  data-testid="link-leaderboard"
                >
                  {t('nav.leaderboard')}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {leaderboardMenuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={() => onNavigate?.(item.path)}
                    data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  data-testid="link-affiliate"
                >
                  {t('nav.affiliate')}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {affiliateMenuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={() => {
                      if (item.path === '/affiliate/dashboard' && !isAuthenticated) {
                        setLocation('/affiliate/login');
                      } else {
                        onNavigate?.(item.path);
                      }
                    }}
                    data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  data-testid="link-advertise"
                >
                  Advertise
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => onNavigate?.('/advertise')}
                  data-testid="menu-advertise-platform"
                >
                  Advertising Platform
                </DropdownMenuItem>
                {advertiserMenuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={() => onNavigate?.(item.path)}
                    data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
          
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button
                  className="min-h-11"
                  onClick={() => setLocation("/register")}
                  data-testid="button-register"
                >
                  {t('nav.register')}
                </Button>
                <Button 
                  variant="outline"
                  className="min-h-11"
                  onClick={onUploadClick}
                  data-testid="button-upload-nav"
                >
                  {t('nav.uploadVideo')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="min-h-11" data-testid="button-user-menu">
                      <User className="w-4 h-4 mr-2" />
                      {user?.firstName || t('nav.user')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onNavigate?.('/dashboard')} data-testid="menu-dashboard">
                      {t('nav.dashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate?.('/creator')} data-testid="menu-creator-dashboard">
                      Creator Dashboard
                    </DropdownMenuItem>
                    {user?.isAdmin && (
                      <DropdownMenuItem onClick={() => onNavigate?.('/admin')} data-testid="menu-admin-dashboard">
                        {t('nav.adminDashboard')}
                      </DropdownMenuItem>
                    )}
                    {user?.isJudge && (
                      <DropdownMenuItem onClick={() => onNavigate?.('/judge-dashboard')} data-testid="menu-judge-dashboard">
                        {t('nav.judgeDashboard')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()} data-testid="menu-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => setLocation("/login")}
                  data-testid="button-login"
                >
                  {t('nav.login')}
                </Button>
                <Button
                  className="min-h-11"
                  onClick={() => setLocation("/register")}
                  data-testid="button-register"
                >
                  {t('nav.register')}
                </Button>
              </>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-11 min-w-11"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="min-h-11 justify-start"
                onClick={() => {
                  onNavigate?.(item.path);
                  setMobileMenuOpen(false);
                }}
              >
                {item.label}
              </Button>
            ))}
            
            <div className="mt-2">
              <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                {t('nav.leaderboard')}
              </div>
              {leaderboardMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="min-h-11 justify-start w-full"
                  onClick={() => {
                    onNavigate?.(item.path);
                    setMobileMenuOpen(false);
                  }}
                  data-testid={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            
            <div className="mt-2">
              <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                {t('nav.affiliate')}
              </div>
              {affiliateMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="min-h-11 justify-start w-full"
                  onClick={() => {
                    if (item.path === '/affiliate/dashboard' && !isAuthenticated) {
                      setLocation('/affiliate/login');
                    } else {
                      onNavigate?.(item.path);
                    }
                    setMobileMenuOpen(false);
                  }}
                  data-testid={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="mt-2">
              <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                Advertise
              </div>
              <Button
                variant="ghost"
                className="min-h-11 justify-start w-full"
                onClick={() => {
                  onNavigate?.('/advertise');
                  setMobileMenuOpen(false);
                }}
                data-testid="mobile-link-advertise"
              >
                Advertising Platform
              </Button>
              {advertiserMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="min-h-11 justify-start w-full"
                  onClick={() => {
                    onNavigate?.(item.path);
                    setMobileMenuOpen(false);
                  }}
                  data-testid={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm font-semibold text-muted-foreground">{t('nav.theme')}</span>
                <ThemeToggle />
              </div>
              {isAuthenticated ? (
                <>
                  <Button
                    className="min-h-11"
                    onClick={() => {
                      setLocation("/register");
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-register"
                  >
                    {t('nav.register')}
                  </Button>
                  <Button 
                    variant="outline"
                    className="min-h-11"
                    onClick={() => {
                      onUploadClick?.();
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-upload"
                  >
                    {t('nav.uploadVideo')}
                  </Button>
                  <Button 
                    variant="ghost"
                    className="min-h-11"
                    onClick={() => {
                      setLocation("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-dashboard"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.dashboard')}
                  </Button>
                  <Button 
                    variant="ghost"
                    className="min-h-11"
                    onClick={() => {
                      setLocation("/creator");
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-creator-dashboard"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Creator Dashboard
                  </Button>
                  <Button 
                    variant="ghost"
                    className="min-h-11"
                    onClick={() => {
                      logoutMutation.mutate();
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost"
                    className="min-h-11"
                    onClick={() => {
                      setLocation("/login");
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-login"
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    className="min-h-11"
                    onClick={() => {
                      setLocation("/register");
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-register"
                  >
                    {t('nav.register')}
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
