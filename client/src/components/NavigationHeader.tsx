import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import logo from "@assets/kOSCOCO_1762050897989.png";

interface NavigationHeaderProps {
  currentPhase?: string;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onUploadClick?: () => void;
  onNavigate?: (path: string) => void;
}

export default function NavigationHeader({ 
  currentPhase = "PHASE 2: TOP 50 ACTIVE",
  onLoginClick,
  onRegisterClick,
  onUploadClick,
  onNavigate
}: NavigationHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <img src={logo} alt="KOSCOCO" className="h-8" data-testid="img-logo" />
            
            <nav className="hidden md:flex items-center gap-3">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className="text-sm font-medium hover-elevate px-2 py-2 rounded-md transition-colors"
                  onClick={() => onNavigate?.(item.path)}
                  data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </button>
              ))}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-sm font-medium hover-elevate px-2 py-2 rounded-md transition-colors flex items-center gap-1"
                    data-testid="link-leaderboard"
                  >
                    Leaderboard
                    <ChevronDown className="w-4 h-4" />
                  </button>
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
                  <button
                    className="text-sm font-medium hover-elevate px-2 py-2 rounded-md transition-colors flex items-center gap-1"
                    data-testid="link-affiliate"
                  >
                    Affiliate
                    <ChevronDown className="w-4 h-4" />
                  </button>
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
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onUploadClick}
              data-testid="button-upload-nav"
            >
              Upload Video
            </Button>
            <Button 
              variant="ghost" 
              onClick={onLoginClick}
              data-testid="button-login"
            >
              Login
            </Button>
            <Button 
              onClick={onRegisterClick}
              data-testid="button-register"
            >
              Register
            </Button>
          </div>
          
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="text-left px-4 py-3 hover-elevate rounded-md"
                onClick={() => {
                  onNavigate?.(item.path);
                  setMobileMenuOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
            
            <div className="mt-2">
              <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                Leaderboard
              </div>
              {leaderboardMenuItems.map((item) => (
                <button
                  key={item.label}
                  className="text-left px-4 py-3 hover-elevate rounded-md w-full"
                  onClick={() => {
                    onNavigate?.(item.path);
                    setMobileMenuOpen(false);
                  }}
                  data-testid={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            
            <div className="mt-2">
              <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                Affiliate
              </div>
              {affiliateMenuItems.map((item) => (
                <button
                  key={item.label}
                  className="text-left px-4 py-3 hover-elevate rounded-md w-full"
                  onClick={() => {
                    onNavigate?.(item.path);
                    setMobileMenuOpen(false);
                  }}
                  data-testid={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={onUploadClick}>Upload Video</Button>
              <Button variant="ghost" onClick={onLoginClick}>Login</Button>
              <Button onClick={onRegisterClick}>Register</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
