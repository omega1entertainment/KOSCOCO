import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/logout", "POST");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const navItems = [
    { label: 'Categories', path: '/categories' },
    { label: 'How It Works', path: '/how-it-works' },
  ];
  
  const leaderboardMenuItems = [
    { label: 'View Leaderboard', path: '/leaderboard' },
    { label: 'Prizes', path: '/prizes' },
  ];
  
  const affiliateMenuItems = [
    { label: 'Join Program', path: '/affiliate' },
    { label: 'My Dashboard', path: '/affiliate/dashboard' },
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
                  data-testid="link-leaderboard"
                >
                  Leaderboard
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
                  Affiliate
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {affiliateMenuItems.map((item) => (
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
          
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button 
                  variant="outline"
                  className="min-h-11"
                  onClick={onUploadClick}
                  data-testid="button-upload-nav"
                >
                  Upload Video
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="min-h-11" data-testid="button-user-menu">
                      <User className="w-4 h-4 mr-2" />
                      {user?.firstName || 'User'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onNavigate?.('/dashboard')} data-testid="menu-dashboard">
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()} data-testid="menu-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
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
                  Login
                </Button>
                <Button
                  className="min-h-11"
                  onClick={() => setLocation("/register")}
                  data-testid="button-register"
                >
                  Register
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
                Leaderboard
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
                Affiliate
              </div>
              {affiliateMenuItems.map((item) => (
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
              {isAuthenticated ? (
                <>
                  <Button 
                    variant="outline"
                    className="min-h-11"
                    onClick={() => {
                      onUploadClick?.();
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-upload"
                  >
                    Upload Video
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
                    Dashboard
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
                    Logout
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
                    Login
                  </Button>
                  <Button
                    className="min-h-11"
                    onClick={() => {
                      setLocation("/register");
                      setMobileMenuOpen(false);
                    }}
                    data-testid="mobile-button-register"
                  >
                    Register
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
