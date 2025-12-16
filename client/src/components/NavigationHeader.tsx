import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { Menu, X, ChevronDown, LogOut, User, Globe, Search } from "lucide-react";
import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
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
  const [expandedLeaderboard, setExpandedLeaderboard] = useState(false);
  const [expandedAffiliate, setExpandedAffiliate] = useState(false);
  const [expandedAdvertise, setExpandedAdvertise] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

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
    { label: 'Feed', path: '/video/' },
    { label: t('nav.categories'), path: '/categories' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'FAQ', path: '/faq' },
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
            className="flex items-center flex-shrink-0 hover-elevate active-elevate-2 rounded-md p-2 -ml-2"
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

            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => onNavigate?.('/help')}
              data-testid="link-help"
            >
              Help
            </Button>
          </nav>
          
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Button 
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => setLocation("/login")}
                  data-testid="button-login"
                >
                  {t('nav.login')}
                </Button>
              </>
            ) : (
              <>
                <NotificationBell />
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
            <form onSubmit={handleSearch} className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-mobile-search"
                />
              </div>
              <Button type="submit" size="icon" data-testid="button-mobile-search">
                <Search className="w-4 h-4" />
              </Button>
            </form>
            
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
              <Button
                variant="ghost"
                className="min-h-11 justify-between w-full px-4"
                onClick={() => setExpandedLeaderboard(!expandedLeaderboard)}
                data-testid="button-leaderboard-submenu"
              >
                <span className="text-sm font-semibold">{t('nav.leaderboard')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedLeaderboard ? 'rotate-180' : ''}`} />
              </Button>
              {expandedLeaderboard && leaderboardMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="min-h-11 justify-start w-full ml-4"
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
              <Button
                variant="ghost"
                className="min-h-11 justify-between w-full px-4"
                onClick={() => setExpandedAffiliate(!expandedAffiliate)}
                data-testid="button-affiliate-submenu"
              >
                <span className="text-sm font-semibold">{t('nav.affiliate')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedAffiliate ? 'rotate-180' : ''}`} />
              </Button>
              {expandedAffiliate && affiliateMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="min-h-11 justify-start w-full ml-4"
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
              <Button
                variant="ghost"
                className="min-h-11 justify-between w-full px-4"
                onClick={() => setExpandedAdvertise(!expandedAdvertise)}
                data-testid="button-advertise-submenu"
              >
                <span className="text-sm font-semibold">Advertise</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedAdvertise ? 'rotate-180' : ''}`} />
              </Button>
              {expandedAdvertise && (
                <>
                  <Button
                    variant="ghost"
                    className="min-h-11 justify-start w-full ml-4"
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
                      className="min-h-11 justify-start w-full ml-4"
                      onClick={() => {
                        onNavigate?.(item.path);
                        setMobileMenuOpen(false);
                      }}
                      data-testid={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.label}
                    </Button>
                  ))}
                </>
              )}
            </div>

            <Button
              variant="ghost"
              className="min-h-11 justify-start w-full"
              onClick={() => {
                onNavigate?.('/help');
                setMobileMenuOpen(false);
              }}
              data-testid="mobile-link-help"
            >
              Help
            </Button>
            
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm font-semibold text-muted-foreground">{t('nav.theme')}</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm font-semibold text-muted-foreground">Language</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleLanguage}
                  className="h-7 px-2 text-xs font-semibold"
                  data-testid="button-mobile-language-toggle"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  {language === 'en' ? 'EN' : 'FR'}
                </Button>
              </div>
              {!isAuthenticated && (
                <>
                  <Button 
                    variant="ghost"
                    className="min-h-11 justify-start"
                    onClick={() => {
                      setLocation("/login");
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-login"
                  >
                    {t('nav.login')}
                  </Button>
                </>
              )}
              {isAuthenticated && (
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
                  {user?.isAdmin && (
                    <Button 
                      variant="ghost"
                      className="min-h-11"
                      onClick={() => {
                        setLocation("/admin");
                        setMobileMenuOpen(false);
                      }}
                      data-testid="mobile-button-admin-dashboard"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {t('nav.adminDashboard')}
                    </Button>
                  )}
                  {user?.isJudge && (
                    <Button 
                      variant="ghost"
                      className="min-h-11"
                      onClick={() => {
                        setLocation("/judge-dashboard");
                        setMobileMenuOpen(false);
                      }}
                      data-testid="mobile-button-judge-dashboard"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {t('nav.judgeDashboard')}
                    </Button>
                  )}
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
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
